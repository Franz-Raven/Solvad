package com.solvad.backend.notification;

import java.util.UUID;

public record ProposalSubmittedEvent(
        UUID claimRequestId,
        UUID problemId,
        String problemTitle,
        UUID seekerId,
        UUID solverId,
        String solverName
) {}
