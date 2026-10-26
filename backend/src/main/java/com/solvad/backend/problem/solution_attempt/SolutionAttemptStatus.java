package com.solvad.backend.problem.solution_attempt;

public enum SolutionAttemptStatus {
    ACTIVE,
    ABANDONED,
    COMPLETED,
    TERMINATED,       // Problem was closed/canceled
    PENDING_REVIEW,
    REJECTED          // 🚀 NEW: Seeker reviewed and denied the solution
}