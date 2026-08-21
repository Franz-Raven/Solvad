package com.solvad.backend.problem.attachment;

import jakarta.validation.constraints.NotBlank;

public class AttachmentRequirementRequest {
    @NotBlank(message = "Title is required")
    private String attachmentTitle;
    
    @NotBlank(message = "Type is required")
    private String attachmentType;

    public AttachmentRequirementRequest() {
    }

    public AttachmentRequirementRequest(String attachmentTitle, String attachmentType) {
        this.attachmentTitle = attachmentTitle;
        this.attachmentType = attachmentType;
    }

    public String getAttachmentTitle() {
        return attachmentTitle;
    }

    public void setAttachmentTitle(String attachmentTitle) {
        this.attachmentTitle = attachmentTitle;
    }

    public String getAttachmentType() {
        return attachmentType;
    }

    public void setAttachmentType(String attachmentType) {
        this.attachmentType = attachmentType;
    }
}