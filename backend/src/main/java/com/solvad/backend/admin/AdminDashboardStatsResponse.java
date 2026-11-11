package com.solvad.backend.admin;

/** Platform-wide counters for the admin dashboard overview cards. */
public record AdminDashboardStatsResponse(
        long totalUsers,
        long solvers,
        long seekers,
        long newUsersThisWeek,
        long unverifiedUsers,
        long totalProblems,
        long openProblems,
        long activeProblems,
        long solvedProblems,
        long activeAttempts,
        long pendingReviews,
        long completedAttempts
) {}
