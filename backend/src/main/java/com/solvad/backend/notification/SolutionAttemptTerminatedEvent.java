package com.solvad.backend.notification;

import java.util.UUID;

public record SolutionAttemptTerminatedEvent(
        UUID solverUserId,
        UUID problemId,
        String problemTitle,
        String problemStatus
) {}
