package com.solvad.backend.problem.similarity;

import com.solvad.backend.dashboard.DiscoveryDashboardResponse;
import com.solvad.backend.problem.core.ProblemResponse;
import com.solvad.backend.problem.subtask.SubtaskResponse;
import com.solvad.backend.problem.core.Problem;
import com.solvad.backend.problem.core.ProblemStatus;
import com.solvad.backend.problem.subtask.ProblemSubtask;
import com.solvad.backend.profile.solver.SolverProfile;
import com.solvad.backend.problem.core.ProblemRepository;
import com.solvad.backend.problem.subtask.ProblemSubtaskRepository;
import com.solvad.backend.problem.solution_attempt.SolutionAttemptRepository;
import com.solvad.backend.profile.solver.SolverProfileRepository;
import com.solvad.backend.problem.solution_attempt.SolutionAttemptStatus;
import com.solvad.backend.util.KeywordUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.solvad.backend.problem.solution_attempt.SolutionAttempt;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class MatchmakingService {

    private static final int RECOMMENDATION_LIMIT = 3;
    /** Minimum composite match score (0–1) to appear in "Recommended for You". */
    private static final double MIN_RECOMMENDATION_SCORE = 0.05;
    private static final double SKILL_WEIGHT = 0.7;
    private static final double COURSE_WEIGHT = 0.3;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private ProblemSubtaskRepository subtaskRepository;

    @Autowired
    private SolverProfileRepository solverProfileRepository;

    @Autowired
    private SolutionAttemptRepository attemptRepository;

    @Transactional(readOnly = true)
    public DiscoveryDashboardResponse getDiscoveryDashboard(
            UUID solverUserId,
            String search,
            String tagFilter) {

        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        Set<String> solverSkills = resolveSolverSkills(solver);
        String solverCourse = solver.getDegreeProgram();

        List<ProblemStatus> visibleStatuses = Arrays.asList(
                ProblemStatus.OPEN,
                ProblemStatus.IN_PROGRESS,
                ProblemStatus.SOLVED_OPEN_FOR_IMPROVEMENT
        );

        // 1. Fetch ALL open problems
        List<Problem> openProblems = problemRepository.findByStatusIn(visibleStatuses);

        // 🚀 FIX: Declare as final and assign exactly once so the lambda compiler is happy
        final Map<UUID, List<ProblemSubtask>> subtasksByProblem;
        final Map<UUID, List<SolutionAttempt>> activeAttemptsByProblem;

        if (openProblems.isEmpty()) {
            subtasksByProblem = Collections.emptyMap();
            activeAttemptsByProblem = Collections.emptyMap();
        } else {
            // Fetch all subtasks for all open problems in ONE query
            subtasksByProblem = subtaskRepository.findByProblemIn(openProblems).stream()
                    .collect(Collectors.groupingBy(s -> s.getProblem().getId()));

            // Fetch all active attempts for all open problems in ONE query
            activeAttemptsByProblem = attemptRepository.findByProblemInAndStatus(openProblems, SolutionAttemptStatus.ACTIVE).stream()
                    .collect(Collectors.groupingBy(a -> a.getProblem().getId()));
        }

        Set<String> filterTags = KeywordUtils.fromCommaList(tagFilter);
        String searchLower = search != null ? search.trim().toLowerCase(Locale.ROOT) : "";

        List<ScoredProblem> scored = new ArrayList<>();

        for (Problem problem : openProblems) {
            // 🚀 Read from our bulk-fetched memory maps instantly (Zero DB calls inside the loop!)
            List<ProblemSubtask> subtasks = subtasksByProblem.getOrDefault(problem.getId(), new ArrayList<>());
            List<SolutionAttempt> activeAttempts = activeAttemptsByProblem.getOrDefault(problem.getId(), new ArrayList<>());

            Set<String> problemTags = resolveProblemTags(problem, subtasks);

            // Map capacities instantly in memory
            Map<UUID, Long> activeCountBySubtask = activeAttempts.stream()
                    .filter(a -> a.getTargetSubtask() != null)
                    .collect(Collectors.groupingBy(a -> a.getTargetSubtask().getId(), Collectors.counting()));

            boolean hasAvailableSlot = false;
            for (ProblemSubtask subtask : subtasks) {
                long activeOnSubtask = activeCountBySubtask.getOrDefault(subtask.getId(), 0L);
                int limit = subtask.getMaxConcurrentSolvers() != null ? subtask.getMaxConcurrentSolvers() : 3;

                if (activeOnSubtask < limit) {
                    hasAvailableSlot = true;
                    break;
                }
            }

            if (!hasAvailableSlot) {
                continue; // Skip this problem because all subtasks are full
            }

            if (!filterTags.isEmpty() && filterTags.stream().noneMatch(problemTags::contains)) {
                continue;
            }

            if (!searchLower.isEmpty() && !matchesSearch(problem, problemTags, searchLower)) {
                continue;
            }

            double skillSimilarity = KeywordUtils.jaccard(solverSkills, problemTags);
            double courseAlignment = KeywordUtils.programAlignment(solverCourse, problem.getPreferredProgram());
            boolean courseMatch = courseAlignment >= 1.0;
            double score = SKILL_WEIGHT * skillSimilarity + COURSE_WEIGHT * courseAlignment;
            score = Math.round(score * 100.0) / 100.0;

            ProblemResponse response = mapProblem(problem, subtasks, problemTags);
            response.setMatchScore(score);
            response.setCourseMatch(courseMatch);

            scored.add(new ScoredProblem(response, score, courseMatch, problem.getCreatedAt()));
        }

        Comparator<ScoredProblem> byBestMatch = Comparator
                .comparingDouble(ScoredProblem::score).reversed()
                .thenComparing(ScoredProblem::courseMatch).reversed()
                .thenComparing(ScoredProblem::createdAt).reversed();

        List<ProblemResponse> recommended = scored.stream()
                .filter(sp -> sp.score() >= MIN_RECOMMENDATION_SCORE)
                .sorted(byBestMatch)
                .limit(RECOMMENDATION_LIMIT)
                .map(ScoredProblem::response)
                .collect(Collectors.toList());

        List<ProblemResponse> problems = scored.stream()
                .sorted(buildExploreListComparator())
                .map(ScoredProblem::response)
                .collect(Collectors.toList());

        List<String> availableTags = openProblems.stream()
                .flatMap(p -> resolveProblemTags(p, subtasksByProblem.getOrDefault(p.getId(), new ArrayList<>())).stream())
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        DiscoveryDashboardResponse dashboard = new DiscoveryDashboardResponse();
        dashboard.setRecommended(recommended);
        dashboard.setProblems(problems);
        dashboard.setAvailableTags(availableTags);
        dashboard.setSolverCourse(solverCourse);
        dashboard.setSolverSkills(KeywordUtils.toCommaList(solverSkills));
        return dashboard;
    }

    public static List<String> buildTagsForProblem(Problem problem, List<ProblemSubtask> subtasks) {
        LinkedHashSet<String> tags = new LinkedHashSet<>();
        tags.addAll(KeywordUtils.tokenize(problem.getPreferredProgram()));
        tags.addAll(KeywordUtils.tokenize(problem.getSdgFocus()));
        tags.addAll(KeywordUtils.tokenize(problem.getTitle()));
        tags.addAll(KeywordUtils.tokenize(problem.getBackgroundContext()));
        tags.addAll(KeywordUtils.tokenize(problem.getObjectives()));
        tags.addAll(KeywordUtils.tokenize(problem.getConstraints()));

        for (ProblemSubtask subtask : subtasks) {
            tags.addAll(KeywordUtils.tokenize(subtask.getDepartmentFocus()));
            tags.addAll(KeywordUtils.tokenize(subtask.getTitle()));
        }

        return tags.stream()
                .limit(30)
                .collect(Collectors.toList());
    }

    public static Set<String> resolveSolverSkills(SolverProfile solver) {
        if (solver.getSkills() != null && !solver.getSkills().isBlank()) {
            LinkedHashSet<String> fromSkills = new LinkedHashSet<>(KeywordUtils.fromCommaList(solver.getSkills()));
            fromSkills.addAll(KeywordUtils.tokenize(solver.getDegreeProgram()));
            return fromSkills;
        }
        return KeywordUtils.tokenize(solver.getDegreeProgram());
    }

    public static Set<String> resolveProblemTags(Problem problem, List<ProblemSubtask> subtasks) {
        if (problem.getTags() != null && !problem.getTags().isEmpty()) {
            return problem.getTags().stream()
                    .map(t -> t.trim().toLowerCase(Locale.ROOT))
                    .filter(t -> !t.isEmpty())
                    .collect(Collectors.toCollection(LinkedHashSet::new));
        }
        return new LinkedHashSet<>(buildTagsForProblem(problem, subtasks));
    }

    private boolean matchesSearch(Problem problem, Set<String> tags, String searchLower) {
        if (problem.getTitle().toLowerCase(Locale.ROOT).contains(searchLower)) {
            return true;
        }
        if (problem.getPreferredProgram().toLowerCase(Locale.ROOT).contains(searchLower)) {
            return true;
        }
        if (problem.getSeeker().getOrganizationName().toLowerCase(Locale.ROOT).contains(searchLower)) {
            return true;
        }
        return tags.stream().anyMatch(t -> t.contains(searchLower));
    }

    /** Explore list: course matches first, then highest match score. */
    private Comparator<ScoredProblem> buildExploreListComparator() {
        return Comparator
                .comparing(ScoredProblem::courseMatch)
                .reversed()
                .thenComparing(ScoredProblem::score, Comparator.reverseOrder());
    }

    private ProblemResponse mapProblem(Problem problem, List<ProblemSubtask> subtasks, Set<String> tagSet) {
        List<SubtaskResponse> subtaskResponses = subtasks.stream()
                .map(s -> new SubtaskResponse(
                        s.getId(),
                        s.getTitle(),
                        s.getDepartmentFocus(),
                        s.getSdgFocus(),
                        s.getDescription(),
                        new ArrayList<>(),
                        s.getMaxConcurrentSolvers()
                ))
                .collect(Collectors.toList());

        List<String> tags = new ArrayList<>(tagSet);

        return new ProblemResponse(
                problem.getId(),
                problem.getTitle(),
                problem.getBackgroundContext(),
                problem.getPrimaryStatement(),
                problem.getObjectives(),
                problem.getConstraints(),
                problem.getPreferredProgram(),
                problem.getSdgFocus(),
                problem.getStatus().name(),
                problem.getSeeker().getId(),
                problem.getSeeker().getOrganizationName(),
                problem.getCreatedAt(),
                subtaskResponses,
                tags,
                problem.getProblemDocumentUrl(),
                problem.getMaxConcurrentSolvers()
        );
    }

    private record ScoredProblem(ProblemResponse response, double score, boolean courseMatch,
                                 java.time.LocalDateTime createdAt) {}

}
