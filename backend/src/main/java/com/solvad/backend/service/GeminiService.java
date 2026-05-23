package com.solvad.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.solvad.backend.dto.EnhancedProblemResponse;
import com.solvad.backend.dto.GenerateScopeResponse;
import com.solvad.backend.dto.SubtaskResponse;
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
                                                  String constraints, String requiredProgram,
                                                  List<MultipartFile> attachments) {
        String prompt = buildPrompt(title, backgroundContext, primaryStatement, objectives, constraints, requiredProgram);
        
        System.out.println("[GeminiService] Sending prompt to Gemini API...");

        try {
            String geminiResponse = callGeminiAPI(prompt, attachments);
            System.out.println("[GeminiService] Raw API Response: " + geminiResponse);
            GenerateScopeResponse parsed = parseGeminiResponse(geminiResponse);
            System.out.println("[GeminiService] Successfully parsed " + parsed.getGeneratedSubtasks().size() + " subtasks.");
            return parsed;
        } catch (Exception e) {
            // Fallback to default response if API fails
            System.err.println("[GeminiService] API Connection or Execution failed!");
            System.err.println("Error Message: " + e.getMessage());
            e.printStackTrace();
            return generateFallbackResponse(title, backgroundContext, primaryStatement, objectives, constraints, requiredProgram);
        }
    }

    private String buildPrompt(String title, String backgroundContext, String primaryStatement, 
                              String objectives, String constraints, String requiredProgram) {
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
        prompt.append("Target Academic Program: ").append(requiredProgram).append("\n\n");
        
        prompt.append("If files are attached, analyze their content to better understand the problem context.\n\n");
        
        prompt.append("Analyze this problem and determine if it can be meaningfully broken down into 0-3 sub-tasks.\n\n");
        
        prompt.append("IMPORTANT GUIDELINES:\n");
        prompt.append("- DECOMPOSITION TYPE: Break the problem down into massive, independent functional modules, physical sub-structures, or distinct operational frameworks.\n");
        prompt.append("- NO SDLC/PHASES: DO NOT break the problem down by chronological phases (e.g., NEVER output 'Planning', 'Testing', 'Data Gathering', or 'Implementation').\n");
        prompt.append("- NO ARCHITECTURAL LAYERS: For software problems, DO NOT split by layers (e.g., NEVER output 'Database Layer', 'API Layer', 'Frontend UI').\n");
        prompt.append("- THE CAPSTONE RULE: Each subtask must be complex and distinct enough to serve as an independent thesis or capstone project for a dedicated team.\n");
        prompt.append("- ANTI-SOFTWARE BIAS: If the problem is physical, environmental, or business-focused, DO NOT invent software, dashboards, or mobile apps unless explicitly mentioned in the problem statement.\n");
        prompt.append("- DOMAIN STRICTNESS: The subtasks must strictly use the tools, deliverables, and terminology of the target academic program (e.g., Civil Engineering tasks must yield physical designs, blueprints, or material studies).\n");
        prompt.append("- IF INDIVISIBLE: If the core problem is a single monolithic challenge that cannot be split into distinct functional modules, return an empty array [].\n\n");

        prompt.append("EXAMPLE DECOMPOSITIONS:\n");
        
        prompt.append("Example 1 (Software/IT Problem - Hospital Management):\n");
        prompt.append("- BAD (Phases/Layers): [\"Database Schema Design\", \"API Integration\", \"Security Audit\"]\n");
        prompt.append("- GOOD (Modules): [\"Core Doctor-Patient Appointment Portal\", \"AI-Powered Handwriting OCR Scanner for Medical Notes\", \"IoT Patient Vitals Hardware Integration\"]\n\n");
        
        prompt.append("Example 2 (Civil/Environmental Engineering - River Flooding):\n");
        prompt.append("- BAD (Phases/Software): [\"Site Inspection\", \"Build a Flood Warning Mobile App\", \"Post-Construction Testing\"]\n");
        prompt.append("- GOOD (Physical Sub-structures): [\"Hydrological Catchment & Spillway Design\", \"Reinforced Retaining Wall & Embankment Structural Engineering\", \"Soil Permeability & Riparian Buffer Zone Analysis\"]\n\n");

        prompt.append("Example 3 (Business/Supply Chain - Failing Delivery Logistics):\n");
        prompt.append("- BAD (Phases): [\"Market Research\", \"Strategy Implementation\", \"Financial Review\"]\n");
        prompt.append("- GOOD (Operational Frameworks): [\"Last-Mile Routing Optimization Model\", \"Warehouse Inventory & Predictive Stock Framework\", \"Third-Party Vendor Procurement & SLA Structuring\"]\n\n");// prompt.append("IMPORTANT GUIDELINES:\n");
        // prompt.append("- Return 0 subtasks if the problem is straightforward and cannot be meaningfully decomposed\n");
        // prompt.append("- Only create subtasks if the problem genuinely requires different expertise areas or process stages\n");
        // prompt.append("- Subtasks should reflect the actual nature of the problem (engineering, environmental, business, etc.)\n");
        // prompt.append("- Each subtask should have a clear departmentFocus that matches the problem domain\n");
        // prompt.append("- DO NOT default to 'Backend/Frontend/Database' unless the problem is explicitly about software development\n\n");
        // prompt.append("Examples of valid departmentFocus areas:\n");
        // prompt.append("- For technical problems: Backend Development, Frontend Development, Database Design, DevOps, UI/UX Design, Mobile Development\n");
        // prompt.append("- For environmental problems: Water Quality Analysis, Structural Assessment, Environmental Impact, Infrastructure Planning\n");
        // prompt.append("- For business problems: Market Research, Financial Analysis, Strategy Development, Operations Management\n");
        // prompt.append("- For engineering problems: Mechanical Design, Electrical Systems, Testing & Validation, Manufacturing Process\n\n");
        
        prompt.append("AVAILABLE ACADEMIC PROGRAMS (use EXACT names for departmentFocus):\n");
        prompt.append("Information Technology & Computer Science: BS Information Technology, BS Computer Science, BS Computer Engineering, BS Information Systems, BS Entertainment and Multimedia Computing, Associate in Computer Technology\n");
        prompt.append("Engineering: BS Civil Engineering, BS Electrical Engineering, BS Electronics Engineering, BS Mechanical Engineering, BS Chemical Engineering, BS Industrial Engineering, BS Geodetic Engineering, BS Sanitary Engineering, BS Mining Engineering, BS Metallurgical Engineering, BS Ceramic Engineering, BS Agricultural and Biosystems Engineering\n");
        prompt.append("Business & Management: BS Business Administration, BS Accountancy, BS Management Accounting, BS Accounting Information System, BS Entrepreneurship, BS Office Administration, BS Marketing Management, BS Finance, BS Economics, BS Real Estate Management\n");
        prompt.append("Education: Bachelor of Elementary Education, Bachelor of Secondary Education, Bachelor of Physical Education, Bachelor of Special Needs Education, Bachelor of Early Childhood Education, BS in Industrial Education\n");
        prompt.append("Health Sciences: BS Nursing, BS Pharmacy, BS Physical Therapy, BS Occupational Therapy, BS Medical Technology, BS Radiologic Technology, BS Nutrition and Dietetics, BS Midwifery, BS Respiratory Therapy, BS Speech-Language Pathology\n");
        prompt.append("Architecture & Design: BS Architecture, BS Interior Design, BS Landscape Architecture, Bachelor of Fine Arts, BS Industrial Design\n");
        prompt.append("Social Sciences & Humanities: AB Psychology, AB Political Science, AB Communication, AB Mass Communication, AB Broadcasting, AB Journalism, AB English, AB Filipino, AB History, AB Philosophy, AB Sociology, AB Social Work, BS Psychology, BS Social Work\n");
        prompt.append("Hospitality & Tourism: BS Hotel and Restaurant Management, BS Tourism Management, BS Hospitality Management, BS Cruise Ship Management, BS Culinary Management\n");
        prompt.append("Agriculture & Fisheries: BS Agriculture, BS Agricultural Technology, BS Agribusiness, BS Fisheries, BS Food Technology, BS Forestry, BS Development Communication\n");
        prompt.append("Science & Mathematics: BS Biology, BS Chemistry, BS Physics, BS Mathematics, BS Statistics, BS Applied Mathematics, BS Environmental Science, BS Marine Biology\n");
        prompt.append("Maritime Studies: BS Marine Transportation, BS Marine Engineering, BS Naval Architecture and Marine Engineering\n");
        prompt.append("Criminology & Public Safety: BS Criminology, BS Forensic Science\n");
        prompt.append("Other Programs: BS Aviation, BS Aeronautical Engineering, BS Library and Information Science, BS Customs Administration, AB Legal Management, Bachelor of Laws (LLB)\n\n");
        
        prompt.append("ADDITIONAL TASK: ENHANCE AND FINALIZE PROBLEM INFORMATION\n");
        prompt.append("In addition to generating subtasks, you must also review and enhance the problem information provided above.\n");
        prompt.append("- Analyze the problem title, background context, primary statement, objectives, and constraints\n");
        prompt.append("- If files are attached, extract additional context, objectives, or constraints mentioned in the documents\n");
        prompt.append("- Refine and improve the problem description to make it clearer and more comprehensive\n");
        prompt.append("- Break down objectives and constraints into clear, separate bullet points (as array items)\n");
        prompt.append("- Ensure each objective and constraint is a single, actionable statement\n\n");
        
        prompt.append("Format your response as a JSON object with this EXACT structure:\n");
        prompt.append("{\n");
        prompt.append("  \"enhancedProblem\": {\n");
        prompt.append("    \"title\": \"Enhanced/refined problem title\",\n");
        prompt.append("    \"backgroundContext\": \"Enhanced background context (incorporating any additional info from uploaded files)\",\n");
        prompt.append("    \"primaryStatement\": \"Enhanced primary problem statement\",\n");
        prompt.append("    \"objectives\": [\"Objective 1\", \"Objective 2\", \"Objective 3\"],\n");
        prompt.append("    \"constraints\": [\"Constraint 1\", \"Constraint 2\", \"Constraint 3\"]\n");
        prompt.append("  },\n");
        prompt.append("  \"generatedSubproblems\": [\n");
        prompt.append("    {\"title\": \"Subtask Title\", \"departmentFocus\": \"Exact Program Name\", \"description\": \"Detailed description\"},\n");
        prompt.append("    ...\n");
        prompt.append("  ]\n");
        prompt.append("}\n");
        prompt.append("If no subtasks are needed, the generatedSubproblems array should be empty: [].\n");
        prompt.append("Only return the JSON object, nothing else.");
        
        return prompt.toString();
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
            
            return new GenerateScopeResponse(enhancedProblem, subtasks);
        } catch (Exception e) {
            System.err.println("Failed to parse JSON: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to parse Gemini response", e);
        }
    }

    private GenerateScopeResponse generateFallbackResponse(String title, String backgroundContext, 
                                                           String primaryStatement, String objectives, 
                                                           String constraints, String requiredProgram) {
        // Return original problem info with empty subtasks list
        EnhancedProblemResponse enhancedProblem = new EnhancedProblemResponse(
            title,
            backgroundContext,
            primaryStatement,
            objectives != null ? Arrays.asList(objectives.split("\\n")) : new ArrayList<>(),
            constraints != null ? Arrays.asList(constraints.split("\\n")) : new ArrayList<>()
        );
        
        return new GenerateScopeResponse(enhancedProblem, new ArrayList<>());
    }
}
