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
        String html = """
                <div style="font-family:Arial,sans-serif;line-height:1.5">
                  <p>Hi %s,</p>
                  <p>Your proposal on <strong>%s</strong> has been <strong>%s</strong>.</p>
                  <p><a href="%s">View the problem</a></p>
                  <p>- The Solvad Team</p>
                </div>
                """.formatted(
                HtmlUtils.htmlEscape(solverName),
                HtmlUtils.htmlEscape(problemTitle),
                outcome,
                link);

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
