package com.solvad.backend.problem.attachment;

import com.solvad.backend.problem.subtask.ProblemSubtask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProblemAttachmentRepository extends JpaRepository<ProblemAttachment, UUID> {
    List<ProblemAttachment> findBySubtask(ProblemSubtask subtask);
}