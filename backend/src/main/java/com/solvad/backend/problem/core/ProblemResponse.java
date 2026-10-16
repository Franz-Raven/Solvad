package com.solvad.backend.problem.core;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.solvad.backend.problem.subtask.SubtaskResponse;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class ProblemResponse {
    private UUID id;
    private String title;
    private String backgroundContext;
    private String primaryStatement;
    private String objectives;
    private String constraints;
    private String preferredProgram;
    private String sdgFocus;
    private String problemDocumentUrl;
    private String status;
    private UUID seekerId;
    @JsonProperty("organizationName")
    private String seekerOrganization;
    private LocalDateTime createdAt;
    private List<SubtaskResponse> subtasks;
    private List<String> tags = new ArrayList<>();
    private Double matchScore;
    private Boolean courseMatch;
    private int maxConcurrentSolvers = 3;

    // 🚀 NEW FIELDS FOR HEADER UI
    private String seekerProfileUrl;
    private String contactPerson;
    private String contactNumber;
    private String seekerEmail;

    public ProblemResponse() {
    }

    public ProblemResponse(UUID id, String title, String backgroundContext, String primaryStatement,
                           String objectives, String constraints, String preferredProgram, String sdgFocus, String status,
                           UUID seekerId, String seekerOrganization, LocalDateTime createdAt,
                           List<SubtaskResponse> subtasks, List<String> tags, String problemDocumentUrl,
                           int maxConcurrentSolvers,
                           String seekerProfileUrl, String contactPerson, String contactNumber, String seekerEmail) { // 🚀 Added to constructor
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
        this.seekerOrganization = seekerOrganization;
        this.createdAt = createdAt;
        this.subtasks = subtasks;
        this.tags = tags != null ? tags : new ArrayList<>();
        this.problemDocumentUrl = problemDocumentUrl;
        this.maxConcurrentSolvers = maxConcurrentSolvers;
        this.seekerProfileUrl = seekerProfileUrl;
        this.contactPerson = contactPerson;
        this.contactNumber = contactNumber;
        this.seekerEmail = seekerEmail;
    }

    // 🚀 NEW: Fallback constructor to fix MatchmakingService and SolutionAttemptService errors
    public ProblemResponse(UUID id, String title, String backgroundContext, String primaryStatement,
                           String objectives, String constraints, String preferredProgram, String sdgFocus, String status,
                           UUID seekerId, String seekerOrganization, LocalDateTime createdAt,
                           List<SubtaskResponse> subtasks, List<String> tags, String problemDocumentUrl,
                           int maxConcurrentSolvers) {
        this(id, title, backgroundContext, primaryStatement, objectives, constraints, preferredProgram, sdgFocus,
                status, seekerId, seekerOrganization, createdAt, subtasks, tags, problemDocumentUrl, maxConcurrentSolvers,
                null, null, null, null);
    }

    public int getMaxConcurrentSolvers() { return maxConcurrentSolvers; }
    public void setMaxConcurrentSolvers(int maxConcurrentSolvers) { this.maxConcurrentSolvers = maxConcurrentSolvers; }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
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

    public String getSdgFocus() {
        return sdgFocus;
    }

    public void setSdgFocus(String sdgFocus) {
        this.sdgFocus = sdgFocus;
    }

    public String getProblemDocumentUrl() {
        return problemDocumentUrl;
    }

    public void setProblemDocumentUrl(String problemDocumentUrl) {
        this.problemDocumentUrl = problemDocumentUrl;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public UUID getSeekerId() {
        return seekerId;
    }

    public void setSeekerId(UUID seekerId) {
        this.seekerId = seekerId;
    }

    public String getSeekerOrganization() {
        return seekerOrganization;
    }

    public void setSeekerOrganization(String seekerOrganization) {
        this.seekerOrganization = seekerOrganization;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<SubtaskResponse> getSubtasks() {
        return subtasks;
    }

    public void setSubtasks(List<SubtaskResponse> subtasks) {
        this.subtasks = subtasks;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public Double getMatchScore() {
        return matchScore;
    }

    public void setMatchScore(Double matchScore) {
        this.matchScore = matchScore;
    }

    public Boolean getCourseMatch() {
        return courseMatch;
    }

    public void setCourseMatch(Boolean courseMatch) {
        this.courseMatch = courseMatch;
    }

    // 🚀 NEW GETTERS AND SETTERS
    public String getSeekerProfileUrl() { return seekerProfileUrl; }
    public void setSeekerProfileUrl(String seekerProfileUrl) { this.seekerProfileUrl = seekerProfileUrl; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public String getSeekerEmail() { return seekerEmail; }
    public void setSeekerEmail(String seekerEmail) { this.seekerEmail = seekerEmail; }
}