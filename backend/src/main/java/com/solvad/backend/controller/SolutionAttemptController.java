package com.solvad.backend.controller;

import com.solvad.backend.dto.ProblemResponse;
import com.solvad.backend.dto.SolutionAttemptResponse;
import com.solvad.backend.dto.SubtaskSubmissionResponse;
import com.solvad.backend.security.JwtService;
import com.solvad.backend.service.SolutionAttemptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
public class SolutionAttemptController {

    @Autowired
    private SolutionAttemptService attemptService;

    @Autowired
    private JwtService jwtService;

    // -------------------------------------------------------------------------
    // BROWSE — Solver sees all OPEN problems
    // GET /api/problems/open
    // -------------------------------------------------------------------------
    @GetMapping("/api/problems/open")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> getOpenProblems() {
        try {
            List<ProblemResponse> problems = attemptService.getOpenProblems();
            return ResponseEntity.ok(problems);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // CLAIM — Solver claims a problem
    // POST /api/problems/{problemId}/claim
    // -------------------------------------------------------------------------
    @PostMapping("/api/problems/{problemId}/claim")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> claimProblem(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID problemId) {
        try {
            UUID solverUserId = extractUserId(authHeader);
            SolutionAttemptResponse response = attemptService.claimProblem(solverUserId, problemId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // ABANDON — Solver abandons their active claim
    // DELETE /api/problems/{problemId}/claim
    // -------------------------------------------------------------------------
    @DeleteMapping("/api/problems/{problemId}/claim")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> abandonClaim(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID problemId) {
        try {
            UUID solverUserId = extractUserId(authHeader);
            attemptService.abandonClaim(solverUserId, problemId);
            return ResponseEntity.ok("Claim abandoned successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // MY ATTEMPT — Solver gets their active attempt on a problem
    // GET /api/problems/{problemId}/my-attempt
    // -------------------------------------------------------------------------
    @GetMapping("/api/problems/{problemId}/my-attempt")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> getMyAttempt(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID problemId) {
        try {
            UUID solverUserId = extractUserId(authHeader);
            SolutionAttemptResponse response = attemptService.getMyAttempt(solverUserId, problemId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // SAVE/SUBMIT subtask — Solver saves draft or finalizes a subtask submission
    // POST /api/attempts/{attemptId}/subtasks/{subtaskId}
    //
    // Multipart form:
    //   - description (String)
    //   - action      (String: "SAVE_DRAFT" | "SUBMIT")
    //   - files       (MultipartFile[], optional)
    // -------------------------------------------------------------------------
    @PostMapping("/api/attempts/{attemptId}/subtasks/{subtaskId}")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> saveOrSubmitSubtask(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID attemptId,
            @PathVariable UUID subtaskId,
            @RequestParam("description") String description,
            @RequestParam("action") String action,
            @RequestParam(value = "files", required = false) List<MultipartFile> files) {
        try {
            UUID solverUserId = extractUserId(authHeader);
            SubtaskSubmissionResponse response = attemptService.saveOrSubmitSubtask(
                    solverUserId, attemptId, subtaskId, description, action, files);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // DELETE FILE — Solver removes a file from a draft submission
    // DELETE /api/submissions/{submissionId}/files
    //   - fileUrl (String query param)
    // -------------------------------------------------------------------------
    @DeleteMapping("/api/submissions/{submissionId}/files")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> deleteFile(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID submissionId,
            @RequestParam("fileUrl") String fileUrl) {
        try {
            UUID solverUserId = extractUserId(authHeader);
            SubtaskSubmissionResponse response = attemptService.deleteFileFromSubmission(
                    solverUserId, submissionId, fileUrl);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // ALL ATTEMPTS — Seeker views attempt tree for their problem
    // GET /api/problems/{problemId}/attempts
    // -------------------------------------------------------------------------
    @GetMapping("/api/problems/{problemId}/attempts")
    @PreAuthorize("hasRole('SEEKER')")
    public ResponseEntity<?> getAllAttempts(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID problemId) {
        try {
            UUID seekerUserId = extractUserId(authHeader);
            List<SolutionAttemptResponse> responses = attemptService.getAllAttemptsForProblem(
                    seekerUserId, problemId);
            return ResponseEntity.ok(responses);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // ATTEMPT DETAIL — Anyone with access views a single attempt's full details
    // GET /api/attempts/{attemptId}
    // -------------------------------------------------------------------------
    @GetMapping("/api/attempts/{attemptId}")
    @PreAuthorize("hasAnyRole('SOLVER', 'SEEKER', 'ADMIN')")
    public ResponseEntity<?> getAttemptById(@PathVariable UUID attemptId) {
        try {
            SolutionAttemptResponse response = attemptService.getAttemptById(attemptId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // MARK SOLVED — Seeker marks problem as solved
    // POST /api/problems/{problemId}/mark-solved
    // -------------------------------------------------------------------------
    @PostMapping("/api/problems/{problemId}/mark-solved")
    @PreAuthorize("hasRole('SEEKER')")
    public ResponseEntity<?> markAsSolved(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID problemId) {
        try {
            UUID seekerUserId = extractUserId(authHeader);
            SolutionAttemptResponse response = attemptService.markAsSolved(seekerUserId, problemId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // Helper
    // -------------------------------------------------------------------------
    private UUID extractUserId(String authHeader) {
        String token = authHeader.substring(7);
        return jwtService.extractUserId(token);
    }

    @GetMapping("/api/attempts/my-attempts")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> getMyActiveAttempts(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            UUID solverUserId = jwtService.extractUserId(token);

            List<SolutionAttemptResponse> responses = attemptService.getMyAttempts(solverUserId);
            return ResponseEntity.ok(responses);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}