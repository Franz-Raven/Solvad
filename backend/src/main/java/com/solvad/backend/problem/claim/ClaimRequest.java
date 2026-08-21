package com.solvad.backend.problem.claim;

import com.solvad.backend.problem.core.Problem;
import com.solvad.backend.problem.subtask.ProblemSubtask;
import com.solvad.backend.solution.attempt.SolutionAttempt;
import com.solvad.backend.profile.solver.SolverProfile;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "claim_requests")
public class ClaimRequest {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solver_id", nullable = false)
    private SolverProfile solver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_attempt_id")
    private SolutionAttempt parentAttempt;

    @Column(name = "proposed_approach", columnDefinition = "TEXT", nullable = false)
    private String proposedApproach;

    @Column(name = "supporting_documents", columnDefinition = "TEXT")
    private String supportingDocuments;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ClaimRequestStatus status = ClaimRequestStatus.PENDING;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_subtask_id", nullable = true)
    private ProblemSubtask targetSubtask;

    // getter + setter
    public ProblemSubtask getTargetSubtask() { return targetSubtask; }
    public void setTargetSubtask(ProblemSubtask targetSubtask) { this.targetSubtask = targetSubtask; }

    public ClaimRequest() {
    }

    public ClaimRequest(Problem problem, SolverProfile solver, String proposedApproach, String supportingDocuments, SolutionAttempt parentAttempt) {
        this.problem = problem;
        this.solver = solver;
        this.proposedApproach = proposedApproach;
        this.supportingDocuments = supportingDocuments;
        this.parentAttempt = parentAttempt;
        this.status = ClaimRequestStatus.PENDING;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Problem getProblem() {
        return problem;
    }

    public void setProblem(Problem problem) {
        this.problem = problem;
    }

    public SolverProfile getSolver() {
        return solver;
    }

    public void setSolver(SolverProfile solver) {
        this.solver = solver;
    }

    public SolutionAttempt getParentAttempt() {
        return parentAttempt;
    }

    public void setParentAttempt(SolutionAttempt parentAttempt) {
        this.parentAttempt = parentAttempt;
    }

    public String getProposedApproach() {
        return proposedApproach;
    }

    public void setProposedApproach(String proposedApproach) {
        this.proposedApproach = proposedApproach;
    }

    public String getSupportingDocuments() {
        return supportingDocuments;
    }

    public void setSupportingDocuments(String supportingDocuments) {
        this.supportingDocuments = supportingDocuments;
    }

    public ClaimRequestStatus getStatus() {
        return status;
    }

    public void setStatus(ClaimRequestStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }


}