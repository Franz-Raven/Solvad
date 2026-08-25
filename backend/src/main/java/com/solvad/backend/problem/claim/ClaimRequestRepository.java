package com.solvad.backend.problem.claim;

import com.solvad.backend.problem.core.Problem;
import com.solvad.backend.problem.subtask.ProblemSubtask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClaimRequestRepository extends JpaRepository<ClaimRequest, UUID> {

    List<ClaimRequest> findByProblemAndStatus(Problem problem, ClaimRequestStatus status);

    boolean existsByProblemIdAndSolverIdAndStatusIn(UUID problemId, UUID solverId, List<ClaimRequestStatus> statuses);

    @Modifying
    @Query("UPDATE ClaimRequest c SET c.status = 'CANCELLED' WHERE c.problem.id = :problemId AND c.status = 'PENDING'")
    void cancelRemainingPendingRequests(@Param("problemId") UUID problemId);

    Optional<ClaimRequest> findTopByProblemIdAndSolverIdOrderByCreatedAtDesc(UUID problemId, UUID solverId);
    // Check pending/approved proposal for aaa specific subtask (not whole problem)
    boolean existsByProblemIdAndTargetSubtaskIdAndSolverIdAndStatusIn(
            UUID problemId, UUID subtaskId, UUID solverId, List<ClaimRequestStatus> statuses);

    // Get solver's latest proposal for aaa specific subtask
    Optional<ClaimRequest> findTopByProblemIdAndTargetSubtaskIdAndSolverIdOrderByCreatedAtDesc(
            UUID problemId, UUID subtaskId, UUID solverId);

    // Cancel pending requests for aaa specific subtask when capacity is reached
    @Modifying
    @Query("UPDATE ClaimRequest c SET c.status = 'CANCELLED' WHERE c.problem.id = :problemId AND c.targetSubtask.id = :subtaskId AND c.status = 'PENDING'")
    void cancelRemainingPendingRequestsForSubtask(@Param("problemId") UUID problemId, @Param("subtaskId") UUID subtaskId);

    List<ClaimRequest> findByProblemAndTargetSubtaskAndStatus(
            Problem problem, ProblemSubtask targetSubtask, ClaimRequestStatus status);
}