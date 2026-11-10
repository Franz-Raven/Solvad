package com.solvad.backend.admin;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Row in the admin Solvers / Industry Partners tables.
 * Solvers: displayName = full name, detail = institution, secondaryDetail = degree program.
 * Seekers: displayName = organization, detail = contact person, secondaryDetail = contact number.
 */
public record AdminUserResponse(
        UUID userId,
        String email,
        String role,
        String displayName,
        String detail,
        String secondaryDetail,
        String profileUrl,
        boolean verified,
        String authProvider,
        LocalDateTime createdAt
) {}
