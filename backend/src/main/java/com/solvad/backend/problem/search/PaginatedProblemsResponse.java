package com.solvad.backend.problem.search;

import com.solvad.backend.problem.core.ProblemSummaryResponse;
import java.util.List;

public class PaginatedProblemsResponse {
    private List<ProblemSummaryResponse> problems; // 🚀 Use the lightweight summary!
    private int currentPage;
    private int totalPages;
    private long totalElements;
    private int pageSize;

    public PaginatedProblemsResponse(List<ProblemSummaryResponse> problems, int currentPage, int totalPages, long totalElements, int pageSize) {
        this.problems = problems;
        this.currentPage = currentPage;
        this.totalPages = totalPages;
        this.totalElements = totalElements;
        this.pageSize = pageSize;
    }

    public List<ProblemSummaryResponse> getProblems() { return problems; }
    public int getCurrentPage() { return currentPage; }
    public int getTotalPages() { return totalPages; }
    public long getTotalElements() { return totalElements; }
    public int getPageSize() { return pageSize; }
}