package com.solvad.backend.problem.claim;

import java.util.List;

public class PaginatedClaimsResponse {
    private List<ClaimSummaryResponse> claims;
    private int currentPage;
    private int totalPages;
    private long totalElements;
    private int size;

    public PaginatedClaimsResponse(List<ClaimSummaryResponse> claims, int currentPage, int totalPages, long totalElements, int size) {
        this.claims = claims;
        this.currentPage = currentPage;
        this.totalPages = totalPages;
        this.totalElements = totalElements;
        this.size = size;
    }

    public List<ClaimSummaryResponse> getClaims() { return claims; }
    public int getCurrentPage() { return currentPage; }
    public int getTotalPages() { return totalPages; }
    public long getTotalElements() { return totalElements; }
    public int getSize() { return size; }
}