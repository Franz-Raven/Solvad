package com.solvad.backend.repository;

import com.solvad.backend.entity.Appeal;
import com.solvad.backend.entity.AppealStatus;
import com.solvad.backend.entity.Problem;
import com.solvad.backend.entity.SolverProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppealRepository extends JpaRepository<Appeal, UUID> {

    List<Appeal> findByProblemAndStatusOrderByCreatedAtDesc(Problem problem, AppealStatus status);

    List<Appeal> findByProblemAndStatus(Problem problem, AppealStatus status);

    Optional<Appeal> findByProblemAndSolverAndStatus(Problem problem, SolverProfile solver, AppealStatus status);

    long countByProblemAndStatus(Problem problem, AppealStatus status);
}
