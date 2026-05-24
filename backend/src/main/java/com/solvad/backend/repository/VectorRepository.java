package com.solvad.backend.repository;

import com.solvad.backend.dto.SimilarityResultDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public class VectorRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<SimilarityResultDTO> findSimilarProblems(UUID problemId, String embeddingVector, double threshold) {
        String sql = """
        WITH source AS (
            SELECT CAST(? AS vector) as embedding
        )
        SELECT 
            p.id as problem_id,
            p.title,
            p.preferred_program as department,
            1 - (p.embedding <=> source.embedding) as similarity
        FROM problems p, source
        WHERE p.embedding IS NOT NULL
          AND p.id != CAST(? AS uuid)
          AND 1 - (p.embedding <=> source.embedding) > ?
        ORDER BY p.embedding <=> source.embedding
        LIMIT 5
        """;

        return jdbcTemplate.query(sql,
                new Object[]{embeddingVector, problemId, threshold},
                (rs, rowNum) -> new SimilarityResultDTO(
                        UUID.fromString(rs.getString("problem_id")),
                        rs.getString("title"),
                        rs.getString("department"),
                        rs.getDouble("similarity") * 100,
                        "Semantically similar problem detected"
                )
        );
    }
    public void updateEmbedding(UUID problemId, String embeddingVector) {
        String sql = "UPDATE problems SET embedding = CAST(? AS vector) WHERE id = ?";
        jdbcTemplate.update(sql, embeddingVector, problemId);
    }

    public String getEmbeddingAsString(UUID problemId) {
        String sql = "SELECT embedding::text FROM problems WHERE id = ?";
        try {
            return jdbcTemplate.queryForObject(sql, String.class, problemId);
        } catch (Exception e) {
            return null;
        }
    }

    public boolean hasEmbedding(UUID problemId) {
        String sql = "SELECT COUNT(*) FROM problems WHERE id = ? AND embedding IS NOT NULL";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, problemId);
        return count != null && count > 0;
    }

    public List<UUID> findProblemsWithoutEmbeddings() {
        String sql = "SELECT id FROM problems WHERE embedding IS NULL";
        return jdbcTemplate.query(sql, (rs, rowNum) -> UUID.fromString(rs.getString("id")));
    }
}