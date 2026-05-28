package com.solvad.backend.dto;

import java.util.List;
import java.util.UUID;

public class SubtaskWithAttachmentsResponse {
    private UUID id;
    private String title;
    private String departmentFocus;
    private String sdgFocus;
    private String description;
    private List<AttachmentResponse> attachments;

    public SubtaskWithAttachmentsResponse() {
    }

    public SubtaskWithAttachmentsResponse(UUID id, String title, String departmentFocus, String sdgFocus, String description, List<AttachmentResponse> attachments) {
        this.id = id;
        this.title = title;
        this.departmentFocus = departmentFocus;
        this.sdgFocus = sdgFocus;
        this.description = description;
        this.attachments = attachments;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDepartmentFocus() { return departmentFocus; }
    public void setDepartmentFocus(String departmentFocus) { this.departmentFocus = departmentFocus; }
    public String getSdgFocus() { return sdgFocus; }
    public void setSdgFocus(String sdgFocus) { this.sdgFocus = sdgFocus; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<AttachmentResponse> getAttachments() { return attachments; }
    public void setAttachments(List<AttachmentResponse> attachments) { this.attachments = attachments; }

    public static class AttachmentResponse {
        private String id;
        private String attachmentTitle;
        private String attachmentType;

        public AttachmentResponse() {}

        public AttachmentResponse(String id, String attachmentTitle, String attachmentType) {
            this.id = id;
            this.attachmentTitle = attachmentTitle;
            this.attachmentType = attachmentType;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getAttachmentTitle() { return attachmentTitle; }
        public void setAttachmentTitle(String attachmentTitle) { this.attachmentTitle = attachmentTitle; }
        public String getAttachmentType() { return attachmentType; }
        public void setAttachmentType(String attachmentType) { this.attachmentType = attachmentType; }
    }
}