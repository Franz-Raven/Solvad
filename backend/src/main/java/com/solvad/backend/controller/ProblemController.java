package com.solvad.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.solvad.backend.dto.*;
import com.solvad.backend.security.JwtService;
import com.solvad.backend.service.AuditService;
import com.solvad.backend.service.ProblemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    @Autowired
    private AuditService auditService;


    @PostMapping("/generate-scope")
    @PreAuthorize("hasRole('SEEKER')")
    public ResponseEntity<?> generateScope(
            @RequestParam("data") String requestData,
            @RequestParam(value = "attachments", required = false) List<MultipartFile> attachments) {
        try {
            // Parse JSON data to GenerateScopeRequest
            ObjectMapper objectMapper = new ObjectMapper();
            GenerateScopeRequest request = objectMapper.readValue(requestData, GenerateScopeRequest.class);
            
            GenerateScopeResponse response = problemService.generateScope(request, attachments);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to process request: " + e.getMessage());
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('SEEKER')")
    public ResponseEntity<?> createProblem(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ProblemRequest request) {
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

    @GetMapping("/notifications")
    @PreAuthorize("hasRole('SEEKER')")
    public ResponseEntity<?> getSeekerNotifications(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            UUID seekerUserId = jwtService.extractUserId(token);
            return ResponseEntity.ok(problemService.getSeekerNotifications(seekerUserId));
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

    @GetMapping("/{problemId}/audit-log")
    public ResponseEntity<List<AuditLogResponse>> getAuditLog(
            @PathVariable UUID problemId) {

        List<AuditLogResponse> logs = auditService.getLogsForProblem(problemId);
        return ResponseEntity.ok(logs);
    }



    // -------------------------------------------------------------------------
    // GET ACTIVITY FEED - SDD Section 3.2 & 3.7
    // GET /api/problems/{problemId}/audit-log
    // -------------------------------------------------------------------------
    @GetMapping("/api/problems/{problemId}/audit-log")
    @PreAuthorize("hasAnyRole('SEEKER', 'SOLVER', 'ADMIN')")
    public ResponseEntity<?> getProblemActivityFeed(@PathVariable UUID problemId) {
        try {
            List<AuditLogResponse> timeline = auditService.getAuditLogsForProblem(problemId);
            return ResponseEntity.ok(timeline);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

}
