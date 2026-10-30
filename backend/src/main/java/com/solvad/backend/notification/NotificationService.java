package com.solvad.backend.notification;

import com.solvad.backend.notification.NotificationResponse;
import com.solvad.backend.notification.UnreadCountResponse;
import com.solvad.backend.notification.Notification;
import com.solvad.backend.notification.NotificationType;
import com.solvad.backend.notification.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private static final String USER_QUEUE = "/queue/notifications";

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(NotificationRepository notificationRepository,
                               SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public NotificationResponse createAndPush(UUID recipientId, NotificationType type,
                                              String message, UUID problemId, UUID claimRequestId) {
        Notification n = new Notification();
        n.setUserId(recipientId);
        n.setType(type);
        n.setMessage(message);
        n.setProblemId(problemId);
        n.setClaimRequestId(claimRequestId);
        n.setRead(false);

        NotificationResponse dto = NotificationResponse.from(notificationRepository.save(n));
        pushAfterCommit(recipientId, dto);
        return dto;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(UUID userId, int page, int size) {
        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, Math.min(size, 50)))
                .stream().map(NotificationResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(UUID userId) {
        return new UnreadCountResponse(notificationRepository.countByUserIdAndReadFalse(userId));
    }

    @Transactional
    public NotificationResponse markAsRead(UUID notificationId, UUID userId) {
        Notification n = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        n.setRead(true);
        return NotificationResponse.from(notificationRepository.save(n));
    }

    @Transactional
    public int markAllAsRead(UUID userId) {
        return notificationRepository.markAllAsRead(userId);
    }

    private void pushAfterCommit(UUID recipientId, NotificationResponse dto) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    push(recipientId, dto);
                }
            });
        } else {
            push(recipientId, dto);
        }
    }

    private void push(UUID recipientId, NotificationResponse dto) {
        try {
            messagingTemplate.convertAndSendToUser(String.valueOf(recipientId), USER_QUEUE, dto);
        } catch (Exception e) {
            // Non-fatal: the notification is already persisted and shows up via REST on next load.
            log.error("Failed to push notification {} to user {}", dto.id(), recipientId, e);
        }
    }
}
