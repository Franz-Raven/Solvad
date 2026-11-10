package com.solvad.backend.admin;

import com.solvad.backend.audit.AuditEventType;
import com.solvad.backend.audit.AuditLog;
import com.solvad.backend.problem.core.ProblemStatus;
import com.solvad.backend.problem.solution_attempt.SolutionAttemptStatus;
import com.solvad.backend.profile.seeker.SeekerProfile;
import com.solvad.backend.profile.solver.SolverProfile;
import com.solvad.backend.user.Role;
import com.solvad.backend.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Arrays;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.BiConsumer;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
public class AdminDashboardService {

    private static final int MAX_PAGE_SIZE = 50;
    private static final int ANALYTICS_MONTHS = 6;
    private static final int TOP_N = 6;

    /** Draft autosaves fire every 30s per solver, which is too noisy for a platform feed. */
    private static final Set<AuditEventType> HIDDEN_ACTIVITY = EnumSet.of(AuditEventType.SUBTASK_DRAFT_SAVED);

    private final AdminDashboardRepository adminDashboardRepository;

    public AdminDashboardService(AdminDashboardRepository adminDashboardRepository) {
        this.adminDashboardRepository = adminDashboardRepository;
    }

    @Transactional(readOnly = true)
    public AdminDashboardStatsResponse getStats() {
        AdminDashboardRepository repo = adminDashboardRepository;
        return new AdminDashboardStatsResponse(
                repo.countUsers(),
                repo.countUsersByRole(Role.SOLVER),
                repo.countUsersByRole(Role.SEEKER),
                repo.countUsersCreatedSince(LocalDateTime.now().minusDays(7)),
                repo.countUnverifiedUsers(),
                repo.countProblems(),
                repo.countProblemsByStatusIn(List.of(ProblemStatus.OPEN)),
                repo.countProblemsByStatusIn(List.of(ProblemStatus.CLAIMED, ProblemStatus.IN_PROGRESS)),
                repo.countProblemsByStatusIn(List.of(ProblemStatus.SOLVED_OPEN_FOR_IMPROVEMENT, ProblemStatus.COMPLETED)),
                repo.countAttemptsByStatus(SolutionAttemptStatus.ACTIVE),
                repo.countAttemptsByStatus(SolutionAttemptStatus.PENDING_REVIEW),
                repo.countAttemptsByStatus(SolutionAttemptStatus.COMPLETED)
        );
    }

    @Transactional(readOnly = true)
    public AdminPageResponse<AdminActivityResponse> getActivity(String eventType, int page, int size) {
        List<AuditEventType> eventTypes = isBlank(eventType)
                ? Arrays.stream(AuditEventType.values()).filter(t -> !HIDDEN_ACTIVITY.contains(t)).toList()
                : List.of(parseEnum(AuditEventType.class, eventType, "event type"));

        Page<AuditLog> logs = adminDashboardRepository.findPlatformActivity(eventTypes, pageOf(page, size));

        // Batch-resolve the problem titles for this page in one query
        Set<UUID> problemIds = logs.stream().map(AuditLog::getProblemId).collect(Collectors.toSet());
        Map<UUID, String> titles = problemIds.isEmpty()
                ? Map.of()
                : adminDashboardRepository.findProblemTitles(problemIds).stream()
                        .collect(Collectors.toMap(row -> (UUID) row[0], row -> (String) row[1]));

        return mapPage(logs, log -> new AdminActivityResponse(
                log.getId(),
                log.getProblemId(),
                titles.getOrDefault(log.getProblemId(), "Deleted problem"),
                log.getActorName(),
                log.getActorRole(),
                log.getEventType().name(),
                log.getDelta(),
                log.getTimestamp()));
    }

    @Transactional(readOnly = true)
    public AdminPageResponse<AdminUserResponse> getUsers(String role, String search, int page, int size) {
        Role parsedRole = parseEnum(Role.class, role, "role");
        String query = toLikePattern(search);
        Pageable pageable = pageOf(page, size);

        return switch (parsedRole) {
            case SOLVER -> mapPage(adminDashboardRepository.searchSolvers(query, pageable), this::toSolverRow);
            case SEEKER -> mapPage(adminDashboardRepository.searchSeekers(query, pageable), this::toSeekerRow);
            default -> throw new RuntimeException("Only SOLVER and SEEKER users can be listed");
        };
    }

