package com.solvad.backend.admin;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.Message;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.UserCredentials;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.Properties;

/**
 * Sends sign-in credentials to industry partner accounts created by an admin.
 * Uses the same Gmail API sender and visual style as the verification-code email.
 */
@Service
public class AdminAccountEmailService {

    private static final Logger log = LoggerFactory.getLogger(AdminAccountEmailService.class);

    private final String clientId;
    private final String clientSecret;
    private final String refreshToken;
    private final String fromEmail;
    private final String frontendUrl;

    public AdminAccountEmailService(
            @Value("${google.client.id}") String clientId,
            @Value("${google.client.secret}") String clientSecret,
            @Value("${google.refresh.token}") String refreshToken,
            @Value("${google.from.email}") String fromEmail,
            @Value("${app.frontend-url:http://localhost:3000}") String frontendUrl) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.refreshToken = refreshToken;
        this.fromEmail = fromEmail;
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    /**
     * Fire-and-forget: the account is already created, so a mail failure is logged
     * rather than surfaced to the admin as a failed registration.
     */
    @Async
    public void sendIndustryAccountCredentials(String toEmail, String password,
                                               String organizationName, String contactPerson) {
        try {
            String loginUrl = frontendUrl + "/login";
            String greetingName = isBlank(contactPerson) ? "there" : contactPerson.trim();
            String orgName = isBlank(organizationName) ? "your organization" : organizationName.trim();

            String textContent = "Hi " + greetingName + ",\n\n"
                    + "A Solvad administrator has created an industry partner account for " + orgName + ".\n"
                    + "Use these details to sign in:\n\n"
                    + "Email: " + toEmail + "\n"
                    + "Password: " + password + "\n\n"
                    + "Sign in here: " + loginUrl + "\n\n"
                    + "For your security, change this password after your first sign-in from Profile > Account Settings, then delete this email. "
                    + "If you weren't expecting this account, please contact the Solvad team.\n\n"
                    + "Thanks,\nThe Solvad team";

            String htmlContent = """
                    <!doctype html>
                    <html>
                    <body style="margin:0;padding:32px 16px;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#334155;">
                      <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:32px;">
                        <p style="margin:0 0 24px;color:#059669;font-size:14px;font-weight:700;letter-spacing:1px;">SOLVAD</p>
                        <h1 style="margin:0 0 20px;color:#0f172a;font-size:22px;">Your Solvad account is ready</h1>
                        <p style="margin:0 0 20px;font-size:15px;">Hi %s,</p>
                        <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">A Solvad administrator has created an industry partner account for <strong>%s</strong>. Use these details to sign in:</p>
                        <div style="margin:0 0 20px;padding:16px 20px;background:#f1f5f9;border-radius:8px;">
                          <p style="margin:0 0 4px;color:#64748b;font-size:12px;font-weight:700;letter-spacing:1px;">EMAIL</p>
                          <p style="margin:0 0 16px;color:#0f172a;font-size:16px;font-weight:700;word-break:break-all;">%s</p>
                          <p style="margin:0 0 4px;color:#64748b;font-size:12px;font-weight:700;letter-spacing:1px;">PASSWORD</p>
                          <p style="margin:0;color:#0f172a;font-size:18px;font-weight:700;letter-spacing:2px;font-family:'Courier New',Courier,monospace;word-break:break-all;">%s</p>
                        </div>
                        <p style="margin:0 0 24px;text-align:center;">
                          <a href="%s" style="display:inline-block;padding:12px 28px;background:#059669;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;">Sign in to Solvad</a>
                        </p>
                        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;">For your security, <strong>change this password after your first sign-in</strong> from <strong>Profile &rsaquo; Account Settings</strong>, then delete this email.</p>
                        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;">If you weren't expecting this account, please contact the Solvad team.</p>
                        <p style="margin:0;font-size:14px;line-height:1.6;">Thanks,<br>The Solvad team</p>
                      </div>
                    </body>
                    </html>
                    """.formatted(
                    escapeHtml(greetingName),
                    escapeHtml(orgName),
                    escapeHtml(toEmail),
                    escapeHtml(password),
                    escapeHtml(loginUrl));

            send(toEmail, "Your Solvad industry partner account", textContent, htmlContent);
        } catch (Exception e) {
            log.error("Failed to send industry account credentials email to {}: {}", toEmail, e.getMessage());
        }
    }

    private void send(String toEmail, String subject, String textContent, String htmlContent) throws Exception {
        UserCredentials credentials = UserCredentials.newBuilder()
                .setClientId(clientId)
                .setClientSecret(clientSecret)
                .setRefreshToken(refreshToken)
                .build();

        Gmail gmail = new Gmail.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials))
                .setApplicationName("Solvad")
                .build();

        MimeMessage email = new MimeMessage(Session.getDefaultInstance(new Properties(), null));
        email.setFrom(new InternetAddress(fromEmail, "Solvad"));
        email.addRecipient(jakarta.mail.Message.RecipientType.TO, new InternetAddress(toEmail));
        email.setSubject(subject);

        MimeBodyPart textPart = new MimeBodyPart();
        textPart.setText(textContent, "utf-8");
        MimeBodyPart htmlPart = new MimeBodyPart();
        htmlPart.setContent(htmlContent, "text/html; charset=utf-8");

        MimeMultipart multipart = new MimeMultipart("alternative");
        multipart.addBodyPart(textPart);
        multipart.addBodyPart(htmlPart);
        email.setContent(multipart);

        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        email.writeTo(buffer);

        Message message = new Message();
        message.setRaw(Base64.getUrlEncoder().encodeToString(buffer.toByteArray()));
        gmail.users().messages().send("me", message).execute();
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String escapeHtml(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
