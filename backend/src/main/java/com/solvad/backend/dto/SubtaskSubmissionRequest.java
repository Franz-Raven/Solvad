package com.solvad.backend.dto;


public class SubtaskSubmissionRequest {

    private String description;

    // "DRAFT" or "SUBMITTED" — solver chooses whether to save draft or finalize
    private String action; // "SAVE_DRAFT" | "SUBMIT"

    public SubtaskSubmissionRequest() {
    }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
}