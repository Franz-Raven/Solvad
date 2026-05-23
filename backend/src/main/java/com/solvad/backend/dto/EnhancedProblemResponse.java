package com.solvad.backend.dto;

import java.util.List;

public class EnhancedProblemResponse {
    private String title;
    private String backgroundContext;
    private String primaryStatement;
    private List<String> objectives;
    private List<String> constraints;
    private String sdgFocus;

    public EnhancedProblemResponse() {
    }

    public EnhancedProblemResponse(String title, String backgroundContext, String primaryStatement, 
                                   List<String> objectives, List<String> constraints, String sdgFocus) {
        this.title = title;
        this.backgroundContext = backgroundContext;
        this.primaryStatement = primaryStatement;
        this.objectives = objectives;
        this.constraints = constraints;
        this.sdgFocus = sdgFocus;
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

    public List<String> getObjectives() {
        return objectives;
    }

    public void setObjectives(List<String> objectives) {
        this.objectives = objectives;
    }

    public List<String> getConstraints() {
        return constraints;
    }

    public void setConstraints(List<String> constraints) {
        this.constraints = constraints;
    }

    public String getSdgFocus() {
        return sdgFocus;
    }

    public void setSdgFocus(String sdgFocus) {
        this.sdgFocus = sdgFocus;
    }
}
