package com.solvad.backend.problem.subtask;

import com.solvad.backend.problem.attachment.AttachmentRequirementResponse;

import java.util.List;
import java.util.UUID;

public class SubtaskResponse {
    private UUID id;
    private String title;
    private String departmentFocus;
    private String sdgFocus;
    private String description;
    private List<AttachmentRequirementResponse> attachments;

    public SubtaskResponse() {
    }

    public SubtaskResponse(UUID id, String title, String departmentFocus, String sdgFocus, String description) {
        this.id = id;
        this.title = title;
        this.departmentFocus = departmentFocus;
        this.sdgFocus = sdgFocus;
        this.description = description;
        this.attachments = null;
    }

    public SubtaskResponse(UUID id, String title, String departmentFocus, String sdgFocus, String description, List<AttachmentRequirementResponse> attachments) {
        this.id = id;
        this.title = title;
        this.departmentFocus = departmentFocus;
        this.sdgFocus = sdgFocus;
        this.description = description;
        this.attachments = attachments;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDepartmentFocus() {
        return departmentFocus;
    }

    public void setDepartmentFocus(String departmentFocus) {
        this.departmentFocus = departmentFocus;
    }

    public String getSdgFocus() {
        return sdgFocus;
    }

    public void setSdgFocus(String sdgFocus) {
        this.sdgFocus = sdgFocus;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<AttachmentRequirementResponse> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<AttachmentRequirementResponse> attachments) {
        this.attachments = attachments;
    }
}
