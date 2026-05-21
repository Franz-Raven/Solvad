package com.solvad.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class DiscoveryDashboardResponse {

    private List<ProblemResponse> recommended = new ArrayList<>();
    private List<ProblemResponse> problems = new ArrayList<>();
    private List<String> availableTags = new ArrayList<>();
    private String solverCourse;
    private String solverSkills;

    public DiscoveryDashboardResponse() {
    }

    public List<ProblemResponse> getRecommended() {
        return recommended;
    }

    public void setRecommended(List<ProblemResponse> recommended) {
        this.recommended = recommended;
    }

    public List<ProblemResponse> getProblems() {
        return problems;
    }

    public void setProblems(List<ProblemResponse> problems) {
        this.problems = problems;
    }

    public List<String> getAvailableTags() {
        return availableTags;
    }

    public void setAvailableTags(List<String> availableTags) {
        this.availableTags = availableTags;
    }

    public String getSolverCourse() {
        return solverCourse;
    }

    public void setSolverCourse(String solverCourse) {
        this.solverCourse = solverCourse;
    }

    public String getSolverSkills() {
        return solverSkills;
    }

    public void setSolverSkills(String solverSkills) {
        this.solverSkills = solverSkills;
    }
}
