package com.solvad.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class DocumentUploadRequest {

    @NotBlank(message = "File URL is required")
    private String fileUrl;

    @NotBlank(message = "File name is required")
    private String fileName;

    public DocumentUploadRequest() {
    }

    public DocumentUploadRequest(String fileUrl, String fileName) {
        this.fileUrl = fileUrl;
        this.fileName = fileName;
    }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
}