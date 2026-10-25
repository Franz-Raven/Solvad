package com.solvad.backend.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class VerifyRequest {
    @NotBlank(message = "Token is required")
    @Size(min = 6, max = 6, message = "Token must be exactly 6 characters")
    private String token;

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}