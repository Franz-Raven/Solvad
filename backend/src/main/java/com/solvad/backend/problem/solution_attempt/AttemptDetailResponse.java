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
    private String terminationReason; // 🚀 Moved up to group with rejection
    private String deltaDescription;

    // 🚀 Constructor updated to 11 arguments matching SolutionAttemptService mapping
    public AttemptDetailResponse(UUID id, UUID problemId, String problemTitle, String targetSubtaskTitle, String status, LocalDateTime completedAt, String summary, List<String> attachedFiles, String rejectionReason, String terminationReason, String deltaDescription) {
        this.id = id;
        this.problemId = problemId;
        this.problemTitle = problemTitle;
        this.targetSubtaskTitle = targetSubtaskTitle;
        this.status = status;
        this.completedAt = completedAt;
        this.summary = summary;
        this.attachedFiles = attachedFiles;
        this.rejectionReason = rejectionReason;
        this.terminationReason = terminationReason; // 🚀 Added
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
    public String getTerminationReason() { return terminationReason; } // 🚀 Added
    public void setTerminationReason(String terminationReason) { this.terminationReason = terminationReason; } // 🚀 Added
    public String getDeltaDescription() { return deltaDescription; }
}