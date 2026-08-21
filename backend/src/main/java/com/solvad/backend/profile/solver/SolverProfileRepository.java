package com.solvad.backend.profile.solver;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SolverProfileRepository extends JpaRepository<SolverProfile, UUID> {
    Optional<SolverProfile> findByUserId(UUID userId);
    boolean existsByUserId(UUID userId);
}