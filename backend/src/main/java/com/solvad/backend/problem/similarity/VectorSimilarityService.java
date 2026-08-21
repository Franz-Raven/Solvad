package com.solvad.backend.problem.similarity;

import com.solvad.backend.problem.core.Problem;
import com.solvad.backend.problem.core.ProblemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class VectorSimilarityService {

    @Autowired
    private VectorRepository vectorRepository;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private EmbeddingService embeddingService;

    public List<SimilarityResultDTO> findSimilarProblems(UUID problemId, double threshold) {
        // 1. Verify problem exists
        Problem currentProblem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found"));

        // 2. Try to get existing embedding
        String vectorStr = vectorRepository.getEmbeddingAsString(problemId);

        // 3. If no embedding exists, generate one
        if (vectorStr == null) {
            String searchableText = embeddingService.buildSearchableText(currentProblem);
            float[] embedding = embeddingService.generateEmbedding(searchableText);
            if (embedding == null) {
                return List.of();
            }
            vectorStr = toVectorString(embedding);
            vectorRepository.updateEmbedding(problemId, vectorStr);
        }

        // 4. Find similar problems using the vector
        return vectorRepository.findSimilarProblems(problemId, vectorStr, threshold);
    }

    public void updateProblemEmbedding(UUID problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found: " + problemId));

        String searchableText = embeddingService.buildSearchableText(problem);
        float[] embedding = embeddingService.generateEmbedding(searchableText);

        if (embedding != null) {
            String vectorStr = toVectorString(embedding);
            vectorRepository.updateEmbedding(problemId, vectorStr);
            System.out.println("Updated embedding for: " + problem.getTitle());
        } else {
            System.err.println("Failed to generate embedding for: " + problem.getTitle());
        }
    }

    public void updateAllEmbeddings() {
        List<Problem> problems = problemRepository.findAll();
        int updated = 0;
        for (Problem problem : problems) {
            if (!vectorRepository.hasEmbedding(problem.getId())) {
                updateProblemEmbedding(problem.getId());
                updated++;
            }
        }
        System.out.println("Updated " + updated + " problems with embeddings");
    }

    private String toVectorString(float[] embedding) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < embedding.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(embedding[i]);
        }
        sb.append("]");
        return sb.toString();
    }
}