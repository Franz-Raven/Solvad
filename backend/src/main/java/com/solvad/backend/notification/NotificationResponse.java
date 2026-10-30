package com.solvad.backend.notification;

import com.solvad.backend.notification.Notification;
import com.solvad.backend.notification.NotificationType;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        NotificationType type,
        String message,
        UUID problemId,
        UUID claimRequestId,
        boolean read,
        LocalDateTime createdAt
) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
                n.getId(), n.getType(), n.getMessage(),
                n.getProblemId(), n.getClaimRequestId(),
                n.isRead(), n.getCreatedAt());
    }
}
