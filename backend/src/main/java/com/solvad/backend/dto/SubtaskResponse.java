package com.solvad.backend.dto;

import java.util.UUID;

public class SubtaskResponse {
    private UUID id;
    private String title;
    private String departmentFocus;
    private String description;

    public SubtaskResponse() {
    }

    public SubtaskResponse(UUID id, String title, String departmentFocus, String description) {
        this.id = id;
        this.title = title;
        this.departmentFocus = departmentFocus;
        this.description = description;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
