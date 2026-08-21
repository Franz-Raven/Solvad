package com.solvad.backend.problem.GapAnalysisCache;

import java.util.UUID;

public record GapAnalysisRequest(
        UUID newProblemId,
        UUID historicalProblemId
) {}