package com.solvad.backend.controller;

import com.solvad.backend.dto.ProblemStatusGroupDto;
import com.solvad.backend.dto.SdgDistributionDto;
import com.solvad.backend.repository.DashboardRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardRepository dashboardRepository;

    public DashboardController(DashboardRepository dashboardRepository) {
        this.dashboardRepository = dashboardRepository;
    }

    @GetMapping("/status-distribution")
    public ProblemStatusGroupDto getStatusDistribution() {
        return dashboardRepository.getProblemStatusGrouping();
    }

    @GetMapping("/sdg-distribution")
    public List<SdgDistributionDto> getSdgDistribution() {
        return dashboardRepository.getSdgDistribution();
    }
}