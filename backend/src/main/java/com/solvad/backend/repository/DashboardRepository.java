package com.solvad.backend.repository;

import com.solvad.backend.entity.Problem;
import com.solvad.backend.dto.ProblemStatusGroupDto;
import com.solvad.backend.dto.SdgDistributionDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.UUID;

public interface DashboardRepository extends JpaRepository<Problem, UUID> {

    @Query("SELECT new com.solvad.backend.dto.ProblemStatusGroupDto(" +
           "SUM(CASE WHEN p.status = 'OPEN' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN p.status IN ('CLAIMED', 'IN_PROGRESS') THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN p.status = 'SOLVED_OPEN_FOR_IMPROVEMENT' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN p.status = 'COMPLETED' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN p.status = 'CLOSED' THEN 1 ELSE 0 END)) " +
           "FROM Problem p")
    ProblemStatusGroupDto getProblemStatusGrouping();

    @Query("SELECT new com.solvad.backend.dto.SdgDistributionDto(p.sdgFocus, COUNT(p)) " +
           "FROM Problem p WHERE p.sdgFocus IS NOT NULL GROUP BY p.sdgFocus")
    List<SdgDistributionDto> getSdgDistribution();
}