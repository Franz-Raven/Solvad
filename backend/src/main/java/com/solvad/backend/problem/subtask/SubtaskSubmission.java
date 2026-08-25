package com.solvad.backend.problem.subtask;

import com.solvad.backend.problem.solution_attempt.SolutionAttempt;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "subtask_submissions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"attempt_id", "subtask_id"}))
public class SubtaskSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "attempt_id", nullable = false)
    private SolutionAttempt attempt;

    @ManyToOne
    @JoinColumn(name = "subtask_id", nullable = false)
    private ProblemSubtask subtask;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Stored as comma-separated Supabase public URLs
    @Column(name = "file_urls", columnDefinition = "TEXT")
    private String fileUrls;

    // Add this field right under your description or fileUrls fields
    @Column(name = "delta_description", columnDefinition = "TEXT")
    private String deltaDescription;



    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubtaskSubmissionStatus status = SubtaskSubmissionStatus.DRAFT;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    public SubtaskSubmission() {
    }

    public SubtaskSubmission(SolutionAttempt attempt, ProblemSubtask subtask) {
        this.attempt = attempt;
        this.subtask = subtask;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public SolutionAttempt getAttempt() { return attempt; }
    public void setAttempt(SolutionAttempt attempt) { this.attempt = attempt; }

    public ProblemSubtask getSubtask() { return subtask; }
    public void setSubtask(ProblemSubtask subtask) { this.subtask = subtask; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getFileUrls() { return fileUrls; }
    public void setFileUrls(String fileUrls) { this.fileUrls = fileUrls; }

    public SubtaskSubmissionStatus getStatus() { return status; }
    public void setStatus(SubtaskSubmissionStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }


    // Helper to get file URLs as aaa List
    public List<String> getFileUrlsAsList() {
        if (fileUrls == null || fileUrls.isBlank()) return new ArrayList<>();
        List<String> list = new ArrayList<>();
        for (String url : fileUrls.split(",")) {
            String trimmed = url.trim();
            if (!trimmed.isEmpty()) list.add(trimmed);
        }
        return list;
    }

    public String getDeltaDescription() {
        return deltaDescription;
    }
    public void setDeltaDescription(String deltaDescription) {
        this.deltaDescription = deltaDescription;
    }


}