package com.solvad.backend.dashboard;

import com.solvad.backend.problem.core.ProblemResponse;
import com.solvad.backend.problem.similarity.MatchmakingService;
import com.solvad.backend.problem.solution_attempt.SolutionAttemptService;
import com.solvad.backend.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/problems")
@CrossOrigin(origins = "http://localhost:3000")
public class DiscoveryController {

    @Autowired
    private MatchmakingService matchmakingService;

    @Autowired
    private SolutionAttemptService attemptService;

    @Autowired
    private JwtService jwtService;

    @GetMapping("/open")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> getOpenProblems() {
        try {
            List<ProblemResponse> problems = attemptService.getOpenProblems();
            return ResponseEntity.ok(problems);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/discovery")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> getDiscoveryDashboard(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String tags) {
        try {
            UUID solverUserId = jwtService.extractUserId(authHeader.substring(7));
            DiscoveryDashboardResponse dashboard = matchmakingService.getDiscoveryDashboard(solverUserId, search, tags);
            return ResponseEntity.ok(dashboard);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}