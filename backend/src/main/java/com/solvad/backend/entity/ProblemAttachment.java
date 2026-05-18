package com.solvad.backend.entity;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "problem_attachments")
public class ProblemAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @Column(name = "file_url", nullable = false)
    private String fileUrl;

    public ProblemAttachment() {
    }

    public ProblemAttachment(Problem problem, String fileUrl) {
        this.problem = problem;
        this.fileUrl = fileUrl;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Problem getProblem() {
        return problem;
    }

    public void setProblem(Problem problem) {
        this.problem = problem;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }
}
