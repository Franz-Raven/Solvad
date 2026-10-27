package com.solvad.backend.auth;

import com.solvad.backend.profile.solver.SolverProfileRequest;
import jakarta.validation.constraints.NotBlank;

public class GoogleProfileRequest extends SolverProfileRequest {
    @NotBlank(message = "Google credential is required")
    private String token;

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
