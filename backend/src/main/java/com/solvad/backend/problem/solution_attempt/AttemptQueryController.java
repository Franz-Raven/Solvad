package com.solvad.backend.problem.solution_attempt;

import com.solvad.backend.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class AttemptQueryController {

    @Autowired
    private SolutionAttemptService attemptService;

    @Autowired
    private JwtService jwtService;

    private UUID extractUserId(String authHeader) {
        return jwtService.extractUserId(authHeader.substring(7));
    }

    @GetMapping("/problems/{problemId}/my-attempt")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> getMyAttempt(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID problemId) {
        try {
            return ResponseEntity.ok(attemptService.getMyAttempt(extractUserId(authHeader), problemId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/problems/{problemId}/attempts")
    @PreAuthorize("hasAnyRole('SEEKER', 'SOLVER', 'ADMIN')")
    public ResponseEntity<?> getAllAttempts(@PathVariable UUID problemId) {
        try {
            return ResponseEntity.ok(attemptService.getAllAttemptsForProblem(problemId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/problems/{problemId}/subtasks/{subtaskId}/attempts")
    @PreAuthorize("hasAnyRole('SEEKER', 'SOLVER', 'ADMIN')")
    public ResponseEntity<?> getAttemptsForSubtask(
            @PathVariable UUID problemId,
            @PathVariable UUID subtaskId) {
        try {
            return ResponseEntity.ok(attemptService.getAttemptsForSubtask(problemId, subtaskId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/attempts/{attemptId}")
    @PreAuthorize("hasAnyRole('SOLVER', 'SEEKER', 'ADMIN')")
    public ResponseEntity<?> getAttemptById(@PathVariable UUID attemptId) {
        try {
            return ResponseEntity.ok(attemptService.getAttemptById(attemptId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/attempts/my-attempts")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> getMyActiveAttempts(@RequestHeader("Authorization") String authHeader) {
        try {
            return ResponseEntity.ok(attemptService.getMyAttempts(extractUserId(authHeader)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/attempts/workspace")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<PaginatedAttemptsResponse> getWorkspaceAttempts(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "ACTIVE") String tab,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        PaginatedAttemptsResponse response = attemptService.getWorkspaceAttempts(extractUserId(authHeader), tab, page, size);
        return ResponseEntity.ok(response);
    }
}