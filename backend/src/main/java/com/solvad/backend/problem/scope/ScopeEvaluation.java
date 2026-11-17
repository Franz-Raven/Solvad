package com.solvad.backend.problem.scope;

import java.util.List;
import java.util.Map;

/**
 * Outcome of the Claude quality review loop for a generated scope.
 * Returned in the API response for diagnostics only; never shown to the seeker and never persisted.
 */
public record ScopeEvaluation(
        int threshold,
        Integer finalScore,
        boolean passed,
        int selectedAttempt,
        int totalAttempts,
        String judgeModel,
        List<AttemptResult> attempts
) {

    /** One Gemini attempt and its judge result. score and criteria are null when the judge failed. */
    public record AttemptResult(
            int attempt,
            Integer score,
            Map<String, Integer> criteria,
            List<String> feedback,
            String scopeType,
            int subtaskCount
    ) {
    }
}
