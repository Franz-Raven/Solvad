package com.solvad.backend.problem.subtask;

import com.solvad.backend.problem.attachment.AttachmentRequirementRequest;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class SubtaskRequest {
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "Department focus is required")
    private String departmentFocus;
    
    private String sdgFocus;
    
    @NotBlank(message = "Description is required")
    private String description;

    private List<AttachmentRequirementRequest> attachments;

    public SubtaskRequest() {
    }

    public SubtaskRequest(String title, String departmentFocus, String sdgFocus, String description, List<AttachmentRequirementRequest> attachments) {
        this.title = title;
        this.departmentFocus = departmentFocus;
        this.sdgFocus = sdgFocus;
        this.description = description;
        this.attachments = attachments;
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

    public List<AttachmentRequirementRequest> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<AttachmentRequirementRequest> attachments) {
        this.attachments = attachments;
    }
}