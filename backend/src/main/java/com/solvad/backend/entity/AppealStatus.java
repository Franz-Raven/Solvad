package com.solvad.backend.entity;

public enum AppealStatus {
    PENDING,    // Waiting for seeker review
    APPROVED,   // Seeker approved, SolutionAttempt created
    REJECTED    // Seeker rejected
}
