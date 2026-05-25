package com.solvad.backend.controller;

import com.solvad.backend.dto.SimilarityResultDTO;
import com.solvad.backend.service.VectorSimilarityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
@RestController
@RequestMapping("/api/v1/problems")
public class SimilarityController {

    @Autowired
    private VectorSimilarityService vectorSimilarityService;

    @GetMapping("/{id}/similarity")
    public ResponseEntity<?> getSimilarityInsights(@PathVariable UUID id) {
        try {
            List<SimilarityResultDTO> similar = vectorSimilarityService.findSimilarProblems(id, 0.60);

            Map<String, Object> response = new HashMap<>();
            response.put("hasDuplicates", !similar.isEmpty());
            response.put("similarProjects", similar);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Similarity check failed: " + e.getMessage());
            return ResponseEntity.status(503).body(error);
        }
    }

    @PostMapping("/update-embeddings")
    public ResponseEntity<?> updateAllEmbeddings() {
        vectorSimilarityService.updateAllEmbeddings();
        return ResponseEntity.ok(Map.of("message", "Embeddings updated"));
    }
}