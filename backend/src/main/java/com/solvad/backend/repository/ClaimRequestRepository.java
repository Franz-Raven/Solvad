package com.solvad.backend.repository;

import com.solvad.backend.entity.ClaimRequest;
import com.solvad.backend.entity.ClaimRequestStatus;
import com.solvad.backend.entity.Problem;
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
}