package com.solvad.backend.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.solvad.backend.problem.scope.GenerateScopeResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

/**
 * Grades a Gemini-generated scope against a fixed rubric using the Claude Messages API.
 * Every failure is swallowed (logged at WARN) and reported as Optional.empty(), so the
 * scoping flow never fails because of the judge.
 */
@Service
public class ClaudeJudgeService {

    private static final Logger log = LoggerFactory.getLogger(ClaudeJudgeService.class);

    private static final String API_URL = "https://api.anthropic.com/v1/messages";
    private static final String ANTHROPIC_VERSION = "2023-06-01";

    // Current models think by default, and thinking tokens count toward max_tokens.
    // A small cap (e.g. 1500) can be exhausted before the JSON verdict is written.
    private static final int MAX_TOKENS = 16000;

    // Server-side refusal fallback: on a policy decline the API re-runs the request on a
    // fallback model inside the same call. Only sent for models that support it.
    private static final String FALLBACK_BETA = "server-side-fallback-2026-07-01";
    private static final Set<String> FALLBACK_MODELS = Set.of(
            "claude-sonnet-5-5", "claude-opus-5-5", "claude-opus-5", "claude-fable-5-2", "claude-fable-5-1");

    private static final int MAX_FEEDBACK_ITEMS = 6;
    private static final int MAX_LOGGED_ERROR_BODY = 500;

    /** Criterion name -> maximum points. Order matches the rubric. */
    private static final Map<String, Integer> CRITERIA_MAX;
    static {
        Map<String, Integer> criteria = new LinkedHashMap<>();
        criteria.put("faithfulness", 25);
        criteria.put("completeness", 15);
        criteria.put("scopeDecision", 20);
        criteria.put("subtaskQuality", 20);
        criteria.put("programRouting", 10);
        criteria.put("sdgAlignment", 10);
        CRITERIA_MAX = Collections.unmodifiableMap(criteria);
    }

    private static final Set<String> IMAGE_TYPES = Set.of("image/png", "image/jpeg", "image/gif", "image/webp");

    private static final String RUBRIC = """
            You are a strict reviewer grading how well an AI converted a seeker's industry problem into a
            standardized specification and scope. Compare the CANDIDATE OUTPUT against the ORIGINAL SEEKER INPUT
            (and any attachments shown). Do not penalize content that plausibly comes from attachments that were
            not shown to you.
            Score each criterion with an integer:
            1. faithfulness (0-25): every fact in the candidate is supported by the seeker input or attachments.
               Deduct heavily for invented requirements, numbers, technologies or stakeholders, and for dropped or
               contradicted seeker facts.
            2. completeness (0-15): title, backgroundContext, primaryStatement, objectives and constraints are
               present and clear; each objective and constraint is one actionable statement.
            3. scopeDecision (0-20): scopeType is correct. SINGULAR = one cohesive challenge one capstone team can
               solve, with exactly 1 sub-problem covering the whole problem. SYSTEMIC = 2-3 genuinely independent
               functional modules, physical sub-structures or operational frameworks. Score 0 if scopeType is
               missing or the sub-problem count contradicts it.
            4. subtaskQuality (0-20): sub-problems do not overlap, together cover the primary statement, are each
               capstone-sized and actionable, are not split by SDLC phases or architectural layers, and do not
               invent software for non-software problems.
            5. programRouting (0-10): every departmentFocus is an exact program name from the list below and fits
               the work.
            6. sdgAlignment (0-10): every sdgFocus is an exact SDG name from the list below and fits.
            Return ONLY this JSON:
            {"criteria":{"faithfulness":0,"completeness":0,"scopeDecision":0,"subtaskQuality":0,"programRouting":0,"sdgAlignment":0},
             "feedback":["specific, actionable fix naming the exact field or sub-problem"]}
            Give at most 6 feedback items. Use an empty array if nothing needs fixing.
            """
            + "\n" + GeminiService.ACADEMIC_PROGRAMS_TEXT
            + "\n" + GeminiService.SDG_TEXT;

    @Value("${anthropic.key:}")
    private String apiKey;

    @Value("${anthropic.model}")
    private String model;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public ClaudeJudgeService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public record JudgeResult(int totalScore, Map<String, Integer> criteria, List<String> feedback) {
    }

    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String getModel() {
        return model;
    }

    public Optional<JudgeResult> evaluate(String title, String backgroundContext, String primaryStatement,
                                          String objectives, String constraints, String preferredProgram,
                                          List<MultipartFile> attachments, GenerateScopeResponse candidate) {
        if (!isEnabled()) {
            return Optional.empty();
        }

        try {
            Map<String, Object> body = buildRequestBody(title, backgroundContext, primaryStatement, objectives,
                    constraints, preferredProgram, attachments, candidate);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-api-key", apiKey);
            headers.set("anthropic-version", ANTHROPIC_VERSION);
            if (FALLBACK_MODELS.contains(model)) {
                headers.set("anthropic-beta", FALLBACK_BETA);
            }

            ResponseEntity<String> response = restTemplate.exchange(
                    API_URL, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);

            return parseResponse(response.getBody());
        } catch (RestClientResponseException e) {
            // Anthropic error bodies describe the problem (bad param, overloaded, etc.) and never echo the key.
            log.warn("Claude judge HTTP {}: {}", e.getStatusCode().value(),
                    truncate(e.getResponseBodyAsString(), MAX_LOGGED_ERROR_BODY));
        } catch (RestClientException e) {
            // Includes timeouts (ResourceAccessException). The URL in the message carries no credentials.
            log.warn("Claude judge request failed: {}: {}", e.getClass().getSimpleName(), e.getMessage());
        } catch (RuntimeException e) {
            log.warn("Claude judge evaluation failed: {}: {}", e.getClass().getSimpleName(), e.getMessage());
        }
        return Optional.empty();
    }

