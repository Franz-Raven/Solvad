package com.solvad.backend.repository;

import com.solvad.backend.entity.SolverProfile;
import com.solvad.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SolverProfileRepository extends JpaRepository<SolverProfile, UUID> {
    Optional<SolverProfile> findByUser(User user);
    Optional<SolverProfile> findByUserId(UUID userId);
}
