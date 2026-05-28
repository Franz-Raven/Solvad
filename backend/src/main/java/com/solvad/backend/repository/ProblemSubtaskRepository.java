package com.solvad.backend.repository;

import com.solvad.backend.entity.Problem;
import com.solvad.backend.entity.ProblemSubtask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProblemSubtaskRepository extends JpaRepository<ProblemSubtask, UUID> {
    List<ProblemSubtask> findByProblem(Problem problem);
    List<ProblemSubtask> findByProblemId(UUID problemId);
    List<ProblemSubtask> findByProblemIn(List<Problem> problems);
}
