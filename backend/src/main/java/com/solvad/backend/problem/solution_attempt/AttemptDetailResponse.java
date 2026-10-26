package com.solvad.backend.problem.solution_attempt;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class AttemptDetailResponse {
    private UUID id;
    private UUID problemId;
    private String problemTitle;
    private String targetSubtaskTitle;
    private String status;
    private LocalDateTime completedAt;
    private String summary;
    private List<String> attachedFiles;
    private String rejectionReason;
    private String deltaDescription; // 🚀 ADDED

    public AttemptDetailResponse(UUID id, UUID problemId, String problemTitle, String targetSubtaskTitle, String status, LocalDateTime completedAt, String summary, List<String> attachedFiles, String rejectionReason, String deltaDescription) {
        this.id = id;
        this.problemId = problemId;
        this.problemTitle = problemTitle;
        this.targetSubtaskTitle = targetSubtaskTitle;
        this.status = status;
        this.completedAt = completedAt;
        this.summary = summary;
        this.attachedFiles = attachedFiles;
        this.rejectionReason = rejectionReason;
        this.deltaDescription = deltaDescription;
    }

    public UUID getId() { return id; }
    public UUID getProblemId() { return problemId; }
    public String getProblemTitle() { return problemTitle; }
    public String getTargetSubtaskTitle() { return targetSubtaskTitle; }
    public String getStatus() { return status; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public String getSummary() { return summary; }
    public List<String> getAttachedFiles() { return attachedFiles; }
    public String getRejectionReason() { return rejectionReason; }
    public String getDeltaDescription() { return deltaDescription; }
}