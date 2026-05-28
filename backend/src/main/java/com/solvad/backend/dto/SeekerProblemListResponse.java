package com.solvad.backend.dto;

import java.util.List;

public class SeekerProblemListResponse {
    private List<ProblemSummaryResponse> problems;
    private int currentPage;
    private int totalPages;
    private long totalElements;
    private int pageSize;

    public SeekerProblemListResponse() {}

    public SeekerProblemListResponse(List<ProblemSummaryResponse> problems, int currentPage, int totalPages, long totalElements, int pageSize) {
        this.problems = problems;
        this.currentPage = currentPage;
        this.totalPages = totalPages;
        this.totalElements = totalElements;
        this.pageSize = pageSize;
    }

    public List<ProblemSummaryResponse> getProblems() { return problems; }
    public void setProblems(List<ProblemSummaryResponse> problems) { this.problems = problems; }

    public int getCurrentPage() { return currentPage; }
    public void setCurrentPage(int currentPage) { this.currentPage = currentPage; }

    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }

    public long getTotalElements() { return totalElements; }
    public void setTotalElements(long totalElements) { this.totalElements = totalElements; }

    public int getPageSize() { return pageSize; }
    public void setPageSize(int pageSize) { this.pageSize = pageSize; }
}
