package com.solvad.backend.admin;

import java.time.LocalDateTime;
import java.util.UUID;

/** Row in the admin Problems table. */
public record AdminProblemResponse(
        UUID id,
        String title,
        String organizationName,
        String status,
        String preferredProgram,
        String sdgFocus,
        LocalDateTime createdAt
) {}
