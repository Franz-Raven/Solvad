package com.solvad.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "appeals")
public class Appeal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @ManyToOne
    @JoinColumn(name = "solver_id", nullable = false)
    private SolverProfile solver;

    @OneToOne
    @JoinColumn(name = "solution_attempt_id")
    private SolutionAttempt solutionAttempt;

    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppealStatus status = AppealStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @ManyToOne
    @JoinColumn(name = "reviewed_by")
    private SeekerProfile reviewedBy;

    public Appeal() {
    }

    public Appeal(Problem problem, SolverProfile solver, String message) {
        this.problem = problem;
        this.solver = solver;
        this.message = message;
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

    public SolutionAttempt getSolutionAttempt() {
        return solutionAttempt;
    }

    public void setSolutionAttempt(SolutionAttempt solutionAttempt) {
        this.solutionAttempt = solutionAttempt;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public AppealStatus getStatus() {
        return status;
    }

    public void setStatus(AppealStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public SeekerProfile getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(SeekerProfile reviewedBy) {
        this.reviewedBy = reviewedBy;
    }
}
