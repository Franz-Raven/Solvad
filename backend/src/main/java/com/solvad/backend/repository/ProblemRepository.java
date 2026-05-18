package com.solvad.backend.repository;

import com.solvad.backend.entity.Problem;
import com.solvad.backend.entity.SeekerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.solvad.backend.entity.ProblemStatus;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, UUID> {
    List<Problem> findBySeeker(SeekerProfile seeker);
    List<Problem> findBySeekerId(UUID seekerId);
    List<Problem> findByStatus(ProblemStatus status);
}
