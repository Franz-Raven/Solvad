package com.solvad.backend.problem.claim;

import java.time.LocalDateTime;
import java.util.UUID;

public record ClaimSummaryResponse(
        UUID id,
        UUID problemId,
        String problemTitle,
        UUID targetSubtaskId,
        String targetSubtaskTitle,
        String status,
        LocalDateTime submittedAt
) {}