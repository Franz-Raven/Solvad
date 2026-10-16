package com.solvad.backend.problem.solution_attempt;

import java.time.LocalDateTime;
import java.util.UUID;

public record SolutionAttemptSummaryResponse(
        UUID id,
        UUID problemId,
        String problemTitle,
        String solverFirstName,
        String solverLastName,
        String profilePictureUrl,
        String solverInstitution,
        String solverDegreeProgram,
        String status,
        int submissionCount,
        LocalDateTime claimedAt,
        LocalDateTime updatedAt,
        LocalDateTime completedAt,
        UUID parentAttemptId,
        String parentSolverName,
        UUID targetSubtaskId,
        String targetSubtaskTitle,

        // 🚀 NEW FIELDS FOR WORKSPACE UI
        String seekerName,
        String seekerProfileUrl
) {}