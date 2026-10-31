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

    // Solver gets in-app + email, only for APPROVED / REJECTED
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onProposalStatusChanged(ProposalStatusChangedEvent e) {
        boolean approved = "APPROVED".equalsIgnoreCase(e.newStatus());
        boolean rejected = "REJECTED".equalsIgnoreCase(e.newStatus());
        if (!approved && !rejected) {
            return;
        }
        String outcome = approved ? "approved" : "rejected";

        try {
            notificationService.createAndPush(
                    e.solverId(),
                    approved ? NotificationType.PROPOSAL_APPROVED : NotificationType.PROPOSAL_REJECTED,
                    "Your proposal on '" + e.problemTitle() + "' has been " + outcome,
                    e.problemId(),
                    e.claimRequestId());
        } catch (Exception ex) {
            log.error("Failed to create in-app notification for request {}", e.claimRequestId(), ex);
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
}
