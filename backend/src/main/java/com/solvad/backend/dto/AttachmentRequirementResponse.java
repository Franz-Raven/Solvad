package com.solvad.backend.dto;

import java.util.UUID;

public class AttachmentRequirementResponse {
    private UUID id;
    private String attachmentTitle;
    private String attachmentType;

    public AttachmentRequirementResponse() {
    }

    public AttachmentRequirementResponse(UUID id, String attachmentTitle, String attachmentType) {
        this.id = id;
        this.attachmentTitle = attachmentTitle;
        this.attachmentType = attachmentType;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
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
