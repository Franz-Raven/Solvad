package com.solvad.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class GenerateScopeRequest {
    @NotBlank(message = "Title is required")
    private String title;
    
    private String backgroundContext;
    
    @NotBlank(message = "Primary statement is required")
    private String primaryStatement;
    
    private String objectives;
    
    private String constraints;
    
    private String requiredProgram;

    public GenerateScopeRequest() {
    }

    public GenerateScopeRequest(String title, String backgroundContext, String primaryStatement, 
                               String objectives, String constraints, String requiredProgram) {
        this.title = title;
        this.backgroundContext = backgroundContext;
        this.primaryStatement = primaryStatement;
        this.objectives = objectives;
        this.constraints = constraints;
        this.requiredProgram = requiredProgram;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getBackgroundContext() {
        return backgroundContext;
    }

    public void setBackgroundContext(String backgroundContext) {
        this.backgroundContext = backgroundContext;
    }

    public String getPrimaryStatement() {
        return primaryStatement;
    }

    public void setPrimaryStatement(String primaryStatement) {
        this.primaryStatement = primaryStatement;
    }

    public String getObjectives() {
        return objectives;
    }

    public void setObjectives(String objectives) {
        this.objectives = objectives;
    }

    public String getConstraints() {
        return constraints;
    }

    public void setConstraints(String constraints) {
        this.constraints = constraints;
    }

    public String getRequiredProgram() {
        return requiredProgram;
    }

    public void setRequiredProgram(String requiredProgram) {
        this.requiredProgram = requiredProgram;
    }
}
