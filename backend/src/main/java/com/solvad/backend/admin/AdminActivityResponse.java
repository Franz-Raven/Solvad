package com.solvad.backend.admin;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminActivityResponse(
        UUID id,
        UUID problemId,
        String problemTitle,
        String actorName,
        String actorRole,
        String eventType,
        String delta,
        LocalDateTime timestamp
) {}
