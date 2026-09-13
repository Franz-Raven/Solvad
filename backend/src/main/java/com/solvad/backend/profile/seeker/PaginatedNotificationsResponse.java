package com.solvad.backend.profile.seeker;

import java.util.List;

public class PaginatedNotificationsResponse {
    private List<SeekerNotificationResponse> notifications;
    private int currentPage;
    private int totalPages;
    private long totalElements;
    private int size;

    public PaginatedNotificationsResponse() {}

    public PaginatedNotificationsResponse(List<SeekerNotificationResponse> notifications, int currentPage, int totalPages, long totalElements, int size) {
        this.notifications = notifications;
        this.currentPage = currentPage;
        this.totalPages = totalPages;
        this.totalElements = totalElements;
        this.size = size;
    }

    public List<SeekerNotificationResponse> getNotifications() { return notifications; }
    public void setNotifications(List<SeekerNotificationResponse> notifications) { this.notifications = notifications; }
    public int getCurrentPage() { return currentPage; }
    public void setCurrentPage(int currentPage) { this.currentPage = currentPage; }
    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }
    public long getTotalElements() { return totalElements; }
    public void setTotalElements(long totalElements) { this.totalElements = totalElements; }
    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }
}