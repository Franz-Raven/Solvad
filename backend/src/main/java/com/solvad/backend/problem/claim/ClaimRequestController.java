package com.solvad.backend.problem.claim;

import com.solvad.backend.user.User;
import com.solvad.backend.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
    @PostMapping("/problems/{problemId}/proposals")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> submitProposal(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID problemId,
            @RequestParam("proposedApproach") String proposedApproach,
            @RequestParam(value = "subtaskId") UUID subtaskId,          // ADD THIS
            @RequestParam(value = "parentAttemptId", required = false) UUID parentAttemptId,
            @RequestParam(value = "files", required = false) List<MultipartFile> files) {
        try {
            UUID solverUserId = extractUserId(authHeader);

            ProposalDTO proposalDTO = new ProposalDTO();
            proposalDTO.setProblemId(problemId);
            proposalDTO.setSolverId(solverUserId);
            proposalDTO.setProposedApproach(proposedApproach);
            proposalDTO.setParentAttemptId(parentAttemptId);
            proposalDTO.setSubtaskId(subtaskId);                        // ADD THIS

            ClaimRequest request = claimRequestService.submitProposal(solverUserId, proposalDTO, files);
            return ResponseEntity.ok(mapToDTO(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    // -------------------------------------------------------------------------
    // GET MY PROPOSAL STATUS (Solver Action)
    // -------------------------------------------------------------------------
    @GetMapping("/problems/{problemId}/proposals/my-status")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> getMyProposalStatus(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID problemId) {
        try {
            UUID solverUserId = extractUserId(authHeader);
            Optional<ClaimRequestStatus> status =
                    claimRequestService.getMyProposalStatusForProblem(solverUserId, problemId); // legacy whole-problem method
            String statusStr = status.map(Enum::name).orElse("NONE");
            return ResponseEntity.ok(Map.of("status", statusStr));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/problems/{problemId}/subtasks/{subtaskId}/proposals/my-status")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<?> getMyProposalStatusForSubtask(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID problemId,
            @PathVariable UUID subtaskId) {
        try {
            UUID solverUserId = extractUserId(authHeader);

            // FIX: Call getMyProposalStatus instead of getMyProposalStatusForProblem
            Optional<ClaimRequestStatus> status =
                    claimRequestService.getMyProposalStatus(solverUserId, problemId, subtaskId);

            String statusStr = status.map(Enum::name).orElse("NONE");
            return ResponseEntity.ok(Map.of("status", statusStr));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    // -------------------------------------------------------------------------
    // EVALUATE PROPOSAL (Seeker Action)
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
    // -------------------------------------------------------------------------
    @GetMapping("/problems/{problemId}/proposals/pending")
    @PreAuthorize("hasAnyRole('SEEKER', 'ADMIN')")
    public ResponseEntity<?> getPendingProposals(@PathVariable UUID problemId) {
        try {
            List<ClaimRequest> pendingRequests = claimRequestService.getPendingProposalsForProblem(problemId);
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
        Map<String, Object> dto = new java.util.HashMap<>();
        var solver = r.getSolver();
        User user = solver.getUser();
        String profilePictureUrl = user.getProfileUrl();
        dto.put("id",                  r.getId());
        dto.put("proposedApproach",    r.getProposedApproach() != null ? r.getProposedApproach() : "");
        dto.put("supportingDocuments", r.getSupportingDocuments() != null ? r.getSupportingDocuments() : "");
        dto.put("status",              r.getStatus().name());
        dto.put("createdAt",           r.getCreatedAt() != null ? r.getCreatedAt().toString() : "");
        dto.put("parentAttemptId",     r.getParentAttempt() != null ? r.getParentAttempt().getId().toString() : "");
        dto.put("targetSubtaskId",     r.getTargetSubtask() != null ? r.getTargetSubtask().getId().toString() : "");
        dto.put("targetSubtaskTitle",  r.getTargetSubtask() != null ? r.getTargetSubtask().getTitle() : "");
        dto.put("solver", Map.of(
                "id",          r.getSolver().getId(),
                "firstName",   r.getSolver().getFirstName(),
                "lastName",    r.getSolver().getLastName(),
                "institution", r.getSolver().getInstitution() != null ? r.getSolver().getInstitution() : "",
                "profilePictureUrl", profilePictureUrl != null ? profilePictureUrl : ""
        ));
        dto.put("problem", Map.of("id", r.getProblem().getId()));
        return dto;
    }

    private UUID extractUserId(String authHeader) {
        String token = authHeader.substring(7);
        return jwtService.extractUserId(token);
    }



}