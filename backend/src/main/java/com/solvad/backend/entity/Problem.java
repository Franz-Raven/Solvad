package com.solvad.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "problems")
public class Problem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "seeker_id", nullable = false)
    private SeekerProfile seeker;

    @Column(nullable = false)
    private String title;

    @Column(name = "background_context", columnDefinition = "TEXT")
    private String backgroundContext;

    @Column(name = "primary_statement", columnDefinition = "TEXT", nullable = false)
    private String primaryStatement;

    @Column(columnDefinition = "TEXT")
    private String objectives;

    @Column(columnDefinition = "TEXT")
    private String constraints;

    @Column(name = "required_course", nullable = false)
    private String requiredCourse;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProblemStatus status = ProblemStatus.OPEN;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Problem() {
    }

    public Problem(SeekerProfile seeker, String title, String backgroundContext, String primaryStatement,
                   String objectives, String constraints, String requiredCourse) {
        this.seeker = seeker;
        this.title = title;
        this.backgroundContext = backgroundContext;
        this.primaryStatement = primaryStatement;
        this.objectives = objectives;
        this.constraints = constraints;
        this.requiredCourse = requiredCourse;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public SeekerProfile getSeeker() {
        return seeker;
    }

    public void setSeeker(SeekerProfile seeker) {
        this.seeker = seeker;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getBackgroundContext() {
        return backgroundContext;
    }

    public void setBackgroundContext(String backgroundContext) {
        this.backgroundContext = backgroundContext;
    }

    public String getPrimaryStatement() {
        return primaryStatement;
    }

    public void setPrimaryStatement(String primaryStatement) {
        this.primaryStatement = primaryStatement;
    }

    public String getObjectives() {
        return objectives;
    }

    public void setObjectives(String objectives) {
        this.objectives = objectives;
    }

    public String getConstraints() {
        return constraints;
    }

    public void setConstraints(String constraints) {
        this.constraints = constraints;
    }

    public String getRequiredCourse() {
        return requiredCourse;
    }

    public void setRequiredCourse(String requiredCourse) {
        this.requiredCourse = requiredCourse;
    }

    public ProblemStatus getStatus() {
        return status;
    }

    public void setStatus(ProblemStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Column(name = "assigned_solver_id")
    private UUID assignedSolverId;

    public UUID getAssignedSolverId() { return assignedSolverId; }
    public void setAssignedSolverId(UUID assignedSolverId) { this.assignedSolverId = assignedSolverId; }
}
