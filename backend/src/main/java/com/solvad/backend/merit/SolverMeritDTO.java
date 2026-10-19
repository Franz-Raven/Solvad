package com.solvad.backend.merit;

public record SolverMeritDTO(
        long solutionsCompleted,
        double completionRate,
        Double avgTurnaroundDays
) {}