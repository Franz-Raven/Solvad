package com.solvad.backend.service;

import com.solvad.backend.dto.ProposalDTO;
import com.solvad.backend.entity.*;
import com.solvad.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class ClaimRequestService {

    @Autowired
    private ClaimRequestRepository claimRequestRepository;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private SolverProfileRepository solverProfileRepository;

    @Autowired
    private SeekerProfileRepository seekerProfileRepository;

    @Autowired
    private SolutionAttemptRepository attemptRepository;

    @Autowired
    private SolutionAttemptService solutionAttemptService;

    @Autowired
    private AuditService auditService;

    // Concurrency limit defined in SRS 3.5
    private static final int MAX_CONCURRENT_SOLVERS = 3;

    @Transactional
    public ClaimRequest submitProposal(UUID solverUserId, ProposalDTO proposalDTO) {
        Problem problem = problemRepository.findById(proposalDTO.getProblemId())
                .orElseThrow(() -> new RuntimeException("Problem not found"));

        boolean isFork = proposalDTO.getParentAttemptId() != null;
        if (isFork) {
            if (problem.getStatus() != ProblemStatus.OPEN
                    && problem.getStatus() != ProblemStatus.SOLVED_OPEN_FOR_IMPROVEMENT) {
                throw new RuntimeException("Problem is not available for forking");
            }
        } else if (problem.getStatus() != ProblemStatus.OPEN) {
            throw new RuntimeException("Only OPEN problems can accept new proposals");
        }

        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        if (claimRequestRepository.existsByProblemIdAndSolverIdAndStatusIn(
                problem.getId(), solver.getId(), Arrays.asList(ClaimRequestStatus.PENDING, ClaimRequestStatus.APPROVED))) {
            throw new RuntimeException("You already have a pending or approved proposal for this problem.");
        }

        if (attemptRepository.existsByProblemAndSolverAndStatus(problem, solver, SolutionAttemptStatus.ACTIVE)) {
            throw new RuntimeException("You are already actively solving this problem.");
        }

        SolutionAttempt parentAttempt = null;
        if (isFork) {
            parentAttempt = attemptRepository.findById(proposalDTO.getParentAttemptId())
                    .orElseThrow(() -> new RuntimeException("Parent attempt not found"));
        }

        String docs = proposalDTO.getSupportingDocuments() != null && !proposalDTO.getSupportingDocuments().isEmpty() ?
                String.join(",", proposalDTO.getSupportingDocuments()) : null;

        ClaimRequest request = new ClaimRequest(problem, solver, proposalDTO.getProposedApproach(), docs, parentAttempt);
        ClaimRequest savedRequest = claimRequestRepository.save(request);

        String solverFullName = solver.getFirstName() + " " + solver.getLastName();

        auditService.log(
                problem.getId(),
                solverUserId,
                solverFullName,
                "SOLVER",
                AuditEventType.PROPOSAL_SUBMITTED,
                solverFullName + " submitted a proposal to solve this problem."
        );

        return savedRequest;
    }

    @Transactional
    public void evaluateProposal(UUID seekerUserId, UUID requestId, boolean isApproved) {
        ClaimRequest request = claimRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Claim request not found"));

        if (request.getStatus() != ClaimRequestStatus.PENDING) {
            throw new RuntimeException("This proposal has already been evaluated");
        }

        Problem problem = request.getProblem();
        SeekerProfile seeker = seekerProfileRepository.findByUserId(seekerUserId)
                .orElseThrow(() -> new RuntimeException("Seeker profile not found"));

        if (!problem.getSeeker().getId().equals(seeker.getId())) {
            throw new RuntimeException("You do not own this problem");
        }

        String seekerName = seeker.getOrganizationName();

        if (!isApproved) {
            request.setStatus(ClaimRequestStatus.REJECTED);
            claimRequestRepository.save(request);

            auditService.log(
                    problem.getId(),
                    seekerUserId,
                    seekerName,
                    "SEEKER",
                    AuditEventType.PROPOSAL_REJECTED,
                    seekerName + " rejected the proposal from " + request.getSolver().getFirstName()
            );
            return;
        }

        int currentActiveSolvers = attemptRepository.countActiveSolversByProblemId(problem.getId());
        if (currentActiveSolvers >= MAX_CONCURRENT_SOLVERS) {
            throw new RuntimeException("Maximum concurrent solvers limit (" + MAX_CONCURRENT_SOLVERS + ") reached for this problem.");
        }

        request.setStatus(ClaimRequestStatus.APPROVED);
        claimRequestRepository.save(request);

        // Delegate workspace generation to the SolutionAttemptService
        solutionAttemptService.initializeApprovedAttempt(request);

        auditService.log(
                problem.getId(),
                seekerUserId,
                seekerName,
                "SEEKER",
                AuditEventType.PROPOSAL_APPROVED,
                seekerName + " approved the proposal from " + request.getSolver().getFirstName()
        );

        if (currentActiveSolvers + 1 >= MAX_CONCURRENT_SOLVERS) {
            claimRequestRepository.cancelRemainingPendingRequests(problem.getId());

            auditService.log(
                    problem.getId(),
                    null,
                    "SYSTEM",
                    "SYSTEM",
                    AuditEventType.CAPACITY_REACHED,
                    "Max solver capacity (3) reached. Remaining pending proposals have been automatically cancelled."
            );
        }
    }

    @Transactional(readOnly = true)
    public List<ClaimRequest> getPendingProposalsForProblem(UUID problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found"));
        return claimRequestRepository.findByProblemAndStatus(problem, ClaimRequestStatus.PENDING);
    }
}