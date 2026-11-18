package com.solvad.backend.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

// Notification emails via Gmail SMTP
@Service
public class NotificationEmailService {

    private static final Logger log = LoggerFactory.getLogger(NotificationEmailService.class);

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String frontendUrl;

    public NotificationEmailService(JavaMailSender mailSender,
                                    @Value("${spring.mail.username}") String fromAddress,
                                    @Value("${app.frontend-url:http://localhost:3000}") String frontendUrl) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.frontendUrl = frontendUrl;
    }

    // true if the message was handed to the SMTP server
    public boolean sendProposalDecisionEmail(String toEmail, String solverName, String problemTitle,
                                             boolean approved, UUID problemId) {
        String outcome = approved ? "approved" : "rejected";
        String link = frontendUrl + "/solver/problem/" + problemId;

        String subject = "Your proposal on \"" + problemTitle + "\" has been " + outcome;
        String statusLabel = approved ? "APPROVED" : "NOT APPROVED";
        String statusColor = approved ? "#047857" : "#b42318";
        String statusBackground = approved ? "#ecfdf5" : "#fef3f2";
        String headline = approved ? "Your proposal was approved" : "Your proposal was not approved";
        String html = """
                <!doctype html>
                <html>
                <body style="margin:0;padding:32px 16px;background-color:#f3f6f9;font-family:Arial,Helvetica,sans-serif;color:#334155;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="width:100%%;background-color:#f3f6f9;">
                    <tr>
                      <td align="center" style="padding:0;">
                        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:100%%;max-width:600px;">
                          <tr>
                            <td style="padding:0 0 16px;color:#047857;font-size:15px;font-weight:700;letter-spacing:2px;">SOLVAD</td>
                          </tr>
                          <tr>
                            <td style="padding:32px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">
                              <p style="display:inline-block;margin:0 0 18px;padding:6px 12px;background-color:%s;color:%s;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.6px;">%s</p>
                              <h1 style="margin:0 0 18px;color:#0f172a;font-size:24px;line-height:1.3;">%s</h1>
                              <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hi %s,</p>
                              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;">Your proposal on <strong>%s</strong> has been <strong>%s</strong>.</p>
                              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                                <tr>
                                  <td bgcolor="#047857" style="border-radius:8px;">
                                    <a href="%s" style="display:inline-block;padding:13px 22px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">View the problem</a>
                                  </td>
                                </tr>
                              </table>
                              <p style="margin:0;font-size:14px;line-height:1.7;">Thanks,<br>The Solvad team</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:20px 8px;color:#64748b;font-size:12px;line-height:1.6;text-align:center;">
                              This is an automated notification from Solvad.
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(
                statusBackground,
                statusColor,
                statusLabel,
                headline,
                HtmlUtils.htmlEscape(solverName),
                HtmlUtils.htmlEscape(problemTitle),
                outcome,
                HtmlUtils.htmlEscape(link));

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper =
                    new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            helper.setFrom(fromAddress, "Solvad");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            return true;
        } catch (MailException | MessagingException | UnsupportedEncodingException e) {
            log.error("Notification email to {} failed for problem {}", toEmail, problemId, e);
            return false;
        }
    }

    public boolean sendSolutionDecisionEmail(String toEmail, String solverName, String problemTitle,
                                             boolean approved, String rejectionReason, UUID problemId) {
        String decision = approved ? "approved" : "rejected";
        String headline = approved ? "Your solution was approved" : "Your solution needs more work";
        String feedback = rejectionReason == null || rejectionReason.isBlank()
                ? ""
                : "<p style=\"margin:0 0 24px;padding:16px;background:#f8fafc;border-radius:8px;"
                        + "font-size:14px;line-height:1.6;\"><strong>Feedback:</strong> "
                        + HtmlUtils.htmlEscape(rejectionReason) + "</p>";
        String link = frontendUrl + "/solver/problem/" + problemId;
        String html = """
                <!doctype html>
                <html>
                <body style="margin:0;padding:32px 16px;background:#f3f6f9;font-family:Arial,Helvetica,sans-serif;color:#334155;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%%">
                    <tr><td align="center">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:100%%;max-width:600px;">
                        <tr><td style="padding:0 0 16px;color:#047857;font-size:15px;font-weight:700;letter-spacing:2px;">SOLVAD</td></tr>
                        <tr><td style="padding:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">
                          <h1 style="margin:0 0 18px;color:#0f172a;font-size:24px;line-height:1.3;">%s</h1>
                          <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hi %s,</p>
                          <p style="margin:0 0 20px;font-size:15px;line-height:1.7;">Your final solution for <strong>%s</strong> has been <strong>%s</strong>.</p>
                          %s
                          <p style="margin:0 0 24px;"><a href="%s" style="display:inline-block;padding:13px 22px;background:#047857;border-radius:8px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">View problem details</a></p>
                          <p style="margin:0;font-size:14px;line-height:1.7;">Thanks,<br>The Solvad team</p>
                        </td></tr>
                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(
                headline,
                HtmlUtils.htmlEscape(solverName),
                HtmlUtils.htmlEscape(problemTitle),
                decision,
                feedback,
                HtmlUtils.htmlEscape(link));

        return sendHtmlNotificationEmail(toEmail,
                "Your final solution has been " + decision + ": " + problemTitle,
                html, problemId);
    }

    public boolean sendAttemptAbandonedEmail(String toEmail, String seekerName, String solverName,
                                              String problemTitle, String subtaskTitle, UUID problemId) {
        String link = frontendUrl + "/seeker/problem/" + problemId;
        String html = """
                <!doctype html>
                <html>
                <body style="margin:0;padding:32px 16px;background:#f3f6f9;font-family:Arial,Helvetica,sans-serif;color:#334155;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%%">
                    <tr><td align="center">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:100%%;max-width:600px;">
                        <tr><td style="padding:0 0 16px;color:#047857;font-size:15px;font-weight:700;letter-spacing:2px;">SOLVAD</td></tr>
                        <tr><td style="padding:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">
                          <h1 style="margin:0 0 18px;color:#0f172a;font-size:24px;line-height:1.3;">A solver left their attempt</h1>
                          <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hi %s,</p>
                          <p style="margin:0 0 24px;font-size:15px;line-height:1.7;"><strong>%s</strong> abandoned their attempt on <strong>%s</strong> for <strong>%s</strong>.</p>
                          <p style="margin:0 0 24px;"><a href="%s" style="display:inline-block;padding:13px 22px;background:#047857;border-radius:8px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">View problem details</a></p>
                          <p style="margin:0;font-size:14px;line-height:1.7;">Thanks,<br>The Solvad team</p>
                        </td></tr>
                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(
                HtmlUtils.htmlEscape(seekerName),
                HtmlUtils.htmlEscape(solverName),
                HtmlUtils.htmlEscape(subtaskTitle),
                HtmlUtils.htmlEscape(problemTitle),
                HtmlUtils.htmlEscape(link));

        return sendHtmlNotificationEmail(toEmail,
                "A solver abandoned an attempt on " + problemTitle,
                html, problemId);
    }

    public boolean sendSolutionSubmittedForReviewEmail(String toEmail, String seekerName,
                                                        String solverName, String problemTitle,
                                                        String subtaskTitle, UUID problemId) {
        String link = frontendUrl + "/seeker/problem/" + problemId + "?tab=review";
        String html = """
                <!doctype html>
                <html>
                <body style="margin:0;padding:32px 16px;background:#f3f6f9;font-family:Arial,Helvetica,sans-serif;color:#334155;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%%">
                    <tr><td align="center">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:100%%;max-width:600px;">
                        <tr><td style="padding:0 0 16px;color:#047857;font-size:15px;font-weight:700;letter-spacing:2px;">SOLVAD</td></tr>
                        <tr><td style="padding:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">
                          <h1 style="margin:0 0 18px;color:#0f172a;font-size:24px;line-height:1.3;">A solution is ready for review</h1>
                          <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hi %s,</p>
                          <p style="margin:0 0 24px;font-size:15px;line-height:1.7;"><strong>%s</strong> submitted a solution for <strong>%s</strong> on <strong>%s</strong>.</p>
                          <p style="margin:0 0 24px;"><a href="%s" style="display:inline-block;padding:13px 22px;background:#047857;border-radius:8px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Review solution</a></p>
                          <p style="margin:0;font-size:14px;line-height:1.7;">Thanks,<br>The Solvad team</p>
                        </td></tr>
                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(
                HtmlUtils.htmlEscape(seekerName),
                HtmlUtils.htmlEscape(solverName),
                HtmlUtils.htmlEscape(subtaskTitle),
                HtmlUtils.htmlEscape(problemTitle),
                HtmlUtils.htmlEscape(link));

        return sendHtmlNotificationEmail(toEmail,
                "Solution submitted for review: " + problemTitle,
                html, problemId);
    }

    private boolean sendHtmlNotificationEmail(String toEmail, String subject, String html, UUID problemId) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper =
                    new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            helper.setFrom(fromAddress, "Solvad");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            return true;
        } catch (MailException | MessagingException | UnsupportedEncodingException e) {
            log.error("Notification email to {} failed for problem {}", toEmail, problemId, e);
            return false;
        }
    }
}
