package com.solvad.backend.profile.seeker;

import com.solvad.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SeekerProfileRepository extends JpaRepository<SeekerProfile, UUID> {
    Optional<SeekerProfile> findByUser(User user);
    Optional<SeekerProfile> findByUserId(UUID userId);
}
