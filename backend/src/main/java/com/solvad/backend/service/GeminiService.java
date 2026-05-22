package com.solvad.backend.service;

import com.solvad.backend.dto.SubtaskResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class GeminiService {

    @Value("${gemini.key}")
    private String geminiApiKey;

    private final RestTemplate restTemplate;

    public GeminiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public List<SubtaskResponse> generateSubtasks(String title, String backgroundContext, 
                                                  String primaryStatement, String objectives, 
                                                  String constraints, String requiredCourse) {
        String prompt = buildPrompt(title, backgroundContext, primaryStatement, objectives, constraints, requiredCourse);
        
        try {
            String geminiResponse = callGeminiAPI(prompt);
            return parseGeminiResponse(geminiResponse);
        } catch (Exception e) {
            // Fallback to default subtasks if API fails
            return generateFallbackSubtasks(title, requiredCourse);
        }
    }

//    private String buildPrompt(String title, String backgroundContext, String primaryStatement,
//                              String objectives, String constraints, String requiredCourse) {
//        StringBuilder prompt = new StringBuilder();
//        prompt.append("You are an expert at breaking down complex industry problems into academic sub-tasks for students.\n\n");
//        prompt.append("Problem Title: ").append(title).append("\n");
//        if (backgroundContext != null && !backgroundContext.isEmpty()) {
//            prompt.append("Background: ").append(backgroundContext).append("\n");
//        }
//        prompt.append("Primary Statement: ").append(primaryStatement).append("\n");
//        if (objectives != null && !objectives.isEmpty()) {
//            prompt.append("Objectives: ").append(objectives).append("\n");
//        }
//        if (constraints != null && !constraints.isEmpty()) {
//            prompt.append("Constraints: ").append(constraints).append("\n");
//        }
//        prompt.append("Required Academic Course: ").append(requiredCourse).append("\n\n");
//
//        prompt.append("Generate 3-5 sub-tasks that break this problem down by department focus areas ");
//        prompt.append("(e.g., Backend Development, Frontend Development, Database Design, UI/UX Design, DevOps, etc.).\n\n");
//        prompt.append("Format your response as JSON array with this exact structure:\n");
//        prompt.append("[{\"title\": \"Task Title\", \"departmentFocus\": \"Department Name\", \"description\": \"Detailed description\"}]\n");
//        prompt.append("Only return the JSON array, nothing else.");
//
//        return prompt.toString();
//    }
private String buildPrompt(String title, String backgroundContext, String primaryStatement,
                           String objectives, String constraints, String requiredCourse) {
    StringBuilder prompt = new StringBuilder();

    prompt.append("You are an expert at breaking down ").append(requiredCourse).append(" projects into manageable tasks for students.\n\n");
    prompt.append("Project Title: ").append(title).append("\n");

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

    prompt.append("Required Course: ").append(requiredCourse).append("\n\n");

    prompt.append("Create 3-5 specific high-level tasks using ONLY terminology from ").append(requiredCourse).append(" domain.\n");
    prompt.append("DO NOT use generic or technical terms from other fields.\n\n");

    prompt.append("Return ONLY JSON array:\n");
    prompt.append("[{\"title\":\"Task name\",\"departmentFocus\":\"Department/area within ").append(requiredCourse).append("\",\"description\":\"What needs to be done\"}]");

    return prompt.toString();
}
    private String callGeminiAPI(String prompt) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + geminiApiKey;
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        Map<String, Object> requestBody = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(
                    Map.of("text", prompt)
                ))
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
                List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                if (!parts.isEmpty()) {
                    return (String) parts.get(0).get("text");
                }
            }
        }
        
        throw new RuntimeException("Failed to get response from Gemini API");
    }

    private List<SubtaskResponse> parseGeminiResponse(String response) {
        List<SubtaskResponse> subtasks = new ArrayList<>();
        
        try {
            // Extract JSON array from response (remove markdown code blocks if present)
            String jsonArray = response.trim();
            if (jsonArray.startsWith("```json")) {
                jsonArray = jsonArray.substring(7);
            }
            if (jsonArray.startsWith("```")) {
                jsonArray = jsonArray.substring(3);
            }
            if (jsonArray.endsWith("```")) {
                jsonArray = jsonArray.substring(0, jsonArray.length() - 3);
            }
            jsonArray = jsonArray.trim();
            
            // Simple JSON parsing (for production, use Jackson or Gson)
            // This is a basic implementation - enhance as needed
            String[] tasks = jsonArray.split("\\},\\s*\\{");
            
            for (String task : tasks) {
                String cleanTask = task.replace("[{", "{").replace("}]", "}").replace("{", "").replace("}", "");
                String[] fields = cleanTask.split("\",\\s*\"");
                
                String title = extractValue(fields, "title");
                String departmentFocus = extractValue(fields, "departmentFocus");
                String description = extractValue(fields, "description");
                
                subtasks.add(new SubtaskResponse(
                    UUID.randomUUID(), // Temporary ID for frontend
                    title,
                    departmentFocus,
                    description
                ));
            }
        } catch (Exception e) {
            // If parsing fails, return fallback
            return generateFallbackSubtasks("Problem", "General");
        }
        
        return subtasks.isEmpty() ? generateFallbackSubtasks("Problem", "General") : subtasks;
    }

    private String extractValue(String[] fields, String key) {
        for (String field : fields) {
            if (field.contains(key)) {
                String[] parts = field.split("\":\\s*\"");
                if (parts.length > 1) {
                    return parts[1].replace("\"", "").trim();
                }
            }
        }
        return "";
    }

    private List<SubtaskResponse> generateFallbackSubtasks(String title, String requiredCourse) {
        List<SubtaskResponse> fallbackTasks = new ArrayList<>();
        
        fallbackTasks.add(new SubtaskResponse(
            UUID.randomUUID(),
            "Backend Development",
            "Backend Development",
            "Design and implement the server-side logic and APIs for " + title
        ));
        
        fallbackTasks.add(new SubtaskResponse(
            UUID.randomUUID(),
            "Frontend Development",
            "Frontend Development",
            "Create the user interface and client-side functionality for " + title
        ));
        
        fallbackTasks.add(new SubtaskResponse(
            UUID.randomUUID(),
            "Database Design",
            "Database Design",
            "Design the database schema and data models for " + title
        ));
        
        return fallbackTasks;
    }
}
