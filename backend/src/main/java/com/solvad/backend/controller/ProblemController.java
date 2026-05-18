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
}
