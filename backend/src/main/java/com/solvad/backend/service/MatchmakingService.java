package com.solvad.backend.service;

import com.solvad.backend.dto.DiscoveryDashboardResponse;
import com.solvad.backend.dto.ProblemResponse;
import com.solvad.backend.dto.SubtaskResponse;
import com.solvad.backend.entity.*;
import com.solvad.backend.repository.ProblemRepository;
import com.solvad.backend.repository.ProblemSubtaskRepository;
import com.solvad.backend.repository.SolverProfileRepository;
import com.solvad.backend.util.KeywordUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class MatchmakingService {

    private static final int RECOMMENDATION_LIMIT = 5;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private ProblemSubtaskRepository subtaskRepository;

    @Autowired
    private SolverProfileRepository solverProfileRepository;

    @Transactional(readOnly = true)
    public DiscoveryDashboardResponse getDiscoveryDashboard(
            UUID solverUserId,
            String search,
            String tagFilter,
            String sortOrder) {

        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        Set<String> solverSkills = resolveSolverSkills(solver);
        String solverCourse = solver.getDegreeProgram();

        List<ProblemStatus> visibleStatuses = Arrays.asList(
                ProblemStatus.OPEN,
                ProblemStatus.SOLVED_OPEN_FOR_IMPROVEMENT
        );

        List<Problem> openProblems = problemRepository.findByStatusIn(visibleStatuses);
        Set<String> filterTags = KeywordUtils.fromCommaList(tagFilter);
        String searchLower = search != null ? search.trim().toLowerCase(Locale.ROOT) : "";

        List<ScoredProblem> scored = new ArrayList<>();

        for (Problem problem : openProblems) {
            List<ProblemSubtask> subtasks = subtaskRepository.findByProblem(problem);
            Set<String> problemTags = resolveProblemTags(problem, subtasks);

            if (!filterTags.isEmpty() && filterTags.stream().noneMatch(problemTags::contains)) {
                continue;
            }

            if (!searchLower.isEmpty() && !matchesSearch(problem, problemTags, searchLower)) {
                continue;
            }

            double jaccard = KeywordUtils.jaccard(solverSkills, problemTags);
            boolean courseMatch = KeywordUtils.courseMatches(solverCourse, problem.getPreferredProgram());
            double score = jaccard + (courseMatch ? 0.25 : 0.0);

            ProblemResponse response = mapProblem(problem, subtasks, problemTags);
            response.setMatchScore(Math.round(score * 100.0) / 100.0);
            response.setCourseMatch(courseMatch);

            scored.add(new ScoredProblem(response, score, courseMatch, problem.getCreatedAt()));
        }

        List<ProblemResponse> recommended = scored.stream()
                .sorted(Comparator.comparingDouble(ScoredProblem::score).reversed())
                .limit(RECOMMENDATION_LIMIT)
                .map(ScoredProblem::response)
                .collect(Collectors.toList());

        Comparator<ScoredProblem> listComparator = buildListComparator(sortOrder);
        List<ProblemResponse> problems = scored.stream()
                .sorted(listComparator)
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
        return dashboard;
    }

    public static List<String> buildTagsForProblem(Problem problem, List<ProblemSubtask> subtasks) {
        LinkedHashSet<String> tags = new LinkedHashSet<>();
        tags.addAll(KeywordUtils.tokenize(problem.getPreferredProgram()));
        tags.addAll(KeywordUtils.tokenize(problem.getTitle()));
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

    private Comparator<ScoredProblem> buildListComparator(String sortOrder) {
        Comparator<ScoredProblem> byCourse = Comparator
                .comparing(ScoredProblem::courseMatch)
                .reversed();
        Comparator<ScoredProblem> byDate = "oldest".equalsIgnoreCase(sortOrder)
                ? Comparator.comparing(ScoredProblem::createdAt)
                : Comparator.comparing(ScoredProblem::createdAt).reversed();
        return byCourse.thenComparing(byDate).thenComparing(ScoredProblem::score, Comparator.reverseOrder());
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
                problem.getProblemDocumentUrl()
        );
    }

    private record ScoredProblem(ProblemResponse response, double score, boolean courseMatch,
                                 java.time.LocalDateTime createdAt) {}

}