    @Transactional(readOnly = true)
    public AdminPageResponse<AdminProblemResponse> getProblems(String status, String search, int page, int size) {
        List<ProblemStatus> statuses = isBlank(status)
                ? Arrays.asList(ProblemStatus.values())
                : List.of(parseEnum(ProblemStatus.class, status, "status"));

        return mapPage(adminDashboardRepository.searchProblems(statuses, toLikePattern(search), pageOf(page, size)),
                p -> new AdminProblemResponse(
                        p.getId(),
                        p.getTitle(),
                        p.getSeeker().getOrganizationName(),
                        p.getStatus().name(),
                        p.getPreferredProgram(),
                        p.getSdgFocus(),
                        p.getCreatedAt()));
    }

    @Transactional(readOnly = true)
    public AdminAnalyticsResponse getAnalytics() {
        AdminDashboardRepository repo = adminDashboardRepository;
        List<YearMonth> months = lastMonths(ANALYTICS_MONTHS);
        LocalDateTime since = months.get(0).atDay(1).atStartOfDay();

        // User growth: new solvers vs seekers per month
        Map<YearMonth, long[]> signups = emptyBuckets(months, 2);
        for (Object[] row : repo.findSignupsSince(since, List.of(Role.SOLVER, Role.SEEKER))) {
            long[] bucket = signups.get(YearMonth.from((LocalDateTime) row[1]));
            if (bucket != null) bucket[row[0] == Role.SOLVER ? 0 : 1]++;
        }

        // Platform activity: posted / started / completed per month
        Map<YearMonth, long[]> activity = emptyBuckets(months, 3);
        countInto(activity, repo.findProblemPostDatesSince(since), 0);
        countInto(activity, repo.findAttemptStartDatesSince(since), 1);
        countInto(activity, repo.findAttemptCompletionDatesSince(SolutionAttemptStatus.COMPLETED, since), 2);

        Map<Object, Long> byStatus = toCountMap(repo.countProblemsGroupedByStatus());
        AdminAnalyticsResponse.ProblemStatusBreakdown problemStatus = new AdminAnalyticsResponse.ProblemStatusBreakdown(
                byStatus.getOrDefault(ProblemStatus.OPEN, 0L),
                byStatus.getOrDefault(ProblemStatus.CLAIMED, 0L) + byStatus.getOrDefault(ProblemStatus.IN_PROGRESS, 0L),
                byStatus.getOrDefault(ProblemStatus.SOLVED_OPEN_FOR_IMPROVEMENT, 0L),
                byStatus.getOrDefault(ProblemStatus.COMPLETED, 0L),
                byStatus.getOrDefault(ProblemStatus.CLOSED, 0L));

        Map<Object, Long> attemptsByStatus = toCountMap(repo.countAttemptsGroupedByStatus());
        List<AdminAnalyticsResponse.StatusCount> attemptOutcomes = Arrays.stream(SolutionAttemptStatus.values())
                .map(s -> new AdminAnalyticsResponse.StatusCount(s.name(), attemptsByStatus.getOrDefault(s, 0L)))
                .toList();

        List<AdminAnalyticsResponse.SdgCount> sdg = repo.countProblemsGroupedBySdg().stream()
                .map(row -> new AdminAnalyticsResponse.SdgCount((String) row[0], (Long) row[1]))
                .toList();

        List<AdminAnalyticsResponse.PartnerCount> topPartners = repo.findTopPartnersByProblemCount(PageRequest.of(0, TOP_N))
                .stream()
                .map(row -> new AdminAnalyticsResponse.PartnerCount((String) row[0], (Long) row[1]))
                .toList();

        return new AdminAnalyticsResponse(
                months.stream().map(m -> {
                    long[] b = signups.get(m);
                    return new AdminAnalyticsResponse.MonthlyGrowth(m.toString(), b[0], b[1]);
                }).toList(),
                months.stream().map(m -> {
                    long[] b = activity.get(m);
                    return new AdminAnalyticsResponse.MonthlyActivity(m.toString(), b[0], b[1], b[2]);
                }).toList(),
                problemStatus,
                sdg,
                attemptOutcomes,
                buildProgramDemand(repo.countProblemsGroupedByProgram(), repo.countSolversGroupedByProgram()),
                topPartners);
    }

