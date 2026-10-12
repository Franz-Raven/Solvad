package com.solvad.backend.problem.solution_attempt;

import java.util.UUID;

public record AttemptNodeSummaryResponse(
        UUID id,
        UUID parentId,
        String solverName,
        String subtaskTitle,
        String status
) {}