package com.solvad.backend.controller;

import com.solvad.backend.dto.GenerateScopeRequest;
import com.solvad.backend.dto.GenerateScopeResponse;
import com.solvad.backend.dto.ProblemRequest;
import com.solvad.backend.dto.ProblemResponse;
import com.solvad.backend.security.JwtService;
import com.solvad.backend.service.ProblemService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/problems")
@CrossOrigin(origins = "http://localhost:3000")
public class ProblemController {

    @Autowired
    private ProblemService problemService;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/generate-scope")
    @PreAuthorize("hasRole('SEEKER')")
    public ResponseEntity<?> generateScope(@Valid @RequestBody GenerateScopeRequest request) {
        try {
            GenerateScopeResponse response = problemService.generateScope(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('SEEKER')")
    public ResponseEntity<?> createProblem(@RequestHeader("Authorization") String authHeader,
                                          @Valid @RequestBody ProblemRequest request) {
        try {
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            UUID seekerUserId = jwtService.extractUserId(token);
            
            ProblemResponse response = problemService.createProblem(seekerUserId, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/my-problems")
    @PreAuthorize("hasRole('SEEKER')")
    public ResponseEntity<?> getMyProblems(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            UUID seekerUserId = jwtService.extractUserId(token);
            
            List<ProblemResponse> problems = problemService.getMyProblems(seekerUserId);
            return ResponseEntity.ok(problems);
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
    public ResponseEntity<?> updateProblemStatus(@RequestHeader("Authorization") String authHeader,
                                                 @PathVariable UUID problemId,
                                                 @RequestBody UpdateStatusRequest request) {
        try {
            String token = authHeader.substring(7);
            UUID seekerUserId = jwtService.extractUserId(token);
            
            ProblemResponse response = problemService.updateProblemStatus(seekerUserId, problemId, request.getStatus());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{problemId}")
    @PreAuthorize("hasRole('SEEKER')")
    public ResponseEntity<?> deleteProblem(@RequestHeader("Authorization") String authHeader,
                                          @PathVariable UUID problemId) {
        try {
            String token = authHeader.substring(7);
            UUID seekerUserId = jwtService.extractUserId(token);
            
            problemService.deleteProblem(seekerUserId, problemId);
            return ResponseEntity.ok().body("Problem deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Simple DTO for status update
    public static class UpdateStatusRequest {
        private String status;

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }

    @PostMapping("/{id}/claim")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> claimProblem(
            @PathVariable UUID id,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            UUID solverUserId = jwtService.extractUserId(token);

            problemService.claimProblem(id, solverUserId);
            return ResponseEntity.ok().body("{\"message\": \"Problem claimed successfully\"}");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SEEKER', 'SOLVER', 'ADMIN')")
    public ResponseEntity<?> getProblems(@RequestParam(required = false) String status) {
        try {
            if (status != null && !status.isEmpty()) {
                List<ProblemResponse> problems = problemService.getProblemsByStatus(status);
                return ResponseEntity.ok(problems);
            }
            // If no status is provided, return an empty list or implement getAll()
            return ResponseEntity.ok(List.of());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}



