package com.solvad.backend.problem.solution_attempt;

import com.solvad.backend.problem.core.ProblemResponse;
import com.solvad.backend.problem.subtask.SubtaskSubmissionResponse;
import com.solvad.backend.security.JwtService;
import com.solvad.backend.dashboard.DiscoveryDashboardResponse;
import com.solvad.backend.problem.similarity.MatchmakingService;
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

    @Autowired
    private MatchmakingService matchmakingService;

    @Autowired
    private SolutionAttemptService solutionAttemptService;

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
    // MODULE 2 — Discovery dashboard (recommendations + filtered list)
    // GET /api/problems/discovery
    // -------------------------------------------------------------------------
    @GetMapping("/api/problems/discovery")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> getDiscoveryDashboard(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String tags) {
        try {
            UUID solverUserId = extractUserId(authHeader);
            DiscoveryDashboardResponse dashboard = matchmakingService.getDiscoveryDashboard(
                    solverUserId, search, tags);
            return ResponseEntity.ok(dashboard);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    // -------------------------------------------------------------------------
    // MY ATTEMPT — Solver gets their active attempt on aaa problem
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
    // SAVE DRAFT - SDD Section 3.6
    // PUT /api/attempts/{attemptId}/subtasks/{subtaskId}/draft
    // -------------------------------------------------------------------------
    @PutMapping("/api/attempts/{attemptId}/subtasks/{subtaskId}/draft")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> saveSubtaskDraft(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID attemptId,
            @PathVariable UUID subtaskId,
            @RequestParam("description") String description,
            @RequestParam(value = "deltaDescription", required = false, defaultValue = "") String deltaDescription,
            @RequestParam(value = "files", required = false) List<MultipartFile> files) {
        try {
            UUID solverUserId = extractUserId(authHeader);
            SubtaskSubmissionResponse response = attemptService.saveSubtaskDraft(
                    solverUserId, attemptId, subtaskId, description, files, deltaDescription);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // SUBMIT SUBTASK - SDD Section 3.6
    // POST /api/attempts/{attemptId}/subtasks/{subtaskId}/submit
    // -------------------------------------------------------------------------
    @PostMapping("/api/attempts/{attemptId}/subtasks/{subtaskId}/submit")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> lockAndSubmitSubtask(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID attemptId,
            @PathVariable UUID subtaskId,
            @RequestParam("description") String description,
            @RequestParam(value = "deltaDescription", required = false, defaultValue = "") String deltaDescription,
            @RequestParam(value = "files", required = false) List<MultipartFile> files) {
        try {
            UUID solverUserId = extractUserId(authHeader);
            SubtaskSubmissionResponse response = attemptService.lockAndSubmitSubtask(
                    solverUserId, attemptId, subtaskId, description, files, deltaDescription);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // COMPLETE ATTEMPT - SDD Section 3.6
    // POST /api/attempts/{attemptId}/complete
    // -------------------------------------------------------------------------
    @PostMapping("/api/attempts/{attemptId}/complete")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> completeAttempt(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID attemptId) {
        try {
            UUID solverUserId = extractUserId(authHeader);
            SolutionAttemptResponse response = attemptService.finalizeAttempt(solverUserId, attemptId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // DELETE FILE — Solver removes aaa file from aaa draft submission
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
    @PreAuthorize("hasAnyRole('SEEKER', 'SOLVER', 'ADMIN')")
    public ResponseEntity<?> getAllAttempts(@PathVariable UUID problemId) {
        try {
            // We no longer need to extract the seekerUserId here
            List<SolutionAttemptResponse> responses = attemptService.getAllAttemptsForProblem(problemId);
            return ResponseEntity.ok(responses);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // ATTEMPT DETAIL — Anyone with access views aaa single attempt's full details
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

    // -------------------------------------------------------------------------
// ABANDON ATTEMPT
// DELETE /api/attempts/{attemptId}/abandon
// -------------------------------------------------------------------------
    @DeleteMapping("/api/attempts/{attemptId}/abandon")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> abandonAttempt(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID attemptId) {
        try {
            UUID solverUserId = extractUserId(authHeader);
            attemptService.abandonAttempt(solverUserId, attemptId);
            return ResponseEntity.ok("Attempt abandoned successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ADD this new endpoint
    @GetMapping("/api/problems/{problemId}/subtasks/{subtaskId}/attempts")
    @PreAuthorize("hasAnyRole('SEEKER', 'SOLVER', 'ADMIN')")
    public ResponseEntity<?> getAttemptsForSubtask(
            @PathVariable UUID problemId,
            @PathVariable UUID subtaskId) {
        try {
            List<SolutionAttemptResponse> responses = attemptService.getAttemptsForSubtask(problemId, subtaskId);
            return ResponseEntity.ok(responses);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/api/problems/{problemId}/mark-solved")
    @PreAuthorize("hasRole('SEEKER')")
    public ResponseEntity<?> markAsSolved(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID problemId) {
        try {
            UUID seekerUserId = extractUserId(authHeader);
            attemptService.markAsSolved(seekerUserId, problemId); // void now
            return ResponseEntity.ok("Problem marked as solved");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/workspace")
    @PreAuthorize("hasAuthority('SOLVER')")
    public ResponseEntity<PaginatedAttemptsResponse> getWorkspaceAttempts(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "ACTIVE") String tab,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size
    ) {
        String token = authHeader.substring(7);
        UUID solverId = jwtService.extractUserId(token);

        PaginatedAttemptsResponse response = solutionAttemptService.getWorkspaceAttempts(solverId, tab, page, size);
        return ResponseEntity.ok(response);
    }


}