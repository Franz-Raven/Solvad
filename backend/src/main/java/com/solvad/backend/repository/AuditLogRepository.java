package com.solvad.backend.repository;

import com.solvad.backend.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    // Oldest-first so the frontend can render a proper chronological timeline
    List<AuditLog> findByProblemIdOrderByTimestampAsc(UUID problemId);
}