package com.solvad.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
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

    @Column(name = "preferred_program")
    private String preferredProgram;

    // URL of the comprehensive problem document (PDF) stored in Cloudinary
    @Column(name = "problem_document_url", columnDefinition = "TEXT")
    private String problemDocumentUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProblemStatus status = ProblemStatus.OPEN;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "problem_tags", joinColumns = @JoinColumn(name = "problem_id"))
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Problem() {
    }

    public Problem(SeekerProfile seeker, String title, String backgroundContext, String primaryStatement,
                   String objectives, String constraints, String preferredProgram) {
        this.seeker = seeker;
        this.title = title;
        this.backgroundContext = backgroundContext;
        this.primaryStatement = primaryStatement;
        this.objectives = objectives;
        this.constraints = constraints;
        this.preferredProgram = preferredProgram;
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

    public String getPreferredProgram() {
        return preferredProgram;
    }

    public void setPreferredProgram(String preferredProgram) {
        this.preferredProgram = preferredProgram;
    }

    public String getProblemDocumentUrl() {
        return problemDocumentUrl;
    }

    public void setProblemDocumentUrl(String problemDocumentUrl) {
        this.problemDocumentUrl = problemDocumentUrl;
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

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags != null ? tags : new ArrayList<>();
    }
}
