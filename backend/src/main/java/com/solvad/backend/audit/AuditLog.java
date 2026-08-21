package com.solvad.backend.audit;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_problem_id", columnList = "problem_id"),
        @Index(name = "idx_audit_timestamp",  columnList = "timestamp")
})
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "problem_id", nullable = false)
    private UUID problemId;

    // Who did this — human-readable, denormalized intentionally
    // so the log stays readable even if the user is deleted
    @Column(name = "actor_id")
    private UUID actorId;

    @Column(name = "actor_name", nullable = false)
    private String actorName;

    @Column(name = "actor_role", nullable = false)   // "SEEKER" | "SOLVER" | "SYSTEM"
    private String actorRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private AuditEventType eventType;

    // Human-readable description of what changed,
    // e.g. "Status changed from OPEN → CLAIMED"
    @Column(name = "delta", columnDefinition = "TEXT")
    private String delta;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    // ── constructors ──────────────────────────────────────────────────────────

    protected AuditLog() {}

    public AuditLog(UUID problemId, UUID actorId, String actorName,
                    String actorRole, AuditEventType eventType, String delta) {
        this.problemId = problemId;
        this.actorId   = actorId;
        this.actorName = actorName;
        this.actorRole = actorRole;
        this.eventType = eventType;
        this.delta     = delta;
        this.timestamp = LocalDateTime.now();
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