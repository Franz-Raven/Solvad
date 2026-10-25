package com.solvad.backend.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String fromEmail;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${spring.mail.username}") String fromEmail) {
        this.mailSender = mailSender;
        this.fromEmail = fromEmail;
    }

    @Async
    public void sendVerificationEmail(String toEmail, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("Solvad <" + fromEmail + ">");
            helper.setTo(toEmail);
            helper.setSubject("Your Solvad verification code");

            String textContent = "Hi there,\n\n"
                    + "Use this one-time verification code to finish creating your Solvad account:\n\n"
                    + code + "\n\n"
                    + "The code is valid for 15 minutes. If you did not request this code, you can ignore this email.\n\n"
                    + "Thanks,\nThe Solvad team";
            String htmlContent = """
                    <!doctype html>
                    <html>
                    <body style="margin:0;padding:32px 16px;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#334155;">
                      <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:32px;">
                        <p style="margin:0 0 24px;color:#059669;font-size:14px;font-weight:700;letter-spacing:1px;">SOLVAD</p>
                        <h1 style="margin:0 0 20px;color:#0f172a;font-size:22px;">Your verification code</h1>
                        <p style="margin:0 0 20px;font-size:15px;">Hi there,</p>
                        <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">Use this one-time code to finish creating your Solvad account:</p>
                        <p style="margin:0 0 20px;padding:16px;background:#f1f5f9;border-radius:8px;text-align:center;color:#0f172a;font-size:30px;font-weight:700;letter-spacing:8px;">%s</p>
                        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;">This code is valid for <strong>15 minutes</strong>. If it expires, request a new code from the registration page.</p>
                        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;">If you didn’t request this code, you can safely ignore this email.</p>
                        <p style="margin:0;font-size:14px;line-height:1.6;">Thanks,<br>The Solvad team</p>
                      </div>
                    </body>
                    </html>
                    """.formatted(code);

            helper.setText(textContent, htmlContent);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Email failure", e);
        }
    }
}