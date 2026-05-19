package com.solvad.backend.repository;

import com.solvad.backend.entity.Problem;
import com.solvad.backend.entity.SolutionAttempt;
import com.solvad.backend.entity.SolutionAttemptStatus;
import com.solvad.backend.entity.SolverProfile;
import org.springframework.data.jpa.repository.JpaRepository;
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
}