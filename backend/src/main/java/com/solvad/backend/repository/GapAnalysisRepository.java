package com.solvad.backend.repository;

import com.solvad.backend.entity.GapAnalysisCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GapAnalysisRepository extends JpaRepository<GapAnalysisCache, UUID> {
    Optional<GapAnalysisCache> findBySourceProblemIdAndMatchedHistoricalProblemId(
            UUID sourceProblemId,
            UUID matchedHistoricalProblemId
    );

     // Check if gap analysis exists for problem pair
    boolean existsBySourceProblemIdAndMatchedHistoricalProblemId(
            UUID sourceProblemId,
            UUID matchedHistoricalProblemId
    );
}