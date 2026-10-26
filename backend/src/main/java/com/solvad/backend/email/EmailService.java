package com.solvad.backend.email;

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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.Properties;

@Service
public class EmailService {

    private final String clientId;
    private final String clientSecret;
    private final String refreshToken;
    private final String fromEmail;

    public EmailService(
            @Value("${google.client.id}") String clientId,
            @Value("${google.client.secret}") String clientSecret,
            @Value("${google.refresh.token}") String refreshToken,
            @Value("${google.from.email}") String fromEmail) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.refreshToken = refreshToken;
        this.fromEmail = fromEmail;
    }

    @Async
    public void sendVerificationEmail(String toEmail, String code) {
        try {
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

            Properties props = new Properties();
            Session session = Session.getDefaultInstance(props, null);
            MimeMessage email = new MimeMessage(session);

            email.setFrom(new InternetAddress(fromEmail, "Solvad"));
            email.addRecipient(jakarta.mail.Message.RecipientType.TO, new InternetAddress(toEmail));
            email.setSubject("Your Solvad verification code");

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

            MimeMultipart multipart = new MimeMultipart("alternative");

            MimeBodyPart textPart = new MimeBodyPart();
            textPart.setText(textContent, "utf-8");

            MimeBodyPart htmlPart = new MimeBodyPart();
            htmlPart.setContent(htmlContent, "text/html; charset=utf-8");

            multipart.addBodyPart(textPart);
            multipart.addBodyPart(htmlPart);

            email.setContent(multipart);

            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            email.writeTo(buffer);
            byte[] rawMessageBytes = buffer.toByteArray();
            String encodedEmail = Base64.getUrlEncoder().encodeToString(rawMessageBytes);

            Message message = new Message();
            message.setRaw(encodedEmail);

            gmail.users().messages().send("me", message).execute();

        } catch (Exception e) {
            System.out.println("Failed to send HTTP Gmail API request " + e.getMessage());
        }
    }
}