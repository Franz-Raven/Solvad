package com.solvad.backend.merit;

import com.solvad.backend.problem.solution_attempt.SolutionAttempt;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface MeritRepository extends Repository<SolutionAttempt, UUID> {

    @Query("SELECT a.solver.id AS solverId, a.status AS status, a.claimedAt AS claimedAt, a.completedAt AS completedAt " +
            "FROM SolutionAttempt a WHERE a.solver.id IN :solverIds")
    List<SolverAttemptMetricsProjection> getMetricsDataForSolvers(@Param("solverIds") Set<UUID> solverIds);
}