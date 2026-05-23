package com.solvad.backend.dto;

import java.util.List;

public class GenerateScopeResponse {
    private EnhancedProblemResponse enhancedProblem;
    private List<SubtaskResponse> generatedSubtasks;

    public GenerateScopeResponse() {
    }

    public GenerateScopeResponse(EnhancedProblemResponse enhancedProblem, List<SubtaskResponse> generatedSubtasks) {
        this.enhancedProblem = enhancedProblem;
        this.generatedSubtasks = generatedSubtasks;
    }

    public EnhancedProblemResponse getEnhancedProblem() {
        return enhancedProblem;
    }

    public void setEnhancedProblem(EnhancedProblemResponse enhancedProblem) {
        this.enhancedProblem = enhancedProblem;
    }

    public List<SubtaskResponse> getGeneratedSubtasks() {
        return generatedSubtasks;
    }

    public void setGeneratedSubtasks(List<SubtaskResponse> generatedSubtasks) {
        this.generatedSubtasks = generatedSubtasks;
    }
}
