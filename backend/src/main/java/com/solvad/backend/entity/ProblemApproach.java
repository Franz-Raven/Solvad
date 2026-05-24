package com.solvad.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "problem_approaches",
        uniqueConstraints = @UniqueConstraint(columnNames = {"problem_id", "solver_id"}))
public class ProblemApproach {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @ManyToOne
    @JoinColumn(name = "solver_id", nullable = false)
    private SolverProfile solver;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String approachDescription;

    @Enumerated(EnumType.STRING)
    private ApproachStatus status = ApproachStatus.SUBMITTED;

    @CreationTimestamp
    @Column(name = "submitted_at", nullable = false, updatable = false)
    private LocalDateTime submittedAt;

    public ProblemApproach() {}

    public ProblemApproach(Problem problem, SolverProfile solver, String approachDescription) {
        this.problem = problem;
        this.solver = solver;
        this.approachDescription = approachDescription;
    }

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

    public String getApproachDescription() {
        return approachDescription;
    }

    public void setApproachDescription(String approachDescription) {
        this.approachDescription = approachDescription;
    }

    public ApproachStatus getStatus() {
        return status;
    }

    public void setStatus(ApproachStatus status) {
        this.status = status;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }
}