package com.solvad.backend.dto;

import java.util.List;

public class GenerateScopeResponse {
    private List<SubtaskResponse> generatedSubtasks;

    public GenerateScopeResponse() {
    }

    public GenerateScopeResponse(List<SubtaskResponse> generatedSubtasks) {
        this.generatedSubtasks = generatedSubtasks;
    }

    public List<SubtaskResponse> getGeneratedSubtasks() {
        return generatedSubtasks;
    }

    public void setGeneratedSubtasks(List<SubtaskResponse> generatedSubtasks) {
        this.generatedSubtasks = generatedSubtasks;
    }
}
