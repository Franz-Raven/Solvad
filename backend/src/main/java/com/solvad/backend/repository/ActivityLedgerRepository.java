package com.solvad.backend.repository;

import com.solvad.backend.entity.ActivityLedger;
import com.solvad.backend.entity.Problem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ActivityLedgerRepository extends JpaRepository<ActivityLedger, UUID> {
    List<ActivityLedger> findByProblemOrderByTimestampDesc(Problem problem);
}