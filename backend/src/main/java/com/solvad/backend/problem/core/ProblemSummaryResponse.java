package com.solvad.backend.problem.core;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ProblemSummaryResponse(
        UUID id,
        String title,
        String organizationName,
        String preferredProgram,
        String status,
        int subtaskCount,
        LocalDateTime createdAt,
        Boolean courseMatch,
        Double matchScore,
        String sdgFocus,
        List<String> tags
) {}