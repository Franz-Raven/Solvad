package com.solvad.backend.repository;

import com.solvad.backend.entity.Problem;
import com.solvad.backend.entity.ProblemStatus;
import com.solvad.backend.entity.SeekerProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, UUID> {
    List<Problem> findBySeeker(SeekerProfile seeker);
    List<Problem> findBySeekerId(UUID seekerId);
    List<Problem> findByStatus(ProblemStatus status);
    List<Problem> findByStatusIn(List<ProblemStatus> statuses);

    Page<Problem> findBySeeker(SeekerProfile seeker, Pageable pageable);
    Page<Problem> findBySeekerAndSdgFocus(SeekerProfile seeker, String sdgFocus, Pageable pageable);

    @Query("SELECT p FROM Problem p WHERE p.seeker = :seeker AND " +
           "(LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.primaryStatement) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.backgroundContext) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Problem> searchBySeeker(@Param("seeker") SeekerProfile seeker,
                                 @Param("query") String query,
                                 Pageable pageable);
}