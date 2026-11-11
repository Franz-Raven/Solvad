package com.solvad.backend.admin;

import com.solvad.backend.audit.AuditEventType;
import com.solvad.backend.audit.AuditLog;
import com.solvad.backend.problem.core.Problem;
import com.solvad.backend.problem.core.ProblemStatus;
import com.solvad.backend.problem.solution_attempt.SolutionAttemptStatus;
import com.solvad.backend.profile.seeker.SeekerProfile;
import com.solvad.backend.profile.solver.SolverProfile;
import com.solvad.backend.user.Role;
import com.solvad.backend.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * Read-only, admin-owned queries across the platform.
 * Kept in the admin package so existing feature repositories stay untouched.
 */
public interface AdminDashboardRepository extends Repository<User, UUID> {

    // ── User counters ────────────────────────────────────────────────────────
    @Query("SELECT COUNT(u) FROM User u")
    long countUsers();

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role")
    long countUsersByRole(@Param("role") Role role);

    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :since")
    long countUsersCreatedSince(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(u) FROM User u WHERE u.isVerified = false")
    long countUnverifiedUsers();

    // ── Problem / attempt counters ───────────────────────────────────────────
    @Query("SELECT COUNT(p) FROM Problem p")
    long countProblems();

    @Query("SELECT COUNT(p) FROM Problem p WHERE p.status IN :statuses")
    long countProblemsByStatusIn(@Param("statuses") Collection<ProblemStatus> statuses);

    @Query("SELECT COUNT(a) FROM SolutionAttempt a WHERE a.status = :status")
    long countAttemptsByStatus(@Param("status") SolutionAttemptStatus status);

    // ── Paginated lists (newest first) ───────────────────────────────────────
    @Query(value = "SELECT s FROM SolverProfile s JOIN s.user u WHERE " +
                   "LOWER(u.email) LIKE :query OR LOWER(s.firstName) LIKE :query OR " +
                   "LOWER(s.lastName) LIKE :query OR LOWER(COALESCE(s.institution, '')) LIKE :query " +
                   "ORDER BY u.createdAt DESC",
           countQuery = "SELECT COUNT(s) FROM SolverProfile s JOIN s.user u WHERE " +
                   "LOWER(u.email) LIKE :query OR LOWER(s.firstName) LIKE :query OR " +
                   "LOWER(s.lastName) LIKE :query OR LOWER(COALESCE(s.institution, '')) LIKE :query")
    Page<SolverProfile> searchSolvers(@Param("query") String query, Pageable pageable);

    @Query(value = "SELECT s FROM SeekerProfile s JOIN s.user u WHERE " +
                   "LOWER(u.email) LIKE :query OR LOWER(s.organizationName) LIKE :query OR " +
                   "LOWER(COALESCE(s.contactPerson, '')) LIKE :query " +
                   "ORDER BY u.createdAt DESC",
           countQuery = "SELECT COUNT(s) FROM SeekerProfile s JOIN s.user u WHERE " +
                   "LOWER(u.email) LIKE :query OR LOWER(s.organizationName) LIKE :query OR " +
                   "LOWER(COALESCE(s.contactPerson, '')) LIKE :query")
    Page<SeekerProfile> searchSeekers(@Param("query") String query, Pageable pageable);

    @Query(value = "SELECT p FROM Problem p JOIN p.seeker s WHERE p.status IN :statuses AND " +
                   "(LOWER(p.title) LIKE :query OR LOWER(s.organizationName) LIKE :query) " +
                   "ORDER BY p.createdAt DESC",
           countQuery = "SELECT COUNT(p) FROM Problem p JOIN p.seeker s WHERE p.status IN :statuses AND " +
                   "(LOWER(p.title) LIKE :query OR LOWER(s.organizationName) LIKE :query)")
    Page<Problem> searchProblems(@Param("statuses") Collection<ProblemStatus> statuses,
                                 @Param("query") String query,
                                 Pageable pageable);

    // ── Activity feed ────────────────────────────────────────────────────────
    @Query(value = "SELECT a FROM AuditLog a WHERE a.eventType IN :eventTypes ORDER BY a.timestamp DESC",
           countQuery = "SELECT COUNT(a) FROM AuditLog a WHERE a.eventType IN :eventTypes")
    Page<AuditLog> findPlatformActivity(@Param("eventTypes") Collection<AuditEventType> eventTypes,
                                        Pageable pageable);

    /** Returns [id, title] pairs; AuditLog stores only the problem id. */
    @Query("SELECT p.id, p.title FROM Problem p WHERE p.id IN :ids")
    List<Object[]> findProblemTitles(@Param("ids") Collection<UUID> ids);

    // ── Analytics: time series (bucketed by month in the service) ────────────
    /** Returns [role, createdAt] pairs. */
    @Query("SELECT u.role, u.createdAt FROM User u WHERE u.createdAt >= :since AND u.role IN :roles")
    List<Object[]> findSignupsSince(@Param("since") LocalDateTime since, @Param("roles") Collection<Role> roles);

    @Query("SELECT p.createdAt FROM Problem p WHERE p.createdAt >= :since")
    List<LocalDateTime> findProblemPostDatesSince(@Param("since") LocalDateTime since);

    @Query("SELECT a.claimedAt FROM SolutionAttempt a WHERE a.claimedAt >= :since")
    List<LocalDateTime> findAttemptStartDatesSince(@Param("since") LocalDateTime since);

    @Query("SELECT a.completedAt FROM SolutionAttempt a WHERE a.status = :status AND a.completedAt >= :since")
    List<LocalDateTime> findAttemptCompletionDatesSince(@Param("status") SolutionAttemptStatus status,
                                                        @Param("since") LocalDateTime since);

    // ── Analytics: distributions (all return [key, count] pairs) ─────────────
    @Query("SELECT p.status, COUNT(p) FROM Problem p GROUP BY p.status")
    List<Object[]> countProblemsGroupedByStatus();

    @Query("SELECT a.status, COUNT(a) FROM SolutionAttempt a GROUP BY a.status")
    List<Object[]> countAttemptsGroupedByStatus();

    @Query("SELECT p.sdgFocus, COUNT(p) FROM Problem p WHERE p.sdgFocus IS NOT NULL AND p.sdgFocus <> '' GROUP BY p.sdgFocus")
    List<Object[]> countProblemsGroupedBySdg();

    @Query("SELECT p.preferredProgram, COUNT(p) FROM Problem p " +
           "WHERE p.preferredProgram IS NOT NULL AND p.preferredProgram <> '' GROUP BY p.preferredProgram")
    List<Object[]> countProblemsGroupedByProgram();

    @Query("SELECT s.degreeProgram, COUNT(s) FROM SolverProfile s " +
           "WHERE s.degreeProgram IS NOT NULL AND s.degreeProgram <> '' GROUP BY s.degreeProgram")
    List<Object[]> countSolversGroupedByProgram();

    /** Returns [organizationName, problemCount], most active first; limit via Pageable. */
    @Query("SELECT s.organizationName, COUNT(p) FROM Problem p JOIN p.seeker s " +
           "GROUP BY s.id, s.organizationName ORDER BY COUNT(p) DESC")
    List<Object[]> findTopPartnersByProblemCount(Pageable pageable);
}
