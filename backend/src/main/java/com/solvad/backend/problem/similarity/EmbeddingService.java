package com.solvad.backend.problem.similarity;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.solvad.backend.problem.core.Problem;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Arrays;
import java.util.Map;

@Service
public class EmbeddingService {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingService.class);

    @Value("${CF_ACCOUNT_ID}")
    private String cfAccountId;

    @Value("${CF_TOKEN}")
    private String cfToken;

    private final ObjectMapper mapper = new ObjectMapper();

    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    public float[] generateEmbedding(String text) {
        // Cloudflare BGE-small has a max sequence length, 2000 chars is safe
        String truncated = text.length() > 2000 ? text.substring(0, 2000) : text;

        try {
            String url = "https://api.cloudflare.com/client/v4/accounts/" + cfAccountId + "/ai/run/@cf/baai/bge-small-en-v1.5";
            String jsonPayload = mapper.writeValueAsString(Map.of("text", truncated));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + cfToken)
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(10))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Cloudflare API error. Status: {}, Body: {}", response.statusCode(), response.body());
                return null;
            }

            JsonNode dataNode = mapper.readTree(response.body()).path("result").path("data");
            float[] embedding = null;

            if (dataNode.isArray() && !dataNode.isEmpty()) {
                // Handles both [[0.1, 0.2...]] and [0.1, 0.2...]
                if (dataNode.get(0).isArray()) {
                    embedding = mapper.convertValue(dataNode.get(0), float[].class);
                } else {
                    embedding = mapper.convertValue(dataNode, float[].class);
                }
            }

            if (embedding == null) {
                log.error("Cloudflare returned an empty or invalid array.");
                return null;
            }

            // 3. STRICT DIMENSION CHECK (Ensures Postgres never crashes)
            if (embedding.length != 384) {
                log.warn("Cloudflare returned {} dimensions, forcing to 384.", embedding.length);
                float[] fixed = new float[384];
                System.arraycopy(embedding, 0, fixed, 0, Math.min(embedding.length, 384));
                return fixed;
            }

            return embedding;

        } catch (Exception e) {
            log.error("Failed to generate Cloudflare embedding", e);
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