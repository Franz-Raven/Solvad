package com.solvad.backend.notification;

import java.util.UUID;

public record SolutionReviewedEvent(
        UUID attemptId,
        UUID problemId,
        String problemTitle,
        UUID solverUserId,
        String solverName,
        String solverEmail,
        boolean approved,
        String rejectionReason
) {}
