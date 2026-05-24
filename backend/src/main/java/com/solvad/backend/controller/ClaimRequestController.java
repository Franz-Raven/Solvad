package com.solvad.backend.controller;

import com.solvad.backend.dto.ProposalDTO;
import com.solvad.backend.entity.ClaimRequest;
import com.solvad.backend.security.JwtService;
import com.solvad.backend.service.ClaimRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class ClaimRequestController {

    @Autowired
    private ClaimRequestService claimRequestService;

    @Autowired
    private JwtService jwtService;

    // -------------------------------------------------------------------------
    // SUBMIT PROPOSAL (Solver Action)
    // POST /api/problems/{problemId}/proposals
    // -------------------------------------------------------------------------
    @PostMapping("/problems/{problemId}/proposals")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> submitProposal(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID problemId,
            @RequestBody ProposalDTO proposalDTO) {
        try {
            UUID solverUserId = extractUserId(authHeader);
            proposalDTO.setProblemId(problemId);
            proposalDTO.setSolverId(solverUserId);

            ClaimRequest request = claimRequestService.submitProposal(solverUserId, proposalDTO);
            return ResponseEntity.ok(request);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // EVALUATE PROPOSAL (Seeker Action)
    // POST /api/proposals/{proposalId}/evaluate
    // -------------------------------------------------------------------------
    @PostMapping("/proposals/{proposalId}/evaluate")
    @PreAuthorize("hasRole('SEEKER')")
    public ResponseEntity<?> evaluateProposal(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID proposalId,
            @RequestParam boolean isApproved) {
        try {
            UUID seekerUserId = extractUserId(authHeader);
            claimRequestService.evaluateProposal(seekerUserId, proposalId, isApproved);

            String status = isApproved ? "approved and workspace generated" : "rejected";
            return ResponseEntity.ok("Proposal successfully " + status);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // GET PENDING PROPOSALS (Seeker Action)
    // GET /api/problems/{problemId}/proposals/pending
    // -------------------------------------------------------------------------
    @GetMapping("/problems/{problemId}/proposals/pending")
    @PreAuthorize("hasAnyRole('SEEKER', 'ADMIN')")
    public ResponseEntity<?> getPendingProposals(@PathVariable UUID problemId) {
        try {
            List<ClaimRequest> pendingRequests = claimRequestService.getPendingProposalsForProblem(problemId);
            return ResponseEntity.ok(pendingRequests);
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
}