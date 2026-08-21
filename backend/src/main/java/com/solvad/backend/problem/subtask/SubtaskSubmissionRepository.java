package com.solvad.backend.problem.subtask;

import com.solvad.backend.solution.attempt.SolutionAttempt;
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