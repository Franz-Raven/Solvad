package com.solvad.backend.problem.GapAnalysis;

import java.util.UUID;

public record GapAnalysisRequest(
        UUID newProblemId,
        UUID historicalProblemId
) {}