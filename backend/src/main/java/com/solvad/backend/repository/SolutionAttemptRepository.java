package com.solvad.backend.repository;

import com.solvad.backend.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SolutionAttemptRepository extends JpaRepository<SolutionAttempt, UUID> {

    // Check if a problem already has an active claim
    boolean existsByProblemAndStatus(Problem problem, SolutionAttemptStatus status);

    // Get the active attempt for a problem (for seeker view / solver current work)
    Optional<SolutionAttempt> findByProblemAndStatus(Problem problem, SolutionAttemptStatus status);

    // Get the solver's active attempt on a specific problem
    Optional<SolutionAttempt> findByProblemAndSolverAndStatus(Problem problem, SolverProfile solver, SolutionAttemptStatus status);

    // Get all attempts for a problem (for the attempt tree on seeker side)
    List<SolutionAttempt> findByProblemOrderByClaimedAtDesc(Problem problem);

    // Get all attempts by a solver (for solver history)
    List<SolutionAttempt> findBySolverOrderByClaimedAtDesc(SolverProfile solver);

    // Check if solver already has an active attempt on this problem
    boolean existsByProblemAndSolverAndStatus(Problem problem, SolverProfile solver, SolutionAttemptStatus status);

    @Query("SELECT COUNT(sa) FROM SolutionAttempt sa WHERE sa.problem.id = :problemId AND sa.status = 'ACTIVE'")
    int countActiveSolversByProblemId(@Param("problemId") UUID problemId);

    // Replace the old countActiveSolversByProblemId with this subtask-scoped version
    @Query("SELECT COUNT(a) FROM SolutionAttempt a WHERE a.problem.id = :problemId AND a.targetSubtask.id = :subtaskId AND a.status = 'ACTIVE'")
    int countActiveSolversBySubtaskId(@Param("problemId") UUID problemId, @Param("subtaskId") UUID subtaskId);

    // Find by problem + subtask + status (for tree view)
    List<SolutionAttempt> findByProblemIdAndTargetSubtaskIdOrderByClaimedAtAsc(UUID problemId, UUID subtaskId);

    // Check if solver already has active attempt on this specific subtask
    boolean existsByProblemAndTargetSubtaskAndSolverAndStatus(
            Problem problem, ProblemSubtask targetSubtask, SolverProfile solver, SolutionAttemptStatus status);
}