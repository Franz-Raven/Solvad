package com.solvad.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class ActivityLedgerResponse {

    private UUID id;
    private UUID problemId;
    private UUID actorId;
    private String actorName;
    private String actorRole;
    private String actionType;
    private String description;
    private String metadata;
    private LocalDateTime timestamp;

    public ActivityLedgerResponse() {
    }

    public ActivityLedgerResponse(UUID id, UUID problemId, UUID actorId, String actorName,
                                  String actorRole, String actionType, String description,
                                  String metadata, LocalDateTime timestamp) {
        this.id = id;
        this.problemId = problemId;
        this.actorId = actorId;
        this.actorName = actorName;
        this.actorRole = actorRole;
        this.actionType = actionType;
        this.description = description;
        this.metadata = metadata;
        this.timestamp = timestamp;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getProblemId() { return problemId; }
    public void setProblemId(UUID problemId) { this.problemId = problemId; }

    public UUID getActorId() { return actorId; }
    public void setActorId(UUID actorId) { this.actorId = actorId; }

    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }

    public String getActorRole() { return actorRole; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }

    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}