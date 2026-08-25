package com.solvad.backend.problem.core;

public enum ProblemStatus {
    OPEN,
    CLAIMED,
    IN_PROGRESS,
    SOLVED_OPEN_FOR_IMPROVEMENT, // Replaces SOLVED. Completed but still visible to solvers.
    COMPLETED,                   // Fully completed. Hidden from the solver browse page.
    CLOSED                       // Canceled or hidden.
}