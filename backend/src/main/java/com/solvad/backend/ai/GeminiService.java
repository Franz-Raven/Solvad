package com.solvad.backend.ai;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.solvad.backend.problem.core.EnhancedProblemResponse;
import com.solvad.backend.problem.scope.GenerateScopeResponse;
import com.solvad.backend.problem.subtask.SubtaskResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    public static final String ACADEMIC_PROGRAMS_TEXT =
            "AVAILABLE ACADEMIC PROGRAMS (use EXACT names for departmentFocus):\n"
            + "Information Technology & Computer Science: BS Information Technology, BS Computer Science, BS Computer Engineering, BS Information Systems, BS Entertainment and Multimedia Computing, Associate in Computer Technology\n"
            + "Engineering: BS Civil Engineering, BS Electrical Engineering, BS Electronics Engineering, BS Mechanical Engineering, BS Chemical Engineering, BS Industrial Engineering, BS Geodetic Engineering, BS Sanitary Engineering, BS Mining Engineering, BS Metallurgical Engineering, BS Ceramic Engineering, BS Agricultural and Biosystems Engineering\n"
            + "Business & Management: BS Business Administration, BS Accountancy, BS Management Accounting, BS Accounting Information System, BS Entrepreneurship, BS Office Administration, BS Marketing Management, BS Finance, BS Economics, BS Real Estate Management\n"
            + "Education: Bachelor of Elementary Education, Bachelor of Secondary Education, Bachelor of Physical Education, Bachelor of Special Needs Education, Bachelor of Early Childhood Education, BS in Industrial Education\n"
            + "Health Sciences: BS Nursing, BS Pharmacy, BS Physical Therapy, BS Occupational Therapy, BS Medical Technology, BS Radiologic Technology, BS Nutrition and Dietetics, BS Midwifery, BS Respiratory Therapy, BS Speech-Language Pathology\n"
            + "Architecture & Design: BS Architecture, BS Interior Design, BS Landscape Architecture, Bachelor of Fine Arts, BS Industrial Design\n"
            + "Social Sciences & Humanities: AB Psychology, AB Political Science, AB Communication, AB Mass Communication, AB Broadcasting, AB Journalism, AB English, AB Filipino, AB History, AB Philosophy, AB Sociology, AB Social Work, BS Psychology, BS Social Work\n"
            + "Hospitality & Tourism: BS Hotel and Restaurant Management, BS Tourism Management, BS Hospitality Management, BS Cruise Ship Management, BS Culinary Management\n"
            + "Agriculture & Fisheries: BS Agriculture, BS Agricultural Technology, BS Agribusiness, BS Fisheries, BS Food Technology, BS Forestry, BS Development Communication\n"
            + "Science & Mathematics: BS Biology, BS Chemistry, BS Physics, BS Mathematics, BS Statistics, BS Applied Mathematics, BS Environmental Science, BS Marine Biology\n"
            + "Maritime Studies: BS Marine Transportation, BS Marine Engineering, BS Naval Architecture and Marine Engineering\n"
            + "Criminology & Public Safety: BS Criminology, BS Forensic Science\n"
            + "Other Programs: BS Aviation, BS Aeronautical Engineering, BS Library and Information Science, BS Customs Administration, AB Legal Management, Bachelor of Laws (LLB)\n";

    public static final String SDG_TEXT =
            "SUSTAINABLE DEVELOPMENT GOALS (SDG) - Use EXACT names for sdgFocus:\n"
            + "1. No Poverty\n"
            + "2. Zero Hunger\n"
            + "3. Good Health and Well-being\n"
            + "4. Quality Education\n"
            + "5. Gender Equality\n"
            + "6. Clean Water and Sanitation\n"
            + "7. Affordable and Clean Energy\n"
            + "8. Decent Work and Economic Growth\n"
            + "9. Industry, Innovation and Infrastructure\n"
            + "10. Reduced Inequalities\n"
            + "11. Sustainable Cities and Communities\n"
            + "12. Responsible Consumption and Production\n"
            + "13. Climate Action\n"
            + "14. Life Below Water\n"
            + "15. Life on Land\n"
            + "16. Peace, Justice and Strong Institutions\n"
            + "17. Partnerships for the Goals\n";

    @Value("${gemini.key}")
    private String geminiApiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeminiService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public GenerateScopeResponse generateSubtasks(String title, String backgroundContext,
                                                  String primaryStatement, String objectives,
                                                  String constraints, String preferredProgram,
                                                  List<MultipartFile> attachments) {
        return generateSubtasks(title, backgroundContext, primaryStatement, objectives, constraints,
                preferredProgram, attachments, null, null);
    }

    /**
     * Generates the scope. When previousAttempt is non-null, the prompt includes a REVISION REQUEST
     * with that attempt and the reviewer's feedback so Gemini can correct it.
     */
    public GenerateScopeResponse generateSubtasks(String title, String backgroundContext,
                                                  String primaryStatement, String objectives,
                                                  String constraints, String preferredProgram,
                                                  List<MultipartFile> attachments,
                                                  GenerateScopeResponse previousAttempt,
                                                  List<String> reviewerFeedback) {
        String prompt = buildPrompt(title, backgroundContext, primaryStatement, objectives, constraints,
                preferredProgram, previousAttempt, reviewerFeedback);

        log.info("Sending scope generation prompt to Gemini API ({} attachment(s), revision={})",
                attachments == null ? 0 : attachments.size(), previousAttempt != null);

        GenerateScopeResponse parsed;
        try {
            String geminiResponse = callGeminiAPI(prompt, attachments);
            parsed = parseGeminiResponse(geminiResponse);
        } catch (RuntimeException e) {
            // Log only the exception type: RestClientException messages can contain the
            // request URL, which carries the API key as a query parameter.
            log.warn("Gemini scope generation failed: {}", e.getClass().getName());
            throw new AiServiceUnavailableException("AI scoping service is currently unavailable.", e);
        }

        EnhancedProblemResponse enhancedProblem = parsed.getEnhancedProblem();
        if (enhancedProblem == null
                || enhancedProblem.getTitle() == null || enhancedProblem.getTitle().isBlank()
                || enhancedProblem.getPrimaryStatement() == null || enhancedProblem.getPrimaryStatement().isBlank()) {
            log.warn("Gemini returned an incomplete specification (missing enhancedProblem, title or primaryStatement)");
            throw new AiServiceUnavailableException("AI returned an incomplete specification.");
        }

        log.info("Successfully parsed {} subtasks from Gemini response", parsed.getGeneratedSubtasks().size());
        return parsed;
    }

    private String buildPrompt(String title, String backgroundContext, String primaryStatement,
                              String objectives, String constraints, String preferredProgram,
                              GenerateScopeResponse previousAttempt, List<String> reviewerFeedback) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an expert at analyzing complex industry problems and determining if they can be broken down into collaborative sub-tasks.\n\n");
        prompt.append("Problem Title: ").append(title).append("\n");
        if (backgroundContext != null && !backgroundContext.isEmpty()) {
            prompt.append("Background: ").append(backgroundContext).append("\n");
        }
        prompt.append("Primary Statement: ").append(primaryStatement).append("\n");
        if (objectives != null && !objectives.isEmpty()) {
            prompt.append("Objectives: ").append(objectives).append("\n");
        }
        if (constraints != null && !constraints.isEmpty()) {
            prompt.append("Constraints: ").append(constraints).append("\n");
        }
        prompt.append("Target Academic Program: ").append(preferredProgram).append("\n\n");

        prompt.append("If files are attached, analyze their content to better understand the problem context.\n\n");

        prompt.append("SCOPE DECISION: Analyze this problem and decide its scopeType.\n");
        prompt.append("- \"SINGULAR\" = one cohesive challenge that a single capstone team can solve.\n");
        prompt.append("- \"SYSTEMIC\" = contains 2-3 genuinely independent functional modules, physical sub-structures, or operational frameworks (follow the guidelines below).\n");
        prompt.append("- If SINGULAR: generatedSubproblems must contain EXACTLY 1 item. It restates the whole problem as one actionable capstone task. Its departmentFocus is the best-fitting program, normally the Target Academic Program.\n");
        prompt.append("- If SYSTEMIC: generatedSubproblems must contain 2 or 3 items.\n\n");

        prompt.append("IMPORTANT GUIDELINES:\n");
        prompt.append("- DECOMPOSITION TYPE: Break the problem down into massive, independent functional modules, physical sub-structures, or distinct operational frameworks.\n");
        prompt.append("- NO SDLC/PHASES: DO NOT break the problem down by chronological phases (e.g., NEVER output 'Planning', 'Testing', 'Data Gathering', or 'Implementation').\n");
        prompt.append("- NO ARCHITECTURAL LAYERS: For software problems, DO NOT split by layers (e.g., NEVER output 'Database Layer', 'API Layer', 'Frontend UI').\n");
        prompt.append("- THE CAPSTONE RULE: Each subtask must be complex and distinct enough to serve as an independent thesis or capstone project for adedicated team.\n");
        prompt.append("- ANTI-SOFTWARE BIAS: If the problem is physical, environmental, or business-focused, DO NOT invent software, dashboards, or mobile apps unless explicitly mentioned in the problem statement.\n");
        prompt.append("- DOMAIN STRICTNESS: The subtasks must strictly use the tools, deliverables, and terminology of the target academic program (e.g., Civil Engineering tasks must yield physical designs, blueprints, or material studies).\n");
        prompt.append("\n");

        prompt.append("EXAMPLE DECOMPOSITIONS:\n");

        prompt.append("Example 1 (Software/IT Problem - Hospital Management):\n");
        prompt.append("- BAD (Phases/Layers): [\"Database Schema Design\", \"API Integration\", \"Security Audit\"]\n");
        prompt.append("- GOOD (Modules): [\"Core Doctor-Patient Appointment Portal\", \"AI-Powered Handwriting OCR Scanner for Medical Notes\", \"IoT Patient Vitals Hardware Integration\"]\n\n");

        prompt.append("Example 2 (Civil/Environmental Engineering - River Flooding):\n");
        prompt.append("- BAD (Phases/Software): [\"Site Inspection\", \"Build aFlood Warning Mobile App\", \"Post-Construction Testing\"]\n");
        prompt.append("- GOOD (Physical Sub-structures): [\"Hydrological Catchment & Spillway Design\", \"Reinforced Retaining Wall & Embankment Structural Engineering\", \"Soil Permeability & Riparian Buffer Zone Analysis\"]\n\n");

        prompt.append("Example 3 (Business/Supply Chain - Failing Delivery Logistics):\n");
        prompt.append("- BAD (Phases): [\"Market Research\", \"Strategy Implementation\", \"Financial Review\"]\n");
        prompt.append("- GOOD (Operational Frameworks): [\"Last-Mile Routing Optimization Model\", \"Warehouse Inventory & Predictive Stock Framework\", \"Third-Party Vendor Procurement & SLA Structuring\"]\n\n");// prompt.append("IMPORTANT GUIDELINES:\n");
        // prompt.append("- Return 0 subtasks if the problem is straightforward and cannot be meaningfully decomposed\n");
        // prompt.append("- Only create subtasks if the problem genuinely requires different expertise areas or process stages\n");
        // prompt.append("- Subtasks should reflect the actual nature of the problem (engineering, environmental, business, etc.)\n");
        // prompt.append("- Each subtask should have aclear departmentFocus that matches the problem domain\n");
        // prompt.append("- DO NOT default to 'Backend/Frontend/Database' unless the problem is explicitly about software development\n\n");
        // prompt.append("Examples of valid departmentFocus areas:\n");
        // prompt.append("- For technical problems: Backend Development, Frontend Development, Database Design, DevOps, UI/UX Design, Mobile Development\n");
        // prompt.append("- For environmental problems: Water Quality Analysis, Structural Assessment, Environmental Impact, Infrastructure Planning\n");
        // prompt.append("- For business problems: Market Research, Financial Analysis, Strategy Development, Operations Management\n");
        // prompt.append("- For engineering problems: Mechanical Design, Electrical Systems, Testing & Validation, Manufacturing Process\n\n");

        prompt.append(ACADEMIC_PROGRAMS_TEXT).append("\n");

        prompt.append(SDG_TEXT).append("\n");

        prompt.append("ADDITIONAL TASK: ENHANCE AND FINALIZE PROBLEM INFORMATION\n");
        prompt.append("In addition to generating subtasks, you must also review and enhance the problem information provided above.\n");
        prompt.append("- Analyze the problem title, background context, primary statement, objectives, and constraints\n");
        prompt.append("- If files are attached, extract additional context, objectives, or constraints mentioned in the documents\n");
        prompt.append("- Refine and improve the problem description to make it clearer and more comprehensive\n");
        prompt.append("- Break down objectives and constraints into clear, separate bullet points (as array items)\n");
        prompt.append("- Ensure each objective and constraint is asingle, actionable statement\n");
        prompt.append("- Assign the MOST APPROPRIATE Sustainable Development Goal (SDG) for the main problem based on its primary focus\n");
        prompt.append("- For each subtask, assign the MOST APPROPRIATE SDG based on its specific focus (subtasks may have different SDGs from the main problem)\n\n");

        prompt.append("Format your response as aJSON object with this EXACT structure:\n");
        prompt.append("{\n");
        prompt.append("  \"scopeType\": \"SINGULAR or SYSTEMIC\",\n");
        prompt.append("  \"scopeRationale\": \"1-2 sentences explaining the decision\",\n");
        prompt.append("  \"enhancedProblem\": {\n");
        prompt.append("    \"title\": \"Enhanced/refined problem title\",\n");
        prompt.append("    \"backgroundContext\": \"Enhanced background context (incorporating any additional info from uploaded files)\",\n");
        prompt.append("    \"primaryStatement\": \"Enhanced primary problem statement\",\n");
        prompt.append("    \"objectives\": [\"Objective 1\", \"Objective 2\", \"Objective 3\"],\n");
        prompt.append("    \"constraints\": [\"Constraint 1\", \"Constraint 2\", \"Constraint 3\"],\n");
        prompt.append("    \"sdgFocus\": \"Most Appropriate SDG Name\"\n");
        prompt.append("  },\n");
        prompt.append("  \"generatedSubproblems\": [\n");
        prompt.append("    {\"title\": \"Subtask Title\", \"departmentFocus\": \"Exact Program Name\", \"sdgFocus\": \"Most Appropriate SDG Name\", \"description\": \"Detailed description\"},\n");
        prompt.append("    ...\n");
        prompt.append("  ]\n");
        prompt.append("}\n");
        prompt.append("Only return the JSON object, nothing else.");

        if (previousAttempt != null) {
            appendRevisionRequest(prompt, previousAttempt, reviewerFeedback);
        }

        return prompt.toString();
    }

    private void appendRevisionRequest(StringBuilder prompt, GenerateScopeResponse previousAttempt,
                                       List<String> reviewerFeedback) {
        prompt.append("\n\nREVISION REQUEST\n");
        prompt.append("A reviewer checked your previous attempt for this problem and found issues.\n\n");
        prompt.append("Previous attempt:\n");
        prompt.append(objectMapper.valueToTree(toCandidateView(previousAttempt)).toPrettyString()).append("\n\n");
        prompt.append("Reviewer feedback:\n");
        if (reviewerFeedback == null || reviewerFeedback.isEmpty()) {
            prompt.append("- (no specific feedback provided)\n");
        } else {
            for (String item : reviewerFeedback) {
                prompt.append("- ").append(item).append("\n");
            }
        }
        prompt.append("\nProduce a complete, corrected JSON object in exactly the same format that addresses every feedback item. ");
        prompt.append("Do not invent facts that are not in the problem or the attachments.");
    }

    /**
     * The model-facing view of a scope response: the same shape Gemini is asked to produce
     * (no ids, attachments or evaluation). Shared with ClaudeJudgeService.
     */
    static Map<String, Object> toCandidateView(GenerateScopeResponse response) {
        List<Map<String, Object>> subproblems = new ArrayList<>();
        if (response.getGeneratedSubtasks() != null) {
            for (SubtaskResponse subtask : response.getGeneratedSubtasks()) {
                Map<String, Object> view = new LinkedHashMap<>();
                view.put("title", subtask.getTitle());
                view.put("departmentFocus", subtask.getDepartmentFocus());
                view.put("sdgFocus", subtask.getSdgFocus());
                view.put("description", subtask.getDescription());
                subproblems.add(view);
            }
        }

        Map<String, Object> view = new LinkedHashMap<>();
        view.put("scopeType", response.getScopeType());
        view.put("scopeRationale", response.getScopeRationale());
        view.put("enhancedProblem", response.getEnhancedProblem());
        view.put("generatedSubproblems", subproblems);
        return view;
    }

    private String callGeminiAPI(String prompt, List<MultipartFile> attachments) {
        // Use gemini-1.5-flash for multimodal support (handles images, PDFs, Word docs, etc.)
        String url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Build parts array - start with text prompt
        List<Map<String, Object>> parts = new ArrayList<>();
        parts.add(Map.of("text", prompt));

        // Add file attachments as inline data (base64 encoded)
        if (attachments != null && !attachments.isEmpty()) {
            for (MultipartFile file : attachments) {
                try {
                    String mimeType = file.getContentType();
                    byte[] fileBytes = file.getBytes();
                    String base64Data = Base64.getEncoder().encodeToString(fileBytes);

                    // Add inline data part for Gemini to analyze
                    parts.add(Map.of(
                        "inline_data", Map.of(
                            "mime_type", mimeType,
                            "data", base64Data
                        )
                    ));
                } catch (Exception e) {
                    // Skip this file if there's an error reading it
                    System.err.println("Error processing file " + file.getOriginalFilename() + ": " + e.getMessage());
                }
            }
        }

        Map<String, Object> requestBody = Map.of(
            "contents", List.of(
                Map.of("parts", parts)
            )
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.postForObject(url, request, Map.class);

        if (response != null && response.containsKey("candidates")) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            if (!candidates.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> responseParts = (List<Map<String, Object>>) content.get("parts");
                if (!responseParts.isEmpty()) {
                    return (String) responseParts.get(0).get("text");
                }
            }
        }

        throw new RuntimeException("Failed to get response from Gemini API");
    }

    public String callGeminiAPI(String prompt) {
        if (prompt == null || prompt.trim().isEmpty()) {
            throw new IllegalArgumentException("Prompt cannot be empty");
        }
        if (prompt.length() > 30_000) {
            throw new IllegalArgumentException("Prompt exceeds maximum length");
        }
        // remove potential injection
        String sanitizedPrompt = prompt.replaceAll("[\\r\\n]+", " ").trim();
        return callGeminiAPI(sanitizedPrompt, null);
    }

    private GenerateScopeResponse parseGeminiResponse(String response) {
        try {
            // Clean markdown formatting if Gemini includes it
            String jsonString = response.trim();
            jsonString = jsonString.replaceAll("(?s)^```(?:json)?|```$", "").trim();

            // Parse the complete response with enhanced problem and subtasks
            Map<String, Object> responseMap = objectMapper.readValue(
                jsonString,
                new TypeReference<Map<String, Object>>(){}
            );

            // Extract enhanced problem
            EnhancedProblemResponse enhancedProblem = objectMapper.convertValue(
                responseMap.get("enhancedProblem"),
                EnhancedProblemResponse.class
            );

            // Extract generated subproblems
            List<SubtaskResponse> subtasks = objectMapper.convertValue(
                responseMap.get("generatedSubproblems"),
                new TypeReference<List<SubtaskResponse>>(){}
            );

            // Ensure temporary UUIDs are set since Gemini doesn't generate them
            if (subtasks != null) {
                subtasks.forEach(task -> {
                    if (task.getId() == null) task.setId(UUID.randomUUID());
                });
            } else {
                subtasks = new ArrayList<>();
            }

            GenerateScopeResponse parsed = new GenerateScopeResponse(enhancedProblem, subtasks);

            // Scope decision. Missing or inconsistent values are not rejected here;
            // the judge penalizes them.
            Object rawScopeType = responseMap.get("scopeType");
            if (rawScopeType instanceof String scopeType) {
                String normalized = scopeType.trim().toUpperCase(Locale.ROOT);
                if (normalized.equals("SINGULAR") || normalized.equals("SYSTEMIC")) {
                    parsed.setScopeType(normalized);
                }
            }
            Object rawRationale = responseMap.get("scopeRationale");
            if (rawRationale instanceof String rationale && !rationale.isBlank()) {
                parsed.setScopeRationale(rationale.trim());
            }

            return parsed;
        } catch (Exception e) {
            System.err.println("Failed to parse JSON: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to parse Gemini response", e);
        }
    }

}
