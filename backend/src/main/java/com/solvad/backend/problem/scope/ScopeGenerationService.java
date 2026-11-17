package com.solvad.backend.problem.scope;

import com.solvad.backend.ai.AiServiceUnavailableException;
import com.solvad.backend.ai.ClaudeJudgeService;
import com.solvad.backend.ai.ClaudeJudgeService.JudgeResult;
import com.solvad.backend.ai.GeminiService;
import com.solvad.backend.problem.scope.ScopeEvaluation.AttemptResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Generates a problem scope with Gemini, has Claude grade each attempt, and asks Gemini to
 * redo low-scoring attempts using Claude's feedback. Returns the highest-scoring attempt.
 * Nothing here is persisted and nothing is surfaced to the seeker as a warning.
 */
@Service
public class ScopeGenerationService {

    private static final Logger log = LoggerFactory.getLogger(ScopeGenerationService.class);

    private final GeminiService gemini;
    private final ClaudeJudgeService judge;

    @Value("${scoping.judge.threshold:85}")
    private int threshold;

    @Value("${scoping.judge.max-redos:2}")
    private int maxRedos;

    public ScopeGenerationService(GeminiService gemini, ClaudeJudgeService judge) {
        this.gemini = gemini;
        this.judge = judge;
    }

    public GenerateScopeResponse generate(GenerateScopeRequest request, List<MultipartFile> attachments) {
        int maxAttempts = 1 + Math.max(0, maxRedos);

        // Attempt 1. AiServiceUnavailableException propagates and becomes the 503.
        GenerateScopeResponse current = gemini.generateSubtasks(
                request.getTitle(),
                request.getBackgroundContext(),
                request.getPrimaryStatement(),
                request.getObjectives(),
                request.getConstraints(),
                request.getPreferredProgram(),
                attachments
        );

        if (!judge.isEnabled()) {
            log.warn("Claude judge disabled (no ANTHROPIC_KEY); returning first attempt");
            current.setEvaluation(null);
            return current;
        }

        List<GenerateScopeResponse> responses = new ArrayList<>();
        List<AttemptResult> results = new ArrayList<>();

        for (int attempt = 1; ; attempt++) {
            responses.add(current);

            Optional<JudgeResult> judged = judge.evaluate(
                    request.getTitle(),
                    request.getBackgroundContext(),
                    request.getPrimaryStatement(),
                    request.getObjectives(),
                    request.getConstraints(),
                    request.getPreferredProgram(),
                    attachments,
                    current
            );

            AttemptResult result = new AttemptResult(
                    attempt,
                    judged.map(JudgeResult::totalScore).orElse(null),
                    judged.map(JudgeResult::criteria).orElse(null),
                    judged.map(JudgeResult::feedback).orElse(List.of()),
                    current.getScopeType(),
                    subtaskCount(current)
            );
            results.add(result);

            log.info("[ScopeJudge] attempt {}/{} score={} scopeType={} subtasks={} criteria={}",
                    attempt, maxAttempts, result.score(), result.scopeType(), result.subtaskCount(), result.criteria());

            if (judged.isEmpty()) {
                break; // no feedback to redo with
            }
            if (judged.get().totalScore() >= threshold) {
                break;
            }
            if (attempt >= maxAttempts) {
                break;
            }

            try {
                current = gemini.generateSubtasks(
                        request.getTitle(),
                        request.getBackgroundContext(),
                        request.getPrimaryStatement(),
                        request.getObjectives(),
                        request.getConstraints(),
                        request.getPreferredProgram(),
                        attachments,
                        current,
                        judged.get().feedback()
                );
            } catch (AiServiceUnavailableException e) {
                log.warn("[ScopeJudge] redo attempt {} failed ({}); keeping earlier attempts",
                        attempt + 1, e.getMessage());
                break;
            }
        }

        // Highest score wins; ties go to the earliest attempt. If nothing was scored, attempt 1.
        int selectedIndex = 0;
        Integer bestScore = null;
        for (int i = 0; i < results.size(); i++) {
            Integer score = results.get(i).score();
            if (score != null && (bestScore == null || score > bestScore)) {
                bestScore = score;
                selectedIndex = i;
            }
        }

        boolean passed = bestScore != null && bestScore >= threshold;
        GenerateScopeResponse selected = responses.get(selectedIndex);
        selected.setEvaluation(new ScopeEvaluation(
                threshold,
                bestScore,
                passed,
                selectedIndex + 1,
                results.size(),
                judge.getModel(),
                List.copyOf(results)
        ));

        log.info("[ScopeJudge] selected attempt {} score={} passed={}", selectedIndex + 1, bestScore, passed);
        return selected;
    }

    private static int subtaskCount(GenerateScopeResponse response) {
        return response.getGeneratedSubtasks() == null ? 0 : response.getGeneratedSubtasks().size();
    }
}
