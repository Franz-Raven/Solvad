package com.solvad.backend.problem.search;

import com.solvad.backend.problem.core.ProblemResponse;

import java.util.List;

public class PaginatedProblemsResponse {
    private List<ProblemResponse> problems;
    private int currentPage;
    private int totalPages;
    private long totalElements;
    private int pageSize;

    public PaginatedProblemsResponse() {}

    public PaginatedProblemsResponse(List<ProblemResponse> problems, int currentPage, int totalPages, long totalElements, int pageSize) {
        this.problems = problems;
        this.currentPage = currentPage;
        this.totalPages = totalPages;
        this.totalElements = totalElements;
        this.pageSize = pageSize;
    }

    public List<ProblemResponse> getProblems() {
        return problems;
    }

    public void setProblems(List<ProblemResponse> problems) {
        this.problems = problems;
    }

    public int getCurrentPage() {
        return currentPage;
    }

    public void setCurrentPage(int currentPage) {
        this.currentPage = currentPage;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public void setTotalElements(long totalElements) {
        this.totalElements = totalElements;
    }

    public int getPageSize() {
        return pageSize;
    }

    public void setPageSize(int pageSize) {
        this.pageSize = pageSize;
    }
}
