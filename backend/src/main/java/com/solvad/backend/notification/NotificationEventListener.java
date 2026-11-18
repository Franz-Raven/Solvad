package com.solvad.backend.notification;

import com.solvad.backend.email.NotificationEmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class NotificationEventListener {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventListener.class);

    private final NotificationService notificationService;
    private final NotificationEmailService notificationEmailService;

    public NotificationEventListener(NotificationService notificationService,
                                     NotificationEmailService notificationEmailService) {
        this.notificationService = notificationService;
        this.notificationEmailService = notificationEmailService;
    }

    // Seeker gets an in-app notification only, no email
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onProposalSubmitted(ProposalSubmittedEvent e) {
        try {
            notificationService.createAndPush(
                    e.seekerId(),
                    NotificationType.PROPOSAL_SUBMITTED,
                    e.solverName() + " submitted a proposal on '" + e.problemTitle() + "'",
                    e.problemId(),
                    e.claimRequestId());
        } catch (Exception ex) {
            log.error("Failed to create PROPOSAL_SUBMITTED notification for request {}",
                    e.claimRequestId(), ex);
        }
    }

    // Solver gets in-app + email, only for APPROVED / REJECTED / CANCELLED
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onProposalStatusChanged(ProposalStatusChangedEvent e) {
        boolean approved = "APPROVED".equalsIgnoreCase(e.newStatus());
        boolean rejected = "REJECTED".equalsIgnoreCase(e.newStatus());
        boolean cancelled = "CANCELLED".equalsIgnoreCase(e.newStatus());
        if (!approved && !rejected && !cancelled) {
            return;
        }
        NotificationType type = approved
                ? NotificationType.PROPOSAL_APPROVED
                : rejected ? NotificationType.PROPOSAL_REJECTED : NotificationType.PROPOSAL_CANCELLED;
        String message = cancelled
                ? "Your proposal on '" + e.problemTitle()
                        + "' was cancelled because the sub-problem reached its solver capacity."
                : "Your proposal on '" + e.problemTitle() + "' has been "
                        + (approved ? "approved" : "rejected");

        try {
            notificationService.createAndPush(
                    e.solverId(),
                    type,
                    message,
                    e.problemId(),
                    e.claimRequestId());
        } catch (Exception ex) {
            log.error("Failed to create in-app notification for request {}", e.claimRequestId(), ex);
        }

        if (cancelled) {
            return;
        }

        try {
            notificationEmailService.sendProposalDecisionEmail(
                    e.solverEmail(), e.solverName(), e.problemTitle(), approved, e.problemId());
        } catch (Exception ex) {
            log.error("Failed to send decision email for request {}", e.claimRequestId(), ex);
        }
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onSolutionAttemptTerminated(SolutionAttemptTerminatedEvent e) {
        try {
            notificationService.createAndPush(
                    e.solverUserId(),
                    NotificationType.SOLUTION_ATTEMPT_TERMINATED,
                    "Your active solution work on '" + e.problemTitle()
                            + "' was terminated because the seeker marked the problem as "
                            + e.problemStatus().toLowerCase() + ".",
                    e.problemId(),
                    null);
        } catch (Exception ex) {
            log.error("Failed to create solution-attempt termination notification for problem {}",
                    e.problemId(), ex);
        }
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onSolutionSubmittedForReview(SolutionSubmittedForReviewEvent e) {
        try {
            notificationService.createAndPush(
                    e.seekerUserId(),
                    NotificationType.SOLUTION_SUBMITTED_FOR_REVIEW,
                    e.solverName() + " submitted a solution for \"" + e.subtaskTitle()
                            + "\" on '" + e.problemTitle() + "' for your review.",
                    e.problemId(),
                    null);
        } catch (Exception ex) {
            log.error("Failed to create solution-submitted-for-review notification for attempt {}",
                    e.attemptId(), ex);
        }

        try {
            notificationEmailService.sendSolutionSubmittedForReviewEmail(
                    e.seekerEmail(), e.seekerName(), e.solverName(), e.problemTitle(),
                    e.subtaskTitle(), e.problemId());
        } catch (Exception ex) {
            log.error("Failed to send solution-submitted-for-review email for attempt {}",
                    e.attemptId(), ex);
        }
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onSolutionReviewed(SolutionReviewedEvent e) {
        NotificationType type = e.approved()
                ? NotificationType.SOLUTION_APPROVED
                : NotificationType.SOLUTION_REJECTED;
        String decision = e.approved() ? "approved" : "rejected";

        try {
            notificationService.createAndPush(
                    e.solverUserId(),
                    type,
                    "Your final solution for '" + e.problemTitle() + "' was " + decision + ".",
                    e.problemId(),
                    null);
        } catch (Exception ex) {
            log.error("Failed to create solution-review notification for attempt {}", e.attemptId(), ex);
        }

        try {
            notificationEmailService.sendSolutionDecisionEmail(
                    e.solverEmail(), e.solverName(), e.problemTitle(), e.approved(),
                    e.rejectionReason(), e.problemId());
        } catch (Exception ex) {
            log.error("Failed to send solution-review email for attempt {}", e.attemptId(), ex);
        }
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onSolutionAttemptAbandoned(SolutionAttemptAbandonedEvent e) {
        try {
            notificationService.createAndPush(
                    e.seekerUserId(),
                    NotificationType.SOLUTION_ATTEMPT_ABANDONED,
                    e.solverName() + " abandoned their attempt on \"" + e.subtaskTitle()
                            + "\" for '" + e.problemTitle() + "'.",
                    e.problemId(),
                    null);
        } catch (Exception ex) {
            log.error("Failed to create attempt-abandoned notification for attempt {}", e.attemptId(), ex);
        }

        try {
            notificationEmailService.sendAttemptAbandonedEmail(
                    e.seekerEmail(), e.seekerName(), e.solverName(), e.problemTitle(),
                    e.subtaskTitle(), e.problemId());
        } catch (Exception ex) {
            log.error("Failed to send attempt-abandoned email for attempt {}", e.attemptId(), ex);
        }
    }
}
