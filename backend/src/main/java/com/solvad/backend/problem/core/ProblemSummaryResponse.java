package com.solvad.backend.problem.core;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class ProblemSummaryResponse {
    private UUID id;
    private String title;
    private String status;
    private LocalDateTime createdAt;
    private int subtaskCount;
    private String preferredProgram;
    private String sdgFocus;
    private String organizationName;
    private List<String> tags;

    public ProblemSummaryResponse() {}

    public ProblemSummaryResponse(UUID id, String title, String status, LocalDateTime createdAt,
                                  int subtaskCount, String preferredProgram, String sdgFocus,
                                  String organizationName, List<String> tags) {
        this.id = id;
        this.title = title;
        this.status = status;
        this.createdAt = createdAt;
        this.subtaskCount = subtaskCount;
        this.preferredProgram = preferredProgram;
        this.sdgFocus = sdgFocus;
        this.organizationName = organizationName;
        this.tags = tags;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public int getSubtaskCount() { return subtaskCount; }
    public void setSubtaskCount(int subtaskCount) { this.subtaskCount = subtaskCount; }

    public String getPreferredProgram() { return preferredProgram; }
    public void setPreferredProgram(String preferredProgram) { this.preferredProgram = preferredProgram; }

    public String getSdgFocus() { return sdgFocus; }
    public void setSdgFocus(String sdgFocus) { this.sdgFocus = sdgFocus; }

    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
}
