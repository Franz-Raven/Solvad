package com.solvad.backend.problem.solution_attempt;

import com.solvad.backend.problem.core.Problem;
import com.solvad.backend.problem.subtask.ProblemSubtask;
import com.solvad.backend.profile.solver.SolverProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SolutionAttemptRepository extends JpaRepository<SolutionAttempt, UUID> {


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

    Page<SolutionAttempt> findBySolverAndStatusInOrderByClaimedAtDesc(
            SolverProfile solver,
            List<SolutionAttemptStatus> statuses,
            Pageable pageable
    );

    long countByProblemAndTargetSubtaskAndStatus(Problem problem, ProblemSubtask targetSubtask, SolutionAttemptStatus status);
    List<SolutionAttempt> findByProblemInAndStatus(List<Problem> problems, SolutionAttemptStatus status);

}