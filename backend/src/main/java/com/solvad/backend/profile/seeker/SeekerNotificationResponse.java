package com.solvad.backend.profile.seeker;

import java.time.LocalDateTime;
import java.util.UUID;

public class SeekerNotificationResponse {

    private UUID id;
    private UUID problemId;
    private String problemTitle;
    private String eventType;
    private String message;
    private String actorName;
    private LocalDateTime timestamp;

    public SeekerNotificationResponse() {
    }

    public SeekerNotificationResponse(UUID id, UUID problemId, String problemTitle,
                                      String eventType, String message, String actorName,
                                      LocalDateTime timestamp) {
        this.id = id;
        this.problemId = problemId;
        this.problemTitle = problemTitle;
        this.eventType = eventType;
        this.message = message;
        this.actorName = actorName;
        this.timestamp = timestamp;
    }

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

    public String getProblemTitle() {
        return problemTitle;
    }

    public void setProblemTitle(String problemTitle) {
        this.problemTitle = problemTitle;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getActorName() {
        return actorName;
    }

    public void setActorName(String actorName) {
        this.actorName = actorName;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
