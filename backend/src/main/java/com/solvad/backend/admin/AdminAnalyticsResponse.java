package com.solvad.backend.admin;

import java.util.List;

/** Everything the admin Analytics tab needs, in one payload. */
public record AdminAnalyticsResponse(
        List<MonthlyGrowth> userGrowth,
        List<MonthlyActivity> platformActivity,
        ProblemStatusBreakdown problemStatus,
        List<SdgCount> sdgDistribution,
        List<StatusCount> attemptOutcomes,
        List<ProgramDemand> programDemand,
        List<PartnerCount> topPartners
) {

    /** month is ISO "yyyy-MM"; the frontend formats the label. */
    public record MonthlyGrowth(String month, long solvers, long seekers) {}

    public record MonthlyActivity(String month, long problemsPosted, long attemptsStarted, long solutionsCompleted) {}

    /** Same shape as the seeker dashboard's ProblemStatusGroupDto, so the shared DonutChart can render it. */
    public record ProblemStatusBreakdown(long open, long active, long solvedNeedsImprovement, long completed, long closed) {}

    /** Same shape as SdgDistributionDto, so the shared SDG BarChart can render it. */
    public record SdgCount(String sdgFocus, long problemCount) {}

    public record StatusCount(String status, long count) {}

    /** problems = problems preferring this program, solvers = solvers enrolled in it. */
    public record ProgramDemand(String program, long problems, long solvers) {}

    public record PartnerCount(String organizationName, long problems) {}
}
