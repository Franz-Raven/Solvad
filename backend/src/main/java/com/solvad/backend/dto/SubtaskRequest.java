package com.solvad.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class SubtaskRequest {
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "Department focus is required")
    private String departmentFocus;
    
    @NotBlank(message = "Description is required")
    private String description;

    public SubtaskRequest() {
    }

    public SubtaskRequest(String title, String departmentFocus, String description) {
        this.title = title;
        this.departmentFocus = departmentFocus;
        this.description = description;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
