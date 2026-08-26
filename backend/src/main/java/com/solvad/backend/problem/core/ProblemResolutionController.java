package com.solvad.backend.problem.core;

import com.solvad.backend.problem.solution_attempt.SolutionAttemptService;
import com.solvad.backend.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/problems")
@CrossOrigin(origins = "http://localhost:3000")
public class ProblemResolutionController {

    @Autowired
    private SolutionAttemptService attemptService;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/{problemId}/mark-solved")
    @PreAuthorize("hasRole('SEEKER')")
    public ResponseEntity<?> markAsSolved(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID problemId) {
        try {
            UUID seekerUserId = jwtService.extractUserId(authHeader.substring(7));
            attemptService.markAsSolved(seekerUserId, problemId);
            return ResponseEntity.ok("Problem marked as solved");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}