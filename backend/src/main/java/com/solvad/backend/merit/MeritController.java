package com.solvad.backend.merit;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/merit") // 🚀 Matches the frontend's /api base URL
@CrossOrigin(origins = {
        "http://localhost:3000",
        "https://solvad.vercel.app"
}) // 🚀 FIX: This prevents the 403 Forbidden error!
public class MeritController {

    private final MeritService meritService;

    public MeritController(MeritService meritService) {
        this.meritService = meritService;
    }

    @GetMapping("/solver/{solverId}")
    public ResponseEntity<SolverMeritDTO> getSolverMerit(@PathVariable UUID solverId) {
        SolverMeritDTO metrics = meritService.getMetricsForSolver(solverId);
        return ResponseEntity.ok(metrics);
    }


}