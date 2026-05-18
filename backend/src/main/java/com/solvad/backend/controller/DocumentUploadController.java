package com.solvad.backend.controller;

import com.solvad.backend.dto.DocumentUploadRequest;
import com.solvad.backend.entity.ActivityActionType;
import com.solvad.backend.entity.Problem;
import com.solvad.backend.entity.ProblemAttachment;
import com.solvad.backend.repository.ProblemAttachmentRepository;
import com.solvad.backend.repository.ProblemRepository;
import com.solvad.backend.security.JwtService;
import com.solvad.backend.service.ActivityLedgerService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/problems")
@CrossOrigin(origins = "http://localhost:3000")
public class DocumentUploadController {

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private ProblemAttachmentRepository problemAttachmentRepository;

    @Autowired
    private ActivityLedgerService activityLedgerService;

    @Autowired
    private JwtService jwtService;

    /**
     * Called AFTER the frontend has already uploaded the file to Supabase.
     * Receives the public URL + filename, persists the attachment, and writes the activity log.
     */
    @PostMapping("/{problemId}/documents")
    @PreAuthorize("hasAnyRole('SEEKER', 'SOLVER')")
    public ResponseEntity<?> registerDocument(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID problemId,
            @Valid @RequestBody DocumentUploadRequest request) {
        try {
            String token = authHeader.substring(7);
            UUID actorUserId = jwtService.extractUserId(token);

            Problem problem = problemRepository.findById(problemId)
                    .orElseThrow(() -> new RuntimeException("Problem not found"));

            // Persist the attachment record
            ProblemAttachment attachment = new ProblemAttachment(problem, request.getFileUrl());
            problemAttachmentRepository.save(attachment);

            // Write the immutable log entry
            activityLedgerService.log(
                    actorUserId,
                    problemId,
                    ActivityActionType.FILE_UPLOAD,
                    "Document uploaded",
                    request.getFileName()
            );

            return ResponseEntity.ok("Document registered successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}