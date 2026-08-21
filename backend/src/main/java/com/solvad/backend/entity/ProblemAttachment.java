package com.solvad.backend.entity;

import com.solvad.backend.problem.subtask.ProblemSubtask;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "problem_attachments")
public class ProblemAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "attachment_title", nullable = false)
    private String attachmentTitle;

    @Column(name = "attachment_type", nullable = false)
    private String attachmentType;

    @Column(name = "attachment_link")
    private String attachmentLink;

    @ManyToOne
    @JoinColumn(name = "problem_subtask_id", nullable = false)
    private ProblemSubtask subtask;

    public ProblemAttachment() {
    }

    public ProblemAttachment(String attachmentTitle, String attachmentType, ProblemSubtask subtask) {
        this.attachmentTitle = attachmentTitle;
        this.attachmentType = attachmentType;
        this.subtask = subtask;
        this.attachmentLink = null; // To be filled by the solver later
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getAttachmentTitle() {
        return attachmentTitle;
    }

    public void setAttachmentTitle(String attachmentTitle) {
        this.attachmentTitle = attachmentTitle;
    }

    public String getAttachmentType() {
        return attachmentType;
    }

    public void setAttachmentType(String attachmentType) {
        this.attachmentType = attachmentType;
    }

    public String getAttachmentLink() {
        return attachmentLink;
    }

    public void setAttachmentLink(String attachmentLink) {
        this.attachmentLink = attachmentLink;
    }

    public ProblemSubtask getSubtask() {
        return subtask;
    }

    public void setSubtask(ProblemSubtask subtask) {
        this.subtask = subtask;
    }
}