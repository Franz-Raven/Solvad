package com.solvad.backend.problem.GapAnalysis;

import java.util.List;

public record GapAnalysisResponse(
        String executiveSummary,
        List<String> featureDifferences,
        List<String> technicalDeviations,
        List<String> uniqueContributions,
        String recommendation
) {}