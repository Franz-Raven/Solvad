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
@CrossOrigin(origins = {"http://localhost:3000", "https://solvad.vercel.app"})
public class SolutionAttemptController {

    @Autowired
    private SolutionAttemptService attemptService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private MatchmakingService matchmakingService;

    @Autowired
    private SolutionAttemptService solutionAttemptService;

    // 🚀 Changed path to 2 segments to permanently bypass the {attemptId} collision
    @GetMapping("/api/attempts/active/count")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<ActiveAttemptsCountResponse> getMyActiveAttemptsCount(
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        UUID userId = jwtService.extractUserId(token);

        ActiveAttemptsCountResponse response = solutionAttemptService.getMyActiveAttemptsCount(userId);
        return ResponseEntity.ok(response);
    }
    @GetMapping("/api/attempts/{attemptId}")
    @PreAuthorize("hasAnyRole('SOLVER', 'SEEKER', 'ADMIN')")
    public ResponseEntity<?> getAttemptById(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID attemptId) {
        try {
            UUID currentUserId = extractUserId(authHeader);
            SolutionAttemptResponse response = attemptService.getAttemptById(attemptId, currentUserId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


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

    @GetMapping("/api/problems/{problemId}/attempts")
    @PreAuthorize("hasAnyRole('SEEKER', 'SOLVER', 'ADMIN')")
    public ResponseEntity<?> getAllAttempts(
            @RequestHeader("Authorization") String authHeader, // 👈 Add this line
            @PathVariable UUID problemId) {
        try {
            UUID currentUserId = extractUserId(authHeader); // 👈 Add this line
            List<SolutionAttemptResponse> responses = attemptService.getAllAttemptsForProblem(problemId, currentUserId);
            return ResponseEntity.ok(responses);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


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

    @GetMapping("/api/problems/{problemId}/subtasks/{subtaskId}/attempts")
    @PreAuthorize("hasAnyRole('SEEKER', 'SOLVER', 'ADMIN')")
    public ResponseEntity<?> getAttemptsForSubtask(
            @RequestHeader("Authorization") String authHeader, // 👈 Add this line
            @PathVariable UUID problemId,
            @PathVariable UUID subtaskId) {
        try {
            UUID currentUserId = extractUserId(authHeader); // 👈 Add this line
            List<SolutionAttemptResponse> responses = attemptService.getAttemptsForSubtask(problemId, subtaskId, currentUserId);
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

    @GetMapping("/api/attempts/workspace")
    @PreAuthorize("hasRole('SOLVER')")
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

    @GetMapping("/api/history/{id}")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<AttemptDetailResponse> getAttemptDetails(
            @PathVariable UUID id,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            UUID solverId = jwtService.extractUserId(token);
            return ResponseEntity.ok(solutionAttemptService.getAttemptDetails(id, solverId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 🚀 Update the generic return type from AttemptNodeSummaryResponse to SolutionAttemptSummaryResponse
    @GetMapping("/api/problems/{problemId}/attempts/tree")
    @PreAuthorize("hasAnyRole('SEEKER', 'SOLVER', 'ADMIN')")
    public ResponseEntity<List<SolutionAttemptSummaryResponse>> getProblemTree(
            @PathVariable UUID problemId,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(solutionAttemptService.getLightweightTree(problemId));
    }

    @GetMapping("/api/problems/{problemId}/attempts/active-count")
    @PreAuthorize("hasAnyRole('SEEKER', 'ADMIN')")
    public ResponseEntity<ActiveAttemptsCountResponse> getProblemActiveAttemptsCount(@PathVariable UUID problemId) {
        long count = solutionAttemptService.getActiveAttemptsCountForProblem(problemId);
        return ResponseEntity.ok(new ActiveAttemptsCountResponse(count));
    }

}