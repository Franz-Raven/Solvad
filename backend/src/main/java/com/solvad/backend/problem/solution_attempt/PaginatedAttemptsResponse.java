package com.solvad.backend.problem.solution_attempt;

import java.util.List;

public class PaginatedAttemptsResponse {
    // 🚀 Uses the lightweight summary instead of the heavy full response
    private List<SolutionAttemptSummaryResponse> attempts;
    private int currentPage;
    private int totalPages;
    private long totalElements;
    private int size;

    public PaginatedAttemptsResponse(List<SolutionAttemptSummaryResponse> attempts, int currentPage, int totalPages, long totalElements, int size) {
        this.attempts = attempts;
        this.currentPage = currentPage;
        this.totalPages = totalPages;
        this.totalElements = totalElements;
        this.size = size;
    }

    public List<SolutionAttemptSummaryResponse> getAttempts() { return attempts; }
    public int getCurrentPage() { return currentPage; }
    public int getTotalPages() { return totalPages; }
    public long getTotalElements() { return totalElements; }
    public int getSize() { return size; }
}