    /**
     * Merges problem demand and solver supply per program. Program names are free text,
     * so they're matched case/whitespace-insensitively, keeping the first label seen.
     */
    private static List<AdminAnalyticsResponse.ProgramDemand> buildProgramDemand(List<Object[]> problemRows,
                                                                                List<Object[]> solverRows) {
        Map<String, String> labels = new LinkedHashMap<>();
        Map<String, long[]> counts = new LinkedHashMap<>();
        BiConsumer<List<Object[]>, Integer> merge = (rows, index) -> {
            for (Object[] row : rows) {
                String label = ((String) row[0]).trim().replaceAll("\\s+", " ");
                String key = label.toLowerCase(Locale.ROOT);
                labels.putIfAbsent(key, label);
                counts.computeIfAbsent(key, k -> new long[2])[index] += (Long) row[1];
            }
        };
        merge.accept(problemRows, 0);
        merge.accept(solverRows, 1);

        return counts.entrySet().stream()
                .sorted(Comparator.comparingLong((Map.Entry<String, long[]> e) -> e.getValue()[0] + e.getValue()[1]).reversed())
                .limit(TOP_N + 2)
                .map(e -> new AdminAnalyticsResponse.ProgramDemand(labels.get(e.getKey()), e.getValue()[0], e.getValue()[1]))
                .toList();
    }

    private static List<YearMonth> lastMonths(int count) {
        YearMonth current = YearMonth.now();
        return IntStream.range(0, count).mapToObj(i -> current.minusMonths(count - 1 - i)).toList();
    }

    private static Map<YearMonth, long[]> emptyBuckets(List<YearMonth> months, int series) {
        Map<YearMonth, long[]> buckets = new LinkedHashMap<>();
        months.forEach(m -> buckets.put(m, new long[series]));
        return buckets;
    }

    private static void countInto(Map<YearMonth, long[]> buckets, List<LocalDateTime> dates, int series) {
        for (LocalDateTime date : dates) {
            if (date == null) continue;
            long[] bucket = buckets.get(YearMonth.from(date));
            if (bucket != null) bucket[series]++;
        }
    }

    private static Map<Object, Long> toCountMap(List<Object[]> rows) {
        Map<Object, Long> map = new HashMap<>();
        rows.forEach(row -> map.put(row[0], (Long) row[1]));
        return map;
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private AdminUserResponse toSolverRow(SolverProfile s) {
        User u = s.getUser();
        String name = (nullToEmpty(s.getFirstName()) + " " + nullToEmpty(s.getLastName())).trim();
        return new AdminUserResponse(u.getId(), u.getEmail(), u.getRole().name(),
                name.isEmpty() ? u.getEmail() : name,
                s.getInstitution(), s.getDegreeProgram(), u.getProfileUrl(),
                u.isVerified(), u.getAuthProvider().name(), u.getCreatedAt());
    }

    private AdminUserResponse toSeekerRow(SeekerProfile s) {
        User u = s.getUser();
        return new AdminUserResponse(u.getId(), u.getEmail(), u.getRole().name(),
                s.getOrganizationName(), s.getContactPerson(), s.getContactNumber(), u.getProfileUrl(),
                u.isVerified(), u.getAuthProvider().name(), u.getCreatedAt());
    }

    private static <S, T> AdminPageResponse<T> mapPage(Page<S> source, Function<S, T> mapper) {
        return AdminPageResponse.of(source, source.getContent().stream().map(mapper).toList());
    }

    private static Pageable pageOf(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.max(1, Math.min(size, MAX_PAGE_SIZE)));
    }

    private static String toLikePattern(String search) {
        return "%" + nullToEmpty(search).trim().toLowerCase(Locale.ROOT) + "%";
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private static <E extends Enum<E>> E parseEnum(Class<E> type, String value, String label) {
        try {
            return Enum.valueOf(type, value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new RuntimeException("Invalid " + label + ": " + value);
        }
    }
}
