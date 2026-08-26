package com.solvad.backend.problem.core;

import com.solvad.backend.profile.seeker.SeekerProfile;
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
    Page<Problem> findByStatusIn(List<ProblemStatus> statuses, Pageable pageable);

    List<Problem> findByStatusIn(List<ProblemStatus> statuses);
    Page<Problem> findBySeeker(SeekerProfile seeker, Pageable pageable);
    Page<Problem> findBySeekerAndCreatedAtAfter(SeekerProfile seeker, LocalDateTime after, Pageable pageable);
    Page<Problem> findBySeekerAndSdgFocus(SeekerProfile seeker, String sdgFocus, Pageable pageable);
    Page<Problem> findBySeekerAndSdgFocusAndCreatedAtAfter(SeekerProfile seeker, String sdgFocus, LocalDateTime after, Pageable pageable);

    @Query("SELECT p FROM Problem p WHERE p.seeker = :seeker AND " +
           "(LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.primaryStatement) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.backgroundContext) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Problem> searchBySeeker(@Param("seeker") SeekerProfile seeker,
                                 @Param("query") String query,
                                 Pageable pageable);

    @Query("SELECT p FROM Problem p WHERE p.seeker = :seeker AND " +
           "p.createdAt >= :after AND " +
           "(LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.primaryStatement) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.backgroundContext) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Problem> searchBySeekerAfter(@Param("seeker") SeekerProfile seeker,
                                      @Param("after") LocalDateTime after,
                                      @Param("query") String query,
                                      Pageable pageable);

    @Query("SELECT p FROM Problem p WHERE p.seeker = :seeker AND " +
           "p.sdgFocus = :sdgFocus AND " +
           "(LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.primaryStatement) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.backgroundContext) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Problem> searchBySeekerAndSdg(@Param("seeker") SeekerProfile seeker,
                                       @Param("sdgFocus") String sdgFocus,
                                       @Param("query") String query,
                                       Pageable pageable);

    @Query("SELECT p FROM Problem p WHERE p.seeker = :seeker AND " +
           "p.sdgFocus = :sdgFocus AND p.createdAt >= :after AND " +
           "(LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.primaryStatement) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.backgroundContext) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Problem> searchBySeekerAndSdgAfter(@Param("seeker") SeekerProfile seeker,
                                            @Param("sdgFocus") String sdgFocus,
                                            @Param("after") LocalDateTime after,
                                            @Param("query") String query,
                                            Pageable pageable);
}