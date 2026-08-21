package com.solvad.backend.controller;

import com.solvad.backend.dto.ProblemStatusGroupDto;
import com.solvad.backend.dto.SdgDistributionDto;
import com.solvad.backend.repository.DashboardRepository;
import com.solvad.backend.profile.seeker.SeekerProfileRepository;
import com.solvad.backend.security.JwtService;
import com.solvad.backend.profile.seeker.SeekerProfile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardRepository dashboardRepository;
    private final JwtService jwtService;
    private final SeekerProfileRepository seekerProfileRepository;

    public DashboardController(DashboardRepository dashboardRepository,
                               JwtService jwtService,
                               SeekerProfileRepository seekerProfileRepository) {
        this.dashboardRepository = dashboardRepository;
        this.jwtService = jwtService;
        this.seekerProfileRepository = seekerProfileRepository;
    }

    @GetMapping("/status-distribution")
    public ResponseEntity<?> getStatusDistribution(
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            UUID userId = jwtService.extractUserId(token);

            SeekerProfile seeker = seekerProfileRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Seeker profile not found"));

            ProblemStatusGroupDto stats = dashboardRepository.getProblemStatusGrouping(seeker.getId());
            return ResponseEntity.ok(stats);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/sdg-distribution")
    public ResponseEntity<?> getSdgDistribution(
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            UUID userId = jwtService.extractUserId(token);

            SeekerProfile seeker = seekerProfileRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Seeker profile not found"));

            List<SdgDistributionDto> sdgStats = dashboardRepository.getSdgDistribution(seeker.getId());
            return ResponseEntity.ok(sdgStats);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}