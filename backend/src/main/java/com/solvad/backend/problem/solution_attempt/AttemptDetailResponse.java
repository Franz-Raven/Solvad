package com.solvad.backend.problem.solution_attempt;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record AttemptDetailResponse(
        UUID id,
        UUID problemId,
        String problemTitle,
        String targetSubtaskTitle,
        String status,
        LocalDateTime completedAt,
        String summary,
        List<String> attachedFiles
) {}