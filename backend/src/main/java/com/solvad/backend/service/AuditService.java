package com.solvad.backend.service;

import com.solvad.backend.dto.AuditLogResponse;
import com.solvad.backend.entity.AuditEventType;
import com.solvad.backend.entity.AuditLog;
import com.solvad.backend.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuditService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    /**
     * Write one immutable audit entry. Call this inside any @Transactional
     * mutation — it will commit with the same transaction.
     */
    public void log(UUID problemId, UUID actorId, String actorName,
                    String actorRole, AuditEventType eventType, String delta) {
        AuditLog entry = new AuditLog(problemId, actorId, actorName,
                actorRole, eventType, delta);
        auditLogRepository.save(entry);
    }

    /**
     * Read the full chronological ledger for one problem.
     */
    public List<AuditLogResponse> getLogsForProblem(UUID problemId) {
        return auditLogRepository
                .findByProblemIdOrderByTimestampAsc(problemId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private AuditLogResponse mapToResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getProblemId(),
                log.getActorId(),
                log.getActorName(),
                log.getActorRole(),
                log.getEventType(),
                log.getDelta(),
                log.getTimestamp()
        );
    }
}