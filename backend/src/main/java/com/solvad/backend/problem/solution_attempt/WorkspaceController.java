package com.solvad.backend.problem.solution_attempt;

import com.solvad.backend.problem.subtask.SubtaskSubmissionResponse;
import com.solvad.backend.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class WorkspaceController {

    @Autowired
    private SolutionAttemptService attemptService;

    @Autowired
    private JwtService jwtService;

    private UUID extractUserId(String authHeader) {
        return jwtService.extractUserId(authHeader.substring(7));
    }

    @PutMapping("/attempts/{attemptId}/subtasks/{subtaskId}/draft")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> saveSubtaskDraft(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID attemptId,
            @PathVariable UUID subtaskId,
            @RequestParam("description") String description,
            @RequestParam(value = "deltaDescription", required = false, defaultValue = "") String deltaDescription,
            @RequestParam(value = "files", required = false) List<MultipartFile> files) {
        try {
            SubtaskSubmissionResponse response = attemptService.saveSubtaskDraft(
                    extractUserId(authHeader), attemptId, subtaskId, description, files, deltaDescription);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/attempts/{attemptId}/subtasks/{subtaskId}/submit")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> lockAndSubmitSubtask(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID attemptId,
            @PathVariable UUID subtaskId,
            @RequestParam("description") String description,
            @RequestParam(value = "deltaDescription", required = false, defaultValue = "") String deltaDescription,
            @RequestParam(value = "files", required = false) List<MultipartFile> files) {
        try {
            SubtaskSubmissionResponse response = attemptService.lockAndSubmitSubtask(
                    extractUserId(authHeader), attemptId, subtaskId, description, files, deltaDescription);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/attempts/{attemptId}/complete")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> completeAttempt(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID attemptId) {
        try {
            SolutionAttemptResponse response = attemptService.finalizeAttempt(extractUserId(authHeader), attemptId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/submissions/{submissionId}/files")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> deleteFile(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID submissionId,
            @RequestParam("fileUrl") String fileUrl) {
        try {
            SubtaskSubmissionResponse response = attemptService.deleteFileFromSubmission(
                    extractUserId(authHeader), submissionId, fileUrl);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/attempts/{attemptId}/abandon")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> abandonAttempt(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID attemptId) {
        try {
            attemptService.abandonAttempt(extractUserId(authHeader), attemptId);
            return ResponseEntity.ok("Attempt abandoned successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}