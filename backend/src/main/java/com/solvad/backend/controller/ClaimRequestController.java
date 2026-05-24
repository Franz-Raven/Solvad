package com.solvad.backend.controller;

import com.solvad.backend.dto.ProposalDTO;
import com.solvad.backend.entity.ClaimRequest;
import com.solvad.backend.entity.ClaimRequestStatus;
import com.solvad.backend.security.JwtService;
import com.solvad.backend.service.ClaimRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

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
            return ResponseEntity.ok(mapToDTO(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // GET MY PROPOSAL STATUS (Solver Action)
    // GET /api/problems/{problemId}/proposals/my-status
    // Returns { "status": "PENDING" | "APPROVED" | "REJECTED" | "NONE" }
    // -------------------------------------------------------------------------
    @GetMapping("/problems/{problemId}/proposals/my-status")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> getMyProposalStatus(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID problemId) {
        try {
            UUID solverUserId = extractUserId(authHeader);
            Optional<ClaimRequestStatus> status =
                    claimRequestService.getMyProposalStatus(solverUserId, problemId);
            String statusStr = status.map(Enum::name).orElse("NONE");
            return ResponseEntity.ok(Map.of("status", statusStr));
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
    // Returns a clean DTO list — no raw entity serialization
    // -------------------------------------------------------------------------
    @GetMapping("/problems/{problemId}/proposals/pending")
    @PreAuthorize("hasAnyRole('SEEKER', 'ADMIN')")
    public ResponseEntity<?> getPendingProposals(@PathVariable UUID problemId) {
        try {
            List<ClaimRequest> pendingRequests =
                    claimRequestService.getPendingProposalsForProblem(problemId);
            List<Map<String, Object>> dtos = pendingRequests.stream()
                    .map(this::mapToDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // Helper — map ClaimRequest entity → safe serializable map
    // -------------------------------------------------------------------------
    private Map<String, Object> mapToDTO(ClaimRequest r) {
        return Map.of(
                "id",               r.getId(),
                "proposedApproach", r.getProposedApproach() != null ? r.getProposedApproach() : "",
                "status",           r.getStatus().name(),
                "createdAt",        r.getCreatedAt() != null ? r.getCreatedAt().toString() : "",
                "parentAttemptId",  r.getParentAttempt() != null ? r.getParentAttempt().getId().toString() : "",
                "solver", Map.of(
                        "id",        r.getSolver().getId(),
                        "firstName", r.getSolver().getFirstName(),
                        "lastName",  r.getSolver().getLastName()
                ),
                "problem", Map.of(
                        "id", r.getProblem().getId()
                )
        );
    }

    private UUID extractUserId(String authHeader) {
        String token = authHeader.substring(7);
        return jwtService.extractUserId(token);
    }
}