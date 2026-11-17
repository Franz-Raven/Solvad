package com.solvad.backend.problem.scope;

import com.solvad.backend.problem.core.EnhancedProblemResponse;
import com.solvad.backend.problem.subtask.SubtaskResponse;

import java.util.List;

public class GenerateScopeResponse {
    private EnhancedProblemResponse enhancedProblem;
    private List<SubtaskResponse> generatedSubtasks;
    private String scopeType;
    private String scopeRationale;
    private ScopeEvaluation evaluation;

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

    public String getScopeType() {
        return scopeType;
    }

    public void setScopeType(String scopeType) {
        this.scopeType = scopeType;
    }

    public String getScopeRationale() {
        return scopeRationale;
    }

    public void setScopeRationale(String scopeRationale) {
        this.scopeRationale = scopeRationale;
    }

    public ScopeEvaluation getEvaluation() {
        return evaluation;
    }

    public void setEvaluation(ScopeEvaluation evaluation) {
        this.evaluation = evaluation;
    }
}
