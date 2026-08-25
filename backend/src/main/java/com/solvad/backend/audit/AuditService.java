package com.solvad.backend.audit;

import com.solvad.backend.profile.seeker.SeekerNotificationResponse;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


import java.util.Arrays;
import java.util.List;
import java.util.Map;
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

    public List<SeekerNotificationResponse> getRecentNotificationsForProblems(
            List<UUID> problemIds,
            Map<UUID, String> problemTitles) {

        List<AuditEventType> notifyTypes = Arrays.asList(
                AuditEventType.ATTEMPT_CLAIMED,
                AuditEventType.ATTEMPT_FORKED,
                AuditEventType.STATUS_CHANGED
        );

        return auditLogRepository.findNotificationsForProblems(problemIds, notifyTypes)
                .stream()
                .limit(30)
                .map(log -> new SeekerNotificationResponse(
                        log.getId(),
                        log.getProblemId(),
                        problemTitles.getOrDefault(log.getProblemId(), "Problem"),
                        log.getEventType().name(),
                        log.getDelta(),
                        log.getActorName(),
                        log.getTimestamp()
                ))
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

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getAuditLogsForProblem(UUID problemId) {
        // Using your existing ASC sorting method based on your frontend preference
        List<AuditLog> logs = auditLogRepository.findByProblemIdOrderByTimestampAsc(problemId);

        return logs.stream().map(log -> new AuditLogResponse(
                log.getId(),
                log.getProblemId(),
                log.getActorId(),
                log.getActorName(),
                log.getActorRole(),
                log.getEventType(),
                log.getDelta(),
                log.getTimestamp()
        )).collect(Collectors.toList());
    }
}