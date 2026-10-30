package com.solvad.backend.notification;

import java.util.UUID;

public record ProposalStatusChangedEvent(
        UUID claimRequestId,
        UUID problemId,
        String problemTitle,
        UUID solverId,
        String solverName,
        String solverEmail,
        String newStatus   // "APPROVED" or "REJECTED" (enum name())
) {}
