package com.solvad.backend.notification;

import java.util.UUID;

public record SolutionAttemptAbandonedEvent(
        UUID attemptId,
        UUID problemId,
        String problemTitle,
        UUID seekerUserId,
        String seekerName,
        String seekerEmail,
        String solverName,
        String subtaskTitle
) {}
