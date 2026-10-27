package com.solvad.backend.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.List;

@Service
public class GoogleIdentityService {
    private final GoogleIdTokenVerifier verifier;

    public GoogleIdentityService(@Value("${google.client.id}") String clientId) {
        try {
            verifier = new GoogleIdTokenVerifier.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    GsonFactory.getDefaultInstance())
                    .setAudience(List.of(clientId))
                    .build();
        } catch (GeneralSecurityException | IOException exception) {
            throw new IllegalStateException("Unable to initialize Google token verification", exception);
        }
    }

    public GoogleIdentity verify(String credential) {
        final GoogleIdToken idToken;
        try {
            idToken = verifier.verify(credential);
        } catch (GeneralSecurityException | IOException exception) {
            throw new IllegalArgumentException("Unable to verify Google credentials", exception);
        }

        if (idToken == null) {
            throw new IllegalArgumentException("Invalid Google credentials");
        }

        GoogleIdToken.Payload payload = idToken.getPayload();
        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new IllegalArgumentException("Google account email is not verified");
        }

        String email = payload.getEmail();
        String subject = payload.getSubject();
        if (email == null || subject == null) {
            throw new IllegalArgumentException("Google credentials are missing required account details");
        }

        return new GoogleIdentity(
                subject,
                email,
                payload.get("given_name") instanceof String firstName ? firstName : "",
                payload.get("family_name") instanceof String lastName ? lastName : "");
    }
}
