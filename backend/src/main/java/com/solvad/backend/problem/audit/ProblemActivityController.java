package com.solvad.backend.problem.audit;

import com.solvad.backend.problem.core.ProblemService;
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
public class ProblemActivityController {

    @Autowired
    private AuditService auditService;

    @Autowired
    private ProblemService problemService;

    @Autowired
    private JwtService jwtService;

    @GetMapping("/{problemId}/audit-log")
    @PreAuthorize("hasAnyRole('SEEKER', 'SOLVER', 'ADMIN')")
    public ResponseEntity<?> getProblemActivityFeed(@PathVariable UUID problemId) {
        try {
            List<AuditLogResponse> timeline = auditService.getAuditLogsForProblem(problemId);
            return ResponseEntity.ok(timeline);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/notifications")
    @PreAuthorize("hasRole('SEEKER')")
    public ResponseEntity<?> getSeekerNotifications(@RequestHeader("Authorization") String authHeader) {
        try {
            UUID seekerUserId = jwtService.extractUserId(authHeader.substring(7));
            return ResponseEntity.ok(problemService.getSeekerNotifications(seekerUserId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}