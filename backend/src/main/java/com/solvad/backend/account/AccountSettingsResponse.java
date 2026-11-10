package com.solvad.backend.account;

import java.time.LocalDateTime;

/** Safe, read-only account facts for the Account Settings tab (never includes the password hash). */
public record AccountSettingsResponse(
        String email,
        String role,
        String authProvider,
        boolean verified,
        boolean hasPassword,
        LocalDateTime createdAt
) {}
