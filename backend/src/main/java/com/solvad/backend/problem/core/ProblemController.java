package com.solvad.backend.problem.core;

import com.solvad.backend.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/problems")
@CrossOrigin(origins = "http://localhost:3000")
public class ProblemController {

    @Autowired
    private ProblemService problemService;

    @Autowired
    private JwtService jwtService;

    @PostMapping
    @PreAuthorize("hasRole('SEEKER')")
    public ResponseEntity<?> createProblem(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ProblemRequest request) {
        try {
            UUID seekerUserId = jwtService.extractUserId(authHeader.substring(7));
            ProblemResponse response = problemService.createProblem(seekerUserId, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{problemId}")
    @PreAuthorize("hasAnyRole('SEEKER', 'SOLVER', 'ADMIN')")
    public ResponseEntity<?> getProblemById(@PathVariable UUID problemId) {
        try {
            ProblemResponse response = problemService.getProblemById(problemId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{problemId}/status")
    @PreAuthorize("hasRole('SEEKER')")
    public ResponseEntity<?> updateProblemStatus(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID problemId,
            @RequestBody UpdateStatusRequest request) {
        try {
            UUID seekerUserId = jwtService.extractUserId(authHeader.substring(7));
            ProblemResponse response = problemService.updateProblemStatus(seekerUserId, problemId, request.getStatus());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{problemId}/max-solvers")
    @PreAuthorize("hasRole('SEEKER')")
    public ResponseEntity<?> updateMaxConcurrentSolvers(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID problemId,
            @RequestParam int maxSolvers) {
        try {
            UUID seekerUserId = jwtService.extractUserId(authHeader.substring(7));
            problemService.updateMaxConcurrentSolvers(seekerUserId, problemId, maxSolvers);
            return ResponseEntity.ok("Limit updated successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{problemId}")
    @PreAuthorize("hasRole('SEEKER')")
    public ResponseEntity<?> deleteProblem(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID problemId) {
        try {
            UUID seekerUserId = jwtService.extractUserId(authHeader.substring(7));
            problemService.deleteProblem(seekerUserId, problemId);
            return ResponseEntity.ok().body("Problem deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    public static class UpdateStatusRequest {
        private String status;
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}