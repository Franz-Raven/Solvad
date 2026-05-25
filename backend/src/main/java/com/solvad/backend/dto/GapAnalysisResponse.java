package com.solvad.backend.dto;

import java.util.List;

public record GapAnalysisResponse(
        String executiveSummary,
        List<String> featureDifferences,
        List<String> technicalDeviations,
        List<String> uniqueContributions,
        String recommendation
) {}