package com.solvad.backend.problem.solution_attempt;

import com.solvad.backend.problem.subtask.SubtaskSubmissionResponse;
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
    private String profilePictureUrl;
    private String institution;
    private String degreeProgram;
    private String status;
    private List<SubtaskSubmissionResponse> submissions;
    private LocalDateTime claimedAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;
    private UUID parentAttemptId;
    private String parentAttemptName;
    private UUID targetSubtaskId;
    private String targetSubtaskTitle;
    private String parentDescription;
    private List<String> parentFileUrls;
    private String seekerName;
    private String seekerProfileUrl;
    private String rejectionReason; // 🚀 ADDED

    public SolutionAttemptResponse(UUID id, UUID problemId, String problemTitle, UUID solverId, String solverFirstName, String solverLastName, String profilePictureUrl, String institution, String degreeProgram, String status, List<SubtaskSubmissionResponse> submissions, LocalDateTime claimedAt, LocalDateTime updatedAt, LocalDateTime completedAt, UUID parentAttemptId, String parentAttemptName, UUID targetSubtaskId, String targetSubtaskTitle, String parentDescription, List<String> parentFileUrls, String seekerName, String seekerProfileUrl, String rejectionReason) {
        this.id = id;
        this.problemId = problemId;
        this.problemTitle = problemTitle;
        this.solverId = solverId;
        this.solverFirstName = solverFirstName;
        this.solverLastName = solverLastName;
        this.profilePictureUrl = profilePictureUrl;
        this.institution = institution;
        this.degreeProgram = degreeProgram;
        this.status = status;
        this.submissions = submissions;
        this.claimedAt = claimedAt;
        this.updatedAt = updatedAt;
        this.completedAt = completedAt;
        this.parentAttemptId = parentAttemptId;
        this.parentAttemptName = parentAttemptName;
        this.targetSubtaskId = targetSubtaskId;
        this.targetSubtaskTitle = targetSubtaskTitle;
        this.parentDescription = parentDescription;
        this.parentFileUrls = parentFileUrls;
        this.seekerName = seekerName;
        this.seekerProfileUrl = seekerProfileUrl;
        this.rejectionReason = rejectionReason;
    }

    public UUID getId() { return id; }
    public UUID getProblemId() { return problemId; }
    public String getProblemTitle() { return problemTitle; }
    public UUID getSolverId() { return solverId; }
    public String getSolverFirstName() { return solverFirstName; }
    public String getSolverLastName() { return solverLastName; }
    public String getProfilePictureUrl() { return profilePictureUrl; }
    public String getInstitution() { return institution; }
    public String getDegreeProgram() { return degreeProgram; }
    public String getStatus() { return status; }
    public List<SubtaskSubmissionResponse> getSubmissions() { return submissions; }
    public LocalDateTime getClaimedAt() { return claimedAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public UUID getParentAttemptId() { return parentAttemptId; }
    public String getParentAttemptName() { return parentAttemptName; }
    public UUID getTargetSubtaskId() { return targetSubtaskId; }
    public String getTargetSubtaskTitle() { return targetSubtaskTitle; }
    public String getParentDescription() { return parentDescription; }
    public List<String> getParentFileUrls() { return parentFileUrls; }
    public String getSeekerName() { return seekerName; }
    public String getSeekerProfileUrl() { return seekerProfileUrl; }
    public String getRejectionReason() { return rejectionReason; }
}