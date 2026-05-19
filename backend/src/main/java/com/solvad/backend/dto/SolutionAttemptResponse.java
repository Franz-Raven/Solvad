package com.solvad.backend.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class SolutionAttemptResponse {

    private UUID id;
    private UUID problemId;
    private String problemTitle;
    private UUID solverId;
    private String solverFirstName;
    private String solverLastName;
    private String solverInstitution;
    private String solverDegreeProgram;
    private String status;
    private List<SubtaskSubmissionResponse> submissions;
    private LocalDateTime claimedAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;
    // Add these fields
    private UUID parentAttemptId;
    private String parentSolverName;

    // Update your constructor to accept these, and add getters/setters!

    public SolutionAttemptResponse() {
    }

    public SolutionAttemptResponse(UUID id, UUID problemId, String problemTitle,
                                   UUID solverId, String solverFirstName, String solverLastName,
                                   String solverInstitution, String solverDegreeProgram,
                                   String status, List<SubtaskSubmissionResponse> submissions,
                                   LocalDateTime claimedAt, LocalDateTime updatedAt,
                                   LocalDateTime completedAt,
                                   UUID parentAttemptId, String parentSolverName) {
        this.id = id;
        this.problemId = problemId;
        this.problemTitle = problemTitle;
        this.solverId = solverId;
        this.solverFirstName = solverFirstName;
        this.solverLastName = solverLastName;
        this.solverInstitution = solverInstitution;
        this.solverDegreeProgram = solverDegreeProgram;
        this.status = status;
        this.submissions = submissions;
        this.claimedAt = claimedAt;
        this.updatedAt = updatedAt;
        this.completedAt = completedAt;
        this.parentAttemptId = parentAttemptId;
        this.parentSolverName = parentSolverName;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getProblemId() { return problemId; }
    public void setProblemId(UUID problemId) { this.problemId = problemId; }

    public String getProblemTitle() { return problemTitle; }
    public void setProblemTitle(String problemTitle) { this.problemTitle = problemTitle; }

    public UUID getSolverId() { return solverId; }
    public void setSolverId(UUID solverId) { this.solverId = solverId; }

    public String getSolverFirstName() { return solverFirstName; }
    public void setSolverFirstName(String solverFirstName) { this.solverFirstName = solverFirstName; }

    public String getSolverLastName() { return solverLastName; }
    public void setSolverLastName(String solverLastName) { this.solverLastName = solverLastName; }

    public String getSolverInstitution() { return solverInstitution; }
    public void setSolverInstitution(String solverInstitution) { this.solverInstitution = solverInstitution; }

    public String getSolverDegreeProgram() { return solverDegreeProgram; }
    public void setSolverDegreeProgram(String solverDegreeProgram) { this.solverDegreeProgram = solverDegreeProgram; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<SubtaskSubmissionResponse> getSubmissions() { return submissions; }
    public void setSubmissions(List<SubtaskSubmissionResponse> submissions) { this.submissions = submissions; }

    public LocalDateTime getClaimedAt() { return claimedAt; }
    public void setClaimedAt(LocalDateTime claimedAt) { this.claimedAt = claimedAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    // Add these right before the final closing brace } of the class

    private String deltaDescription;

    public UUID getParentAttemptId() {
        return parentAttemptId;
    }
    public void setParentAttemptId(UUID parentAttemptId) {
        this.parentAttemptId = parentAttemptId;
    }

    public String getParentSolverName() {
        return parentSolverName;
    }
    public void setParentSolverName(String parentSolverName) {
        this.parentSolverName = parentSolverName;
    }

    public String getDeltaDescription() { return deltaDescription; }
    public void setDeltaDescription(String deltaDescription) { this.deltaDescription = deltaDescription; }

}