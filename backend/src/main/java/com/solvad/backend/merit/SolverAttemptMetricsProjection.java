package com.solvad.backend.merit;

import java.time.Instant;
import java.util.UUID;

public interface SolverAttemptMetricsProjection {
    UUID getSolverId();
    String getStatus();
    Instant getClaimedAt();
    Instant getCompletedAt();
}