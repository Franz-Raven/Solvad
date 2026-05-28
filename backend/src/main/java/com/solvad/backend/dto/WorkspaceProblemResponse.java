package com.solvad.backend.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class WorkspaceProblemResponse {
    private UUID id;
    private String title;
    private String backgroundContext;
    private String primaryStatement;
    private String objectives;
    private String constraints;
    private String preferredProgram;
    private String sdgFocus;
    private String status;
    private UUID seekerId;
    private String organizationName;
    private LocalDateTime createdAt;
    
    // Uses the new specific Subtask DTO
    private List<SubtaskWithAttachmentsResponse> subtasks; 
    
    private List<String> tags;
    private String problemDocumentUrl;
    private Integer maxConcurrentSolvers;

    public WorkspaceProblemResponse() {}

    public WorkspaceProblemResponse(UUID id, String title, String backgroundContext, String primaryStatement, 
                                    String objectives, String constraints, String preferredProgram, String sdgFocus, 
                                    String status, UUID seekerId, String organizationName, LocalDateTime createdAt, 
                                    List<SubtaskWithAttachmentsResponse> subtasks, List<String> tags, 
                                    String problemDocumentUrl, Integer maxConcurrentSolvers) {
        this.id = id;
        this.title = title;
        this.backgroundContext = backgroundContext;
        this.primaryStatement = primaryStatement;
        this.objectives = objectives;
        this.constraints = constraints;
        this.preferredProgram = preferredProgram;
        this.sdgFocus = sdgFocus;
        this.status = status;
        this.seekerId = seekerId;
        this.organizationName = organizationName;
        this.createdAt = createdAt;
        this.subtasks = subtasks;
        this.tags = tags;
        this.problemDocumentUrl = problemDocumentUrl;
        this.maxConcurrentSolvers = maxConcurrentSolvers;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getBackgroundContext() { return backgroundContext; }
    public void setBackgroundContext(String backgroundContext) { this.backgroundContext = backgroundContext; }
    public String getPrimaryStatement() { return primaryStatement; }
    public void setPrimaryStatement(String primaryStatement) { this.primaryStatement = primaryStatement; }
    public String getObjectives() { return objectives; }
    public void setObjectives(String objectives) { this.objectives = objectives; }
    public String getConstraints() { return constraints; }
    public void setConstraints(String constraints) { this.constraints = constraints; }
    public String getPreferredProgram() { return preferredProgram; }
    public void setPreferredProgram(String preferredProgram) { this.preferredProgram = preferredProgram; }
    public String getSdgFocus() { return sdgFocus; }
    public void setSdgFocus(String sdgFocus) { this.sdgFocus = sdgFocus; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public UUID getSeekerId() { return seekerId; }
    public void setSeekerId(UUID seekerId) { this.seekerId = seekerId; }
    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<SubtaskWithAttachmentsResponse> getSubtasks() { return subtasks; }
    public void setSubtasks(List<SubtaskWithAttachmentsResponse> subtasks) { this.subtasks = subtasks; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    public String getProblemDocumentUrl() { return problemDocumentUrl; }
    public void setProblemDocumentUrl(String problemDocumentUrl) { this.problemDocumentUrl = problemDocumentUrl; }
    public Integer getMaxConcurrentSolvers() { return maxConcurrentSolvers; }
    public void setMaxConcurrentSolvers(Integer maxConcurrentSolvers) { this.maxConcurrentSolvers = maxConcurrentSolvers; }
}