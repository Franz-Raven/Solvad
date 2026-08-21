package com.solvad.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.solvad.backend.problem.core.Problem;

import java.util.List;
import java.util.Map;

@Service
public class EmbeddingService {

    @Value("${EMBED_TOKEN}")
    private String hfToken;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String HF_API_URL =  "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction";


    public float[] generateEmbedding(String text) {
        String truncated = text.length() > 2000 ? text.substring(0, 2000) : text;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + hfToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        Map<String, Object> payload = Map.of(
                "inputs", new String[]{truncated}
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    HF_API_URL,
                    HttpMethod.POST,
                    request,
                    String.class
            );

            ObjectMapper mapper = new ObjectMapper();
            float[][] result = mapper.readValue(response.getBody(), float[][].class);

            if (result != null && result.length > 0) {
                return result[0];
            }
            return null;
        } catch (Exception e) {
            System.err.println("Failed to generate embedding: " + e.getMessage());
            return null;
        }
    }

    public String buildSearchableText(Problem problem) {
        StringBuilder sb = new StringBuilder();
        if (problem.getTitle() != null) sb.append(problem.getTitle()).append(" ");
        if (problem.getPrimaryStatement() != null) sb.append(problem.getPrimaryStatement()).append(" ");
        if (problem.getBackgroundContext() != null) sb.append(problem.getBackgroundContext()).append(" ");
        if (problem.getObjectives() != null) sb.append(problem.getObjectives()).append(" ");
        if (problem.getConstraints() != null) sb.append(problem.getConstraints()).append(" ");
        return sb.toString();
    }
}