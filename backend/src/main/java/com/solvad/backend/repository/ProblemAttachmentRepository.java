package com.solvad.backend.repository;

import com.solvad.backend.entity.ProblemAttachment;
import com.solvad.backend.entity.ProblemSubtask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProblemAttachmentRepository extends JpaRepository<ProblemAttachment, UUID> {
    List<ProblemAttachment> findBySubtask(ProblemSubtask subtask);
}