package com.solvad.backend.problem.solution_attempt;

import com.solvad.backend.problem.core.Problem;
import com.solvad.backend.problem.subtask.ProblemSubtask;
import com.solvad.backend.profile.solver.SolverProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SolutionAttemptRepository extends JpaRepository<SolutionAttempt, UUID> {

    boolean existsByProblemAndStatus(Problem problem, SolutionAttemptStatus status);

    // Single active attempt — used by getMyAttempt
    Optional<SolutionAttempt> findFirstByProblemAndSolverAndStatusOrderByClaimedAtDesc(
            Problem problem, SolverProfile solver, SolutionAttemptStatus status);

    // List of active attempts — used by getMyActiveAttemptsForProblem
    List<SolutionAttempt> findByProblemAndSolverAndStatus(
            Problem problem, SolverProfile solver, SolutionAttemptStatus status);

    boolean existsByProblemAndSolverAndStatus(
            Problem problem, SolverProfile solver, SolutionAttemptStatus status);

    List<SolutionAttempt> findByProblemOrderByClaimedAtDesc(Problem problem);

    List<SolutionAttempt> findBySolverOrderByClaimedAtDesc(SolverProfile solver);

    List<SolutionAttempt> findByProblemAndStatus(
            Problem problem, SolutionAttemptStatus status);

    long countByProblemAndStatus(Problem problem, SolutionAttemptStatus status);

    @Query("SELECT COUNT(a) FROM SolutionAttempt a WHERE a.problem.id = :problemId AND a.targetSubtask.id = :subtaskId AND a.status = 'ACTIVE'")
    int countActiveSolversBySubtaskId(@Param("problemId") UUID problemId, @Param("subtaskId") UUID subtaskId);

    List<SolutionAttempt> findByProblemIdAndTargetSubtaskIdOrderByClaimedAtAsc(UUID problemId, UUID subtaskId);

    boolean existsByProblemAndTargetSubtaskAndSolverAndStatus(
            Problem problem, ProblemSubtask targetSubtask, SolverProfile solver, SolutionAttemptStatus status);

    Optional<SolutionAttempt> findFirstByProblemAndSolverOrderByClaimedAtDesc(
            Problem problem, SolverProfile solver);
}