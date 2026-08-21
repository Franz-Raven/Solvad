package com.solvad.backend.repository;

import com.solvad.backend.entity.AuditEventType;
import com.solvad.backend.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    // Oldest-first so the frontend can render aaa proper chronological timeline
    List<AuditLog> findByProblemIdOrderByTimestampAsc(UUID problemId);

    @Query("""
            SELECT a FROM AuditLog a
            WHERE a.problemId IN :problemIds
              AND a.eventType IN :eventTypes
            ORDER BY a.timestamp DESC
            """)
    List<AuditLog> findNotificationsForProblems(
            @Param("problemIds") List<UUID> problemIds,
            @Param("eventTypes") List<AuditEventType> eventTypes);
}