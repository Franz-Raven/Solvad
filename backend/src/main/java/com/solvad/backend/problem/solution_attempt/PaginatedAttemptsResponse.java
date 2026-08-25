package com.solvad.backend.problem.solution_attempt;

import java.util.List;

public class PaginatedAttemptsResponse {
    private List<SolutionAttemptResponse> attempts;
    private int currentPage;
    private int totalPages;
    private long totalElements;
    private int size;

    public PaginatedAttemptsResponse(List<SolutionAttemptResponse> attempts, int currentPage, int totalPages, long totalElements, int size) {
        this.attempts = attempts;
        this.currentPage = currentPage;
        this.totalPages = totalPages;
        this.totalElements = totalElements;
        this.size = size;
    }

    // Getters and Setters
    public List<SolutionAttemptResponse> getAttempts() { return attempts; }
    public void setAttempts(List<SolutionAttemptResponse> attempts) { this.attempts = attempts; }
    public int getCurrentPage() { return currentPage; }
    public void setCurrentPage(int currentPage) { this.currentPage = currentPage; }
    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }
    public long getTotalElements() { return totalElements; }
    public void setTotalElements(long totalElements) { this.totalElements = totalElements; }
    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }
}