package com.solvad.backend.problem.GapAnalysisCache;

import java.util.List;

public record GapAnalysisResponse(
        String executiveSummary,
        List<String> featureDifferences,
        List<String> technicalDeviations,
        List<String> uniqueContributions,
        String recommendation
) {}