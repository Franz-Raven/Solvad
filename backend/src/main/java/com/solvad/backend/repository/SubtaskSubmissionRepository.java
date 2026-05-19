package com.solvad.backend.repository;

import com.solvad.backend.entity.ProblemSubtask;
import com.solvad.backend.entity.SolutionAttempt;
import com.solvad.backend.entity.SubtaskSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubtaskSubmissionRepository extends JpaRepository<SubtaskSubmission, UUID> {

    List<SubtaskSubmission> findByAttempt(SolutionAttempt attempt);

    Optional<SubtaskSubmission> findByAttemptAndSubtask(SolutionAttempt attempt, ProblemSubtask subtask);

    boolean existsByAttemptAndSubtask(SolutionAttempt attempt, ProblemSubtask subtask);
}