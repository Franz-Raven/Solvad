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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AuditService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    public void log(UUID problemId, UUID actorId, String actorName,
                    String actorRole, AuditEventType eventType, String delta) {
        AuditLog entry = new AuditLog(problemId, actorId, actorName,
                actorRole, eventType, delta);
        auditLogRepository.save(entry);
    }

    // 🚀 DYNAMIC FORMATTER: Cleans up raw enums like "CLAIMED -> IN_PROGRESS" on the fly
    private String formatDeltaText(String text) {
        if (text == null) return null;

        // Matches any two uppercase words (with underscores) separated by -> or →
        Pattern pattern = Pattern.compile("([A-Z_]{2,})\\s*(?:->|→)\\s*([A-Z_]{2,})");
        Matcher matcher = pattern.matcher(text);
        StringBuilder sb = new StringBuilder();

        while (matcher.find()) {
            String p1 = formatEnumWord(matcher.group(1));
            String p2 = formatEnumWord(matcher.group(2));
            matcher.appendReplacement(sb, Matcher.quoteReplacement(p1 + " → " + p2));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    // Helper to turn "IN_PROGRESS" into "In Progress"
    private String formatEnumWord(String word) {
        return Arrays.stream(word.split("_"))
                .filter(part -> !part.isEmpty())
                .map(part -> Character.toUpperCase(part.charAt(0)) + part.substring(1).toLowerCase())
                .collect(Collectors.joining(" "));
    }

    // 🚀 Refactored to use the new formatter
    private AuditLogResponse mapToResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getProblemId(),
                log.getActorId(),
                log.getActorName(),
                log.getActorRole(),
                log.getEventType(),
                formatDeltaText(log.getDelta()), // Applies formatting instantly
                log.getTimestamp()
        );
    }

    public List<SeekerNotificationResponse> getRecentNotificationsForProblems(
            List<UUID> problemIds,
            Map<UUID, String> problemTitles) {

        List<AuditEventType> notifyTypes = Arrays.asList(
                AuditEventType.ATTEMPT_CLAIMED,
                AuditEventType.ATTEMPT_FORKED,
                AuditEventType.STATUS_CHANGED,
                AuditEventType.PROPOSAL_SUBMITTED,
                AuditEventType.PROPOSAL_APPROVED,
                AuditEventType.PROPOSAL_REJECTED,
                AuditEventType.CAPACITY_REACHED
        );

        return auditLogRepository.findNotificationsForProblems(problemIds, notifyTypes)
                .stream()
                .limit(30)
                .map(log -> new SeekerNotificationResponse(
                        log.getId(),
                        log.getProblemId(),
                        problemTitles.getOrDefault(log.getProblemId(), "Problem"),
                        log.getEventType().name(),
                        formatDeltaText(log.getDelta()), // 🚀 Formatting applies to notifications too!
                        log.getActorName(),
                        log.getTimestamp()
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getAuditLogsForProblem(UUID problemId) {
        List<AuditLog> logs = auditLogRepository.findByProblemIdOrderByTimestampAsc(problemId);
        // 🚀 Cleaned up to reuse the mapToResponse method
        return logs.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<AuditDateSummaryResponse> getAuditSummaries(UUID problemId) {
        List<AuditLog> logs = auditLogRepository.findByProblemIdOrderByTimestampDesc(problemId);

        Map<LocalDate, Long> countsByDate = logs.stream()
                .collect(Collectors.groupingBy(
                        log -> log.getTimestamp().toLocalDate(),
                        Collectors.counting()
                ));

        DateTimeFormatter displayFormatter = DateTimeFormatter.ofPattern("MMMM d, yyyy");

        return countsByDate.entrySet().stream()
                .map(entry -> new AuditDateSummaryResponse(
                        entry.getKey().toString(),
                        entry.getKey().format(displayFormatter).toUpperCase(),
                        entry.getValue()
                ))
                .sorted(Comparator.comparing(AuditDateSummaryResponse::date).reversed())
                .collect(Collectors.toList());
    }

    public List<AuditLogResponse> getAuditLogsByDate(UUID problemId, LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

        return auditLogRepository.findByProblemIdAndTimestampBetweenOrderByTimestampDesc(
                        problemId, startOfDay, endOfDay).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
}