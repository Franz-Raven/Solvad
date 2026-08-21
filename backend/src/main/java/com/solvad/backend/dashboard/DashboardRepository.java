package com.solvad.backend.dashboard;

import com.solvad.backend.problem.core.Problem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface DashboardRepository extends JpaRepository<Problem, UUID> {

    @Query("SELECT new com.solvad.backend.dashboard.ProblemStatusGroupDto(" +
            "SUM(CASE WHEN p.status = 'OPEN' THEN 1 ELSE 0 END), " +
            "SUM(CASE WHEN p.status IN ('CLAIMED', 'IN_PROGRESS') THEN 1 ELSE 0 END), " +
            "SUM(CASE WHEN p.status = 'SOLVED_OPEN_FOR_IMPROVEMENT' THEN 1 ELSE 0 END), " +
            "SUM(CASE WHEN p.status = 'COMPLETED' THEN 1 ELSE 0 END), " +
            "SUM(CASE WHEN p.status = 'CLOSED' THEN 1 ELSE 0 END)) " +
            "FROM Problem p WHERE p.seeker.id = :seekerId")
    ProblemStatusGroupDto getProblemStatusGrouping(@Param("seekerId") UUID seekerId);

    @Query("SELECT new com.solvad.backend.dashboard.SdgDistributionDto(p.sdgFocus, COUNT(p)) " +
            "FROM Problem p WHERE p.sdgFocus IS NOT NULL AND p.seeker.id = :seekerId GROUP BY p.sdgFocus")
    List<SdgDistributionDto> getSdgDistribution(@Param("seekerId") UUID seekerId);
}