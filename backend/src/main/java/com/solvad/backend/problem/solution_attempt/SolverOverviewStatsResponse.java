package com.solvad.backend.problem.solution_attempt;

import java.util.List;

public record SolverOverviewStatsResponse(
        long totalAttempts,
        long activeWorkspaces,
        long completedSolutions,
        int successRate,
        List<WeeklyAttemptStat> timelineData
) {}