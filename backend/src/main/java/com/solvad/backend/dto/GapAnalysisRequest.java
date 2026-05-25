package com.solvad.backend.dto;

import java.util.UUID;

public record GapAnalysisRequest(
        UUID newProblemId,
        UUID historicalProblemId
) {}