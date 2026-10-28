package com.solvad.backend.merit;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MeritService {

    private final MeritRepository meritRepository;

    public MeritService(MeritRepository meritRepository) {
        this.meritRepository = meritRepository;
    }

    public Map<UUID, SolverMeritDTO> getMetricsForSolvers(Set<UUID> solverIds) {
        if (solverIds == null || solverIds.isEmpty()) {
            return Collections.emptyMap();
        }

        // Fetch all raw data
        Map<UUID, List<SolverAttemptMetricsProjection>> attemptsBySolver = meritRepository
                .getMetricsDataForSolvers(solverIds)
                .stream()
                .collect(Collectors.groupingBy(SolverAttemptMetricsProjection::getSolverId));

        // Calculate and map results
        Map<UUID, SolverMeritDTO> results = new HashMap<>();
        for (UUID solverId : solverIds) {
            List<SolverAttemptMetricsProjection> attempts = attemptsBySolver.getOrDefault(solverId, List.of());
            results.put(solverId, calculateMetrics(attempts));
        }

        return results;
    }

    private SolverMeritDTO calculateMetrics(List<SolverAttemptMetricsProjection> attempts) {
        if (attempts.isEmpty()) {
            return new SolverMeritDTO(0, 0.0, null);
        }

        long completedCount = 0;
        long totalTurnaroundSeconds = 0;

        for (SolverAttemptMetricsProjection a : attempts) {
            if ("COMPLETED".equalsIgnoreCase(a.getStatus())) {
                completedCount++;
                if (a.getClaimedAt() != null && a.getCompletedAt() != null) {
                    totalTurnaroundSeconds += Duration.between(a.getClaimedAt(), a.getCompletedAt()).getSeconds();
                }
            }
        }

        double completionRate = ((double) completedCount / attempts.size()) * 100.0;

        Double avgTurnaroundDays = null;
        if (completedCount > 0 && totalTurnaroundSeconds > 0) {
            avgTurnaroundDays = (double) totalTurnaroundSeconds / completedCount / 86400.0; // Seconds to Days
        }

        return new SolverMeritDTO(completedCount, completionRate, avgTurnaroundDays);
    }


    public SolverMeritDTO getMetricsForSolver(UUID solverId) {
        if (solverId == null) {
            return new SolverMeritDTO(0, 0.0, null);
        }
        // Reuse your existing bulk method for a single ID, providing a default if none exist
        return getMetricsForSolvers(Set.of(solverId))
                .getOrDefault(solverId, new SolverMeritDTO(0, 0.0, null));
    }


}