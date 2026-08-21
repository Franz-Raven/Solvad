package com.solvad.backend.audit;

import java.time.LocalDateTime;
import java.util.UUID;

public class AuditLogResponse {

    private UUID id;
    private UUID problemId;
    private UUID actorId;
    private String actorName;
    private String actorRole;
    private AuditEventType eventType;
    private String delta;
    private LocalDateTime timestamp;

    public AuditLogResponse() {}

    public AuditLogResponse(UUID id, UUID problemId, UUID actorId,
                            String actorName, String actorRole,
                            AuditEventType eventType, String delta,
                            LocalDateTime timestamp) {
        this.id        = id;
        this.problemId = problemId;
        this.actorId   = actorId;
        this.actorName = actorName;
        this.actorRole = actorRole;
        this.eventType = eventType;
        this.delta     = delta;
        this.timestamp = timestamp;
    }

    // ── getters ───────────────────────────────────────────────────────────────

    public UUID getId()              { return id; }
    public UUID getProblemId()       { return problemId; }
    public UUID getActorId()         { return actorId; }
    public String getActorName()     { return actorName; }
    public String getActorRole()     { return actorRole; }
    public AuditEventType getEventType() { return eventType; }
    public String getDelta()         { return delta; }
    public LocalDateTime getTimestamp() { return timestamp; }
}