    private Map<String, Object> buildRequestBody(String title, String backgroundContext, String primaryStatement,
                                                 String objectives, String constraints, String preferredProgram,
                                                 List<MultipartFile> attachments, GenerateScopeResponse candidate) {
        List<Map<String, Object>> blocks = new ArrayList<>();
        List<String> notShown = new ArrayList<>();

        // Documents and images go before the text block that refers to them.
        if (attachments != null) {
            for (MultipartFile file : attachments) {
                String mime = file.getContentType() != null ? file.getContentType().toLowerCase(Locale.ROOT) : "unknown";
                String name = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unnamed";
                boolean isPdf = mime.equals("application/pdf");
                boolean isImage = IMAGE_TYPES.contains(mime);

                if (!isPdf && !isImage) {
                    notShown.add("Attachment not shown to reviewer: " + name + " (" + mime + ")");
                    continue;
                }

                String data;
                try {
                    data = Base64.getEncoder().encodeToString(file.getBytes());
                } catch (IOException e) {
                    log.warn("Claude judge could not read attachment {}: {}", name, e.getClass().getSimpleName());
                    notShown.add("Attachment not shown to reviewer: " + name + " (" + mime + ")");
                    continue;
                }

                blocks.add(Map.of(
                        "type", isPdf ? "document" : "image",
                        "source", Map.of("type", "base64", "media_type", mime, "data", data)
                ));
            }
        }

        StringBuilder text = new StringBuilder();
        text.append("ORIGINAL SEEKER INPUT:\n");
        text.append("Title: ").append(orPlaceholder(title)).append("\n");
        text.append("Background: ").append(orPlaceholder(backgroundContext)).append("\n");
        text.append("Primary Statement: ").append(orPlaceholder(primaryStatement)).append("\n");
        text.append("Objectives: ").append(orPlaceholder(objectives)).append("\n");
        text.append("Constraints: ").append(orPlaceholder(constraints)).append("\n");
        text.append("Target Academic Program: ").append(orPlaceholder(preferredProgram)).append("\n");
        for (String line : notShown) {
            text.append(line).append("\n");
        }
        text.append("\nCANDIDATE OUTPUT:\n");
        text.append(objectMapper.valueToTree(GeminiService.toCandidateView(candidate)).toPrettyString());

        blocks.add(Map.of("type", "text", "text", text.toString()));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("max_tokens", MAX_TOKENS);
        body.put("system", RUBRIC);
        body.put("messages", List.of(Map.of("role", "user", "content", blocks)));
        if (FALLBACK_MODELS.contains(model)) {
            body.put("fallbacks", "default");
        }
        return body;
    }

    private Optional<JudgeResult> parseResponse(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            log.warn("Claude judge returned an empty response body");
            return Optional.empty();
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(responseBody);
        } catch (Exception e) {
            log.warn("Claude judge response was not valid JSON: {}", e.getClass().getSimpleName());
            return Optional.empty();
        }

        String stopReason = root.path("stop_reason").asText("");
        if (stopReason.equals("refusal") || stopReason.equals("max_tokens")) {
            log.warn("Claude judge stopped early (stop_reason={})", stopReason);
            return Optional.empty();
        }

        String text = null;
        for (JsonNode block : root.path("content")) {
            if ("text".equals(block.path("type").asText())) {
                text = block.path("text").asText();
                break;
            }
        }
        if (text == null || text.isBlank()) {
            log.warn("Claude judge response contained no text block");
            return Optional.empty();
        }

        String json = text.trim().replaceAll("(?s)^```(?:json)?|```$", "").trim();
        JsonNode verdict;
        try {
            verdict = objectMapper.readTree(json);
        } catch (Exception e) {
            log.warn("Claude judge verdict was not parseable JSON: {}", e.getClass().getSimpleName());
            return Optional.empty();
        }

        JsonNode criteriaNode = verdict.path("criteria");
        Map<String, Integer> criteria = new LinkedHashMap<>();
        int total = 0;
        for (Map.Entry<String, Integer> criterion : CRITERIA_MAX.entrySet()) {
            JsonNode value = criteriaNode.get(criterion.getKey());
            if (value == null || !value.isNumber()) {
                log.warn("Claude judge verdict is missing criterion '{}'", criterion.getKey());
                return Optional.empty();
            }
            int clamped = Math.max(0, Math.min(criterion.getValue(), value.asInt()));
            criteria.put(criterion.getKey(), clamped);
            total += clamped;
        }

        List<String> feedback = new ArrayList<>();
        for (JsonNode item : verdict.path("feedback")) {
            if (feedback.size() >= MAX_FEEDBACK_ITEMS) {
                break;
            }
            if (item.isTextual() && !item.asText().isBlank()) {
                feedback.add(item.asText().trim());
            }
        }

        return Optional.of(new JudgeResult(total, Collections.unmodifiableMap(criteria), List.copyOf(feedback)));
    }

    private static String orPlaceholder(String value) {
        return value == null || value.isBlank() ? "(not provided)" : value;
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return "";
        }
        return value.length() <= max ? value : value.substring(0, max) + "...";
    }
}
