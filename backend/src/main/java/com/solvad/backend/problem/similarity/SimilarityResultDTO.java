package com.solvad.backend.problem.similarity;

import java.util.UUID;

public record SimilarityResultDTO(
        UUID HistoricalProblemId,
        String HistoricalTitle,
        float SimilarityPercentage
) {}