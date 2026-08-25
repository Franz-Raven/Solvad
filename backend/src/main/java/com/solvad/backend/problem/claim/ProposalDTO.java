package com.solvad.backend.problem.claim;

import java.util.List;
import java.util.UUID;

public class ProposalDTO {

    private String proposedApproach;
    private List<String> supportingDocuments;
    private UUID parentAttemptId;
    private UUID solverId;
    private UUID problemId;
    private UUID subtaskId;


    public ProposalDTO() {
    }

    public ProposalDTO(String proposedApproach, List<String> supportingDocuments, UUID parentAttemptId, UUID solverId, UUID problemId, UUID subtaskId) {
        this.proposedApproach = proposedApproach;
        this.supportingDocuments = supportingDocuments;
        this.parentAttemptId = parentAttemptId;
        this.solverId = solverId;
        this.problemId = problemId;
        this.subtaskId = subtaskId;
    }

    // Getters and Setters
    public UUID getSubtaskId() { return subtaskId; }
    public void setSubtaskId(UUID subtaskId) { this.subtaskId = subtaskId; }

    public String getProposedApproach() {
        return proposedApproach;
    }

    public void setProposedApproach(String proposedApproach) {
        this.proposedApproach = proposedApproach;
    }

    public List<String> getSupportingDocuments() {
        return supportingDocuments;
    }

    public void setSupportingDocuments(List<String> supportingDocuments) {
        this.supportingDocuments = supportingDocuments;
    }

    public UUID getParentAttemptId() {
        return parentAttemptId;
    }

    public void setParentAttemptId(UUID parentAttemptId) {
        this.parentAttemptId = parentAttemptId;
    }

    public UUID getSolverId() {
        return solverId;
    }

    public void setSolverId(UUID solverId) {
        this.solverId = solverId;
    }

    public UUID getProblemId() {
        return problemId;
    }

    public void setProblemId(UUID problemId) {
        this.problemId = problemId;
    }
}