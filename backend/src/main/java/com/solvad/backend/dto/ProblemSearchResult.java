package com.solvad.backend.dto;

public class ProblemSearchResult {
    private ProblemResponse problem;
    private double score;

    public ProblemSearchResult() {}

    public ProblemSearchResult(ProblemResponse problem, double score) {
        this.problem = problem;
        this.score = score;
    }

    public ProblemResponse getProblem() {
        return problem;
    }

    public void setProblem(ProblemResponse problem) {
        this.problem = problem;
    }

    public double getScore() {
        return score;
    }

    public void setScore(double score) {
        this.score = score;
    }
}
