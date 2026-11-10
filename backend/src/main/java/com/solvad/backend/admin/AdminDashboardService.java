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
import java.util.Arrays;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AdminDashboardService {

    private static final int MAX_PAGE_SIZE = 50;

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
