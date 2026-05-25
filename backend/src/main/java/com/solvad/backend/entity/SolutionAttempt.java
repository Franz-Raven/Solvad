package com.solvad.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "solution_attempts")
public class SolutionAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @ManyToOne
    @JoinColumn(name = "solver_id", nullable = false)
    private SolverProfile solver;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SolutionAttemptStatus status = SolutionAttemptStatus.ACTIVE;

    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SubtaskSubmission> submissions = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "claimed_at", nullable = false, updatable = false)
    private LocalDateTime claimedAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_subtask_id", nullable = true)
    private ProblemSubtask targetSubtask;

    // getter + setter
    public ProblemSubtask getTargetSubtask() { return targetSubtask; }
    public void setTargetSubtask(ProblemSubtask targetSubtask) { this.targetSubtask = targetSubtask; }

    // Add this below your other @ManyToOne relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_attempt_id")
    private SolutionAttempt parentAttempt;

    // Add Getter and Setter
    public SolutionAttempt getParentAttempt() { return parentAttempt; }
    public void setParentAttempt(SolutionAttempt parentAttempt) { this.parentAttempt = parentAttempt; }

    public SolutionAttempt() {
    }

    public SolutionAttempt(Problem problem, SolverProfile solver) {
        this.problem = problem;
        this.solver = solver;
    }



    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Problem getProblem() { return problem; }
    public void setProblem(Problem problem) { this.problem = problem; }

    public SolverProfile getSolver() { return solver; }
    public void setSolver(SolverProfile solver) { this.solver = solver; }

    public SolutionAttemptStatus getStatus() { return status; }
    public void setStatus(SolutionAttemptStatus status) { this.status = status; }

    public List<SubtaskSubmission> getSubmissions() { return submissions; }
    public void setSubmissions(List<SubtaskSubmission> submissions) { this.submissions = submissions; }

    public LocalDateTime getClaimedAt() { return claimedAt; }
    public void setClaimedAt(LocalDateTime claimedAt) { this.claimedAt = claimedAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}