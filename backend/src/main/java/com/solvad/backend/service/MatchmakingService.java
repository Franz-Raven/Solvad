package com.solvad.backend.service;

import com.solvad.backend.dto.DiscoveryDashboardResponse;
import com.solvad.backend.dto.ProblemResponse;
import com.solvad.backend.dto.SubtaskResponse;
import com.solvad.backend.entity.*;
import com.solvad.backend.repository.ProblemRepository;
import com.solvad.backend.repository.ProblemSubtaskRepository;
import com.solvad.backend.repository.SolutionAttemptRepository;
import com.solvad.backend.repository.SolverProfileRepository;
import com.solvad.backend.util.KeywordUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        return getDiscoveryDashboardPaginated(solverUserId, search, tagFilter, 0, 50);
    }

    @Transactional(readOnly = true)
    public DiscoveryDashboardResponse getDiscoveryDashboardPaginated(
            UUID solverUserId,
            String search,
            String tagFilter,
            int page,
            int size) {

        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        Set<String> solverSkills = resolveSolverSkills(solver);
        String solverCourse = solver.getDegreeProgram();

        List<ProblemStatus> visibleStatuses = Arrays.asList(
                ProblemStatus.OPEN,
                ProblemStatus.IN_PROGRESS,
                ProblemStatus.SOLVED_OPEN_FOR_IMPROVEMENT
        );

        List<Problem> openProblems = problemRepository.findByStatusIn(visibleStatuses);
        Set<String> filterTags = KeywordUtils.fromCommaList(tagFilter);
        String searchLower = search != null ? search.trim().toLowerCase(Locale.ROOT) : "";

        List<ScoredProblem> scored = new ArrayList<>();

        for (Problem problem : openProblems) {
            List<ProblemSubtask> subtasks = subtaskRepository.findByProblem(problem);
            Set<String> problemTags = resolveProblemTags(problem, subtasks);

            long activeSolvers = attemptRepository.countByProblemAndStatus(problem, SolutionAttemptStatus.ACTIVE);
            if (activeSolvers >= problem.getMaxConcurrentSolvers()) {
                continue; // Skip this problem because all slots are filled
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

        // Get all sorted problems for pagination
        List<ScoredProblem> allSortedScored = scored.stream()
                .sorted(buildExploreListComparator())
                .collect(Collectors.toList());

        long totalElements = allSortedScored.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int fromIndex = page * size;

        List<ProblemResponse> problems = allSortedScored.stream()
                .skip(fromIndex)
                .limit(size)
                .map(ScoredProblem::response)
                .collect(Collectors.toList());

        List<String> availableTags = openProblems.stream()
                .flatMap(p -> resolveProblemTags(p, subtaskRepository.findByProblem(p)).stream())
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        DiscoveryDashboardResponse dashboard = new DiscoveryDashboardResponse();
        dashboard.setRecommended(recommended);
        dashboard.setProblems(problems);
        dashboard.setAvailableTags(availableTags);
        dashboard.setSolverCourse(solverCourse);
        dashboard.setSolverSkills(KeywordUtils.toCommaList(solverSkills));
        dashboard.setCurrentPage(page);
        dashboard.setTotalPages(totalPages);
        dashboard.setTotalElements(totalElements);
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
                .map(s -> new SubtaskResponse(s.getId(), s.getTitle(), s.getDepartmentFocus(), s.getSdgFocus(), s.getDescription()))
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
