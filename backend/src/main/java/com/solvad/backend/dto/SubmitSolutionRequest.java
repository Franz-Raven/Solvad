// src/main/java/com/solvad/backend/dto/SubmitSolutionRequest.java
package com.solvad.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class SubmitSolutionRequest {

    @NotBlank(message = "Solution details are required")
    private String details;

    private String fileUrl; // Optional supporting document URL

    public SubmitSolutionRequest() {
    }

    public SubmitSolutionRequest(String details, String fileUrl) {
        this.details = details;
        this.fileUrl = fileUrl;
    }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
}