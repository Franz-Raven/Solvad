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
        criteria.put("fidelity", 20);
        criteria.put("clarity", 20);
        criteria.put("scopeDecision", 20);
        criteria.put("subtaskQuality", 20);
        criteria.put("programRouting", 10);
        criteria.put("sdgAlignment", 10);
        CRITERIA_MAX = Collections.unmodifiableMap(criteria);
    }

    private static final Set<String> IMAGE_TYPES = Set.of("image/png", "image/jpeg", "image/gif", "image/webp");

    private static final String RUBRIC = """
            You are reviewing how well an AI turned a seeker's industry problem into a clear, standardized
            specification and scope for university capstone teams. Seekers often write vague or incomplete problems.
            Expanding them with reasonable, context-appropriate detail is the AI's job and must be rewarded, not
            penalized. Grade the OUTPUT, not the input: a vague input must not lower the score if the output is a
            sensible, well-structured specification. Do not penalize content that plausibly comes from attachments
            that were not shown to you.

            Score each criterion with an integer:
            1. fidelity (0-20): the output keeps the seeker's core problem, goals and stated facts, and does not
               change the problem's focus. Reasonable elaboration and inferred details that fit the context are
               allowed. Deduct only for contradicting the seeker, changing what the problem is about, or presenting
               fabricated hard facts as given (specific numbers, budgets, dates, named organizations or people,
               legal or regulatory claims).
            2. clarity (0-20): the title, background, primary statement, objectives and constraints are clearer,
               more specific and more actionable than the input. Each objective and constraint is a single
               statement a team can act on.
            3. scopeDecision (0-20): the scopeType and the split follow the SCOPE RULES below. If the problem could
               reasonably go either way, accept either choice when the rationale is sensible. Score 0 only if
               scopeType is missing or the sub-problem count contradicts it.
            4. subtaskQuality (0-20): each sub-problem could be taken on by a capstone team, the set covers the
               primary statement, and no sub-problem is an INVALID split under the SCOPE RULES. A data dependency
               between sub-problems with a stated interface is acceptable. Minor overlap is acceptable. Deduct for
               sub-problems that duplicate each other or invent software for clearly non-software problems.
            5. programRouting (0-10): each departmentFocus is the program whose students would do that work, as
               the SCOPE RULES define. Full marks for an exact program name from the list; partial marks if the
               field fits but the name is not exactly from the list.
            6. sdgAlignment (0-10): full marks for any SDG from the list that plausibly fits.

            Calibrate the total like this:
              90-100 = a capstone team could start work immediately; no meaningful issues.
              85-89  = usable with minor edits.
              60-84  = usable, but has a clear problem (questionable scope, duplicated sub-problems, a contradicted
                       or fabricated hard fact).
              below 60 = misrepresents the problem or is not usable.
            When you are torn between two scores for a criterion, choose the higher one.

            Feedback: list only issues that actually cost points, as specific, actionable fixes naming the exact
            field or sub-problem. At most 6 items. Use an empty array if nothing cost points. Give one recommended
            fix per issue, not alternatives, and never recommend a split that the SCOPE RULES call invalid.

            Return ONLY this JSON:
            {"criteria":{"fidelity":0,"clarity":0,"scopeDecision":0,"subtaskQuality":0,"programRouting":0,"sdgAlignment":0},
             "feedback":[]}
            """
            + "\n" + GeminiService.SCOPE_RULES_TEXT
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
