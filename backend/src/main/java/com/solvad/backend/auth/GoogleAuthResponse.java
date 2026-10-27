package com.solvad.backend.auth;

public class GoogleAuthResponse {
    private boolean profileComplete;
    private String email;
    private String firstName;
    private String lastName;
    private AuthResponse authResponse;

    public GoogleAuthResponse() {
    }

    public GoogleAuthResponse(
            boolean profileComplete,
            String email,
            String firstName,
            String lastName,
            AuthResponse authResponse) {
        this.profileComplete = profileComplete;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.authResponse = authResponse;
    }

    public boolean isProfileComplete() {
        return profileComplete;
    }

    public void setProfileComplete(boolean profileComplete) {
        this.profileComplete = profileComplete;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public AuthResponse getAuthResponse() {
        return authResponse;
    }

    public void setAuthResponse(AuthResponse authResponse) {
        this.authResponse = authResponse;
    }
}
