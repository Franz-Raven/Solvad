package com.solvad.backend.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.HtmlUtils;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Notification emails only (Resend). Auth/registration emails stay on Gmail SMTP (JavaMailSender).
 */
@Service
public class ResendEmailService {

    private static final Logger log = LoggerFactory.getLogger(ResendEmailService.class);
    private static final String RESEND_URL = "https://api.resend.com/emails";

    private final RestClient restClient;
    private final String fromEmail;
    private final String frontendUrl;

    public ResendEmailService(@Value("${resend.api-key}") String apiKey,
                              @Value("${resend.from-email}") String fromEmail,
                              @Value("${app.frontend-url:http://localhost:3000}") String frontendUrl) {
        this.fromEmail = fromEmail;
        this.frontendUrl = frontendUrl;
        this.restClient = RestClient.builder()
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    // true if Resend accepted the request
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

        Map<String, Object> body = Map.of(
                "from", fromEmail,
                "to", List.of(toEmail),
                "subject", subject,
                "html", html);

        try {
            restClient.post()
                    .uri(RESEND_URL)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (RestClientException e) {
            log.error("Resend email to {} failed for problem {}", toEmail, problemId, e);
            return false;
        }
    }
}
