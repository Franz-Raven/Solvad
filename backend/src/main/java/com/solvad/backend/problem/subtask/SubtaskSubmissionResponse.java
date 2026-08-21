package com.solvad.backend.problem.subtask;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class SubtaskSubmissionResponse {

    private UUID id;
    private UUID subtaskId;
    private String subtaskTitle;
    private String subtaskDepartmentFocus;
    private String description;
    private List<String> fileUrls;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime submittedAt;
    private String deltaDescription;

    public SubtaskSubmissionResponse() {
    }

    public SubtaskSubmissionResponse(UUID id, UUID subtaskId, String subtaskTitle,
                                     String subtaskDepartmentFocus, String description,
                                     List<String> fileUrls, String status,
                                     LocalDateTime createdAt, LocalDateTime updatedAt,
                                     LocalDateTime submittedAt, String deltaDescription) {
        this.id = id;
        this.subtaskId = subtaskId;
        this.subtaskTitle = subtaskTitle;
        this.subtaskDepartmentFocus = subtaskDepartmentFocus;
        this.description = description;
        this.fileUrls = fileUrls;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.submittedAt = submittedAt;
        this.deltaDescription = deltaDescription;
    }

    public String getDeltaDescription() {
        return deltaDescription;
    }
    public void setDeltaDescription(String deltaDescription) {
        this.deltaDescription = deltaDescription;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getSubtaskId() { return subtaskId; }
    public void setSubtaskId(UUID subtaskId) { this.subtaskId = subtaskId; }

    public String getSubtaskTitle() { return subtaskTitle; }
    public void setSubtaskTitle(String subtaskTitle) { this.subtaskTitle = subtaskTitle; }

    public String getSubtaskDepartmentFocus() { return subtaskDepartmentFocus; }
    public void setSubtaskDepartmentFocus(String subtaskDepartmentFocus) { this.subtaskDepartmentFocus = subtaskDepartmentFocus; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public List<String> getFileUrls() { return fileUrls; }
    public void setFileUrls(List<String> fileUrls) { this.fileUrls = fileUrls; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
}