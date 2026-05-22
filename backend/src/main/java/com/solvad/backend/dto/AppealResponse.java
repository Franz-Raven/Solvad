package com.solvad.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class AppealResponse {

    private UUID id;
    private UUID problemId;
    private UUID solverId;
    private String solverFirstName;
    private String solverLastName;
    private String solverInstitution;
    private String message;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
    private UUID attemptId;

    public AppealResponse() {
    }

    public AppealResponse(UUID id, UUID problemId, UUID solverId, String solverFirstName,
                         String solverLastName, String solverInstitution, String message,
                         String status, LocalDateTime createdAt, LocalDateTime reviewedAt,
                         UUID attemptId) {
        this.id = id;
        this.problemId = problemId;
        this.solverId = solverId;
        this.solverFirstName = solverFirstName;
        this.solverLastName = solverLastName;
        this.solverInstitution = solverInstitution;
        this.message = message;
        this.status = status;
        this.createdAt = createdAt;
        this.reviewedAt = reviewedAt;
        this.attemptId = attemptId;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getProblemId() {
        return problemId;
    }

    public void setProblemId(UUID problemId) {
        this.problemId = problemId;
    }

    public UUID getSolverId() {
        return solverId;
    }

    public void setSolverId(UUID solverId) {
        this.solverId = solverId;
    }

    public String getSolverFirstName() {
        return solverFirstName;
    }

    public void setSolverFirstName(String solverFirstName) {
        this.solverFirstName = solverFirstName;
    }

    public String getSolverLastName() {
        return solverLastName;
    }

    public void setSolverLastName(String solverLastName) {
        this.solverLastName = solverLastName;
    }

    public String getSolverInstitution() {
        return solverInstitution;
    }

    public void setSolverInstitution(String solverInstitution) {
        this.solverInstitution = solverInstitution;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
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

    public UUID getAttemptId() {
        return attemptId;
    }

    public void setAttemptId(UUID attemptId) {
        this.attemptId = attemptId;
    }
}
