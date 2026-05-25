package com.solvad.backend.dto;

import java.util.UUID;

public record SimilarityResultDTO(
        UUID HistoricalProblemId,
        String HistoricalTitle,
        float SimilarityPercentage
) {}