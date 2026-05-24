package com.solvad.backend.dto;

import java.util.UUID;

public record SimilarityResultDTO(
        UUID problemId,
        String title,
        String department,
        double similarityScore,
        String reasonForMatch
) {}