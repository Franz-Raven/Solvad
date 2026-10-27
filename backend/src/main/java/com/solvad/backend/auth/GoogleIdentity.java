package com.solvad.backend.auth;

public record GoogleIdentity(String subject, String email, String firstName, String lastName) {
}
