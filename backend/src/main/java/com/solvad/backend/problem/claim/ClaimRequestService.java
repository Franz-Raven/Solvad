package com.solvad.backend.problem.claim;

import com.solvad.backend.audit.AuditEventType;
import com.solvad.backend.problem.core.Problem;
import com.solvad.backend.problem.core.ProblemRepository;
import com.solvad.backend.problem.core.ProblemStatus;
import com.solvad.backend.problem.subtask.ProblemSubtask;
import com.solvad.backend.problem.subtask.ProblemSubtaskRepository;
import com.solvad.backend.profile.seeker.SeekerProfileRepository;
import com.solvad.backend.profile.seeker.SeekerProfile;
import com.solvad.backend.profile.solver.SolverProfile;
import com.solvad.backend.profile.solver.SolverProfileRepository;
import com.solvad.backend.audit.AuditService;
import com.solvad.backend.storage.CloudinaryService;
import com.solvad.backend.problem.solution_attempt.SolutionAttemptService;
import com.solvad.backend.problem.solution_attempt.SolutionAttempt;
import com.solvad.backend.problem.solution_attempt.SolutionAttemptRepository;
import com.solvad.backend.problem.solution_attempt.SolutionAttemptStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import java.util.stream.Collectors;
import com.solvad.backend.profile.solver.SolverProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.solvad.backend.notification.ProposalStatusChangedEvent;
import com.solvad.backend.notification.ProposalSubmittedEvent;
import org.springframework.context.ApplicationEventPublisher;


@Service
public class ClaimRequestService {

    @Autowired
    private ClaimRequestRepository claimRequestRepository;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private ProblemSubtaskRepository subtaskRepository;

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

    @Autowired
    private CloudinaryService cloudinaryService;

    @Autowired
    private ApplicationEventPublisher eventPublisher;


    @Transactional
    public ClaimRequest submitProposal(UUID solverUserId, ProposalDTO proposalDTO, List<MultipartFile> files) {
        Problem problem = problemRepository.findById(proposalDTO.getProblemId())
                .orElseThrow(() -> new RuntimeException("Problem not found"));

        // Validate subtaskId is provided
        if (proposalDTO.getSubtaskId() == null) {
            throw new RuntimeException("A specific sub-problem must be selected to submit aaa proposal.");
        }

        ProblemSubtask targetSubtask = subtaskRepository.findById(proposalDTO.getSubtaskId())
                .orElseThrow(() -> new RuntimeException("Sub-problem not found"));

        // Ensure subtask belongs to this problem
        if (!targetSubtask.getProblem().getId().equals(problem.getId())) {
            throw new RuntimeException("Sub-problem does not belong to this problem.");
        }

        boolean isFork = proposalDTO.getParentAttemptId() != null;

        // Validate problem status allows proposals
        if (isFork) {
            if (problem.getStatus() != ProblemStatus.OPEN
                    && problem.getStatus() != ProblemStatus.SOLVED_OPEN_FOR_IMPROVEMENT
                    && problem.getStatus() != ProblemStatus.IN_PROGRESS
                    && problem.getStatus() != ProblemStatus.CLAIMED) {
                throw new RuntimeException("Problem is not available for forking.");
            }
        } else {
            if (problem.getStatus() != ProblemStatus.OPEN
                    && problem.getStatus() != ProblemStatus.SOLVED_OPEN_FOR_IMPROVEMENT
                    && problem.getStatus() != ProblemStatus.IN_PROGRESS
                    && problem.getStatus() != ProblemStatus.CLAIMED) {
                throw new RuntimeException("This problem is not currently accepting proposals.");
            }
        }

        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));


        // Check if solver already has aaa pending proposal for this specific subtask
        if (claimRequestRepository.existsByProblemIdAndTargetSubtaskIdAndSolverIdAndStatusIn(
                problem.getId(),
                targetSubtask.getId(),
                solver.getId(),
                Arrays.asList(ClaimRequestStatus.PENDING))) {
            throw new RuntimeException("You already have aaa pending proposal for this sub-problem.");
        }

        // Check if solver already has an active attempt on this specific subtask
        if (attemptRepository.existsByProblemAndTargetSubtaskAndSolverAndStatus(
                problem, targetSubtask, solver, SolutionAttemptStatus.ACTIVE)) {
            throw new RuntimeException("You are already actively working on this sub-problem.");
        }

        // Validate parent attempt if forking
        SolutionAttempt parentAttempt = null;
        if (isFork) {
            parentAttempt = attemptRepository.findById(proposalDTO.getParentAttemptId())
                    .orElseThrow(() -> new RuntimeException("Parent attempt not found"));

            // Ensure the parent attempt was working on the same subtask
            if (parentAttempt.getTargetSubtask() == null ||
                    !parentAttempt.getTargetSubtask().getId().equals(targetSubtask.getId())) {
                throw new RuntimeException("Parent attempt does not belong to the selected sub-problem.");
            }
        }

        // Upload supporting documents to Cloudinary
        List<String> fileUrls = new ArrayList<>();
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    String url = cloudinaryService.uploadFile(
                            file,
                            "proposals/" + problem.getId() + "/" + targetSubtask.getId()
                    );
                    fileUrls.add(url);
                }
            }
        }

        String docs = fileUrls.isEmpty() ? null : String.join(",", fileUrls);

        ClaimRequest request = new ClaimRequest(
                problem,
                solver,
                proposalDTO.getProposedApproach(),
                docs,
                parentAttempt
        );
        request.setTargetSubtask(targetSubtask);

        ClaimRequest savedRequest = claimRequestRepository.save(request);

        String solverFullName = solver.getFirstName() + " " + solver.getLastName();

        auditService.log(
                problem.getId(),
                solverUserId,
                solverFullName,
                "SOLVER",
                AuditEventType.PROPOSAL_SUBMITTED,
                solverFullName + " submitted aaa proposal for sub-problem \""
                        + targetSubtask.getTitle() + "\"."
        );

        eventPublisher.publishEvent(new ProposalSubmittedEvent(
                savedRequest.getId(),
                problem.getId(),
                problem.getTitle(),
                problem.getSeeker().getUser().getId(),
                solverUserId,
                solverFullName
        ));

        return savedRequest;
    }

    @Transactional
    public void evaluateProposal(UUID seekerUserId, UUID requestId, boolean isApproved) {
        ClaimRequest request = claimRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Claim request not found"));

        if (request.getStatus() != ClaimRequestStatus.PENDING) {
            throw new RuntimeException("This proposal has already been evaluated.");
        }

        Problem problem = request.getProblem();

        SeekerProfile seeker = seekerProfileRepository.findByUserId(seekerUserId)
                .orElseThrow(() -> new RuntimeException("Seeker profile not found"));

        if (!problem.getSeeker().getId().equals(seeker.getId())) {
            throw new RuntimeException("You do not own this problem.");
        }

        // Ensure the proposal has a target subtask
        ProblemSubtask targetSubtask = request.getTargetSubtask();
        if (targetSubtask == null) {
            throw new RuntimeException("This proposal has no associated sub-problem.");
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
                    seekerName + " rejected the proposal from "
                            + request.getSolver().getFirstName()
                            + " for sub-problem \"" + targetSubtask.getTitle() + "\"."
            );

            publishProposalDecision(request, problem, "REJECTED");

            return;
        }

        int currentActiveSolvers = attemptRepository.countActiveSolversBySubtaskId(
                problem.getId(), targetSubtask.getId());


        int maxAllowed = targetSubtask.getMaxConcurrentSolvers() != null ? targetSubtask.getMaxConcurrentSolvers() : 3;

        if (currentActiveSolvers >= maxAllowed) {
            throw new RuntimeException(
                    "Maximum concurrent solvers (" + maxAllowed + ") already reached for sub-problem \""
                            + targetSubtask.getTitle() + "\"."
            );
        }

        request.setStatus(ClaimRequestStatus.APPROVED);
        claimRequestRepository.save(request);


        solutionAttemptService.initializeApprovedAttempt(request);

        auditService.log(
                problem.getId(),
                seekerUserId,
                seekerName,
                "SEEKER",
                AuditEventType.PROPOSAL_APPROVED,
                seekerName + " approved the proposal from "
                        + request.getSolver().getFirstName()
                        + " for sub-problem \"" + targetSubtask.getTitle() + "\"."
        );


        if (currentActiveSolvers + 1 >= maxAllowed) {
            claimRequestRepository.cancelRemainingPendingRequestsForSubtask(
                    problem.getId(), targetSubtask.getId());

            auditService.log(
                    problem.getId(),
                    null,
                    "SYSTEM",
                    "SYSTEM",
                    AuditEventType.CAPACITY_REACHED,
                    "Max solver capacity (" + maxAllowed + ") reached for sub-problem \""
                            + targetSubtask.getTitle()
                            + "\". Remaining pending proposals automatically cancelled."
            );

            // Check if ALL subtasks for this problem are now completely full
            List<ProblemSubtask> allSubtasks = subtaskRepository.findByProblem(problem);
            boolean allSubtasksFull = true;

            for (ProblemSubtask st : allSubtasks) {
                int activeCount = attemptRepository.countActiveSolversBySubtaskId(problem.getId(), st.getId());
                int limit = st.getMaxConcurrentSolvers() != null ? st.getMaxConcurrentSolvers() : 3;

                if (activeCount < limit) {
                    allSubtasksFull = false;
                    break;
                }
            }


            if (allSubtasksFull && problem.getStatus() == ProblemStatus.OPEN) {
                problem.setStatus(ProblemStatus.IN_PROGRESS);
                problemRepository.save(problem);

                auditService.log(
                        problem.getId(), null, "SYSTEM", "SYSTEM", AuditEventType.STATUS_CHANGED,
                        "All sub-problems have reached maximum capacity. Problem automatically moved to IN_PROGRESS."
                );
            }
        }

        publishProposalDecision(request, problem, "APPROVED");
    }

    @Transactional(readOnly = true)
    public PaginatedClaimsResponse getPendingWorkspaceClaims(UUID solverId, int page, int size) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        // 🚀 FIX: Used ClaimRequestStatus to match your actual Enum
        Page<ClaimRequest> claimPage = claimRequestRepository.findBySolverAndStatus(solver, ClaimRequestStatus.PENDING, pageable);

        List<ClaimSummaryResponse> summaries = claimPage.getContent().stream()
                .map(claim -> new ClaimSummaryResponse(
                        claim.getId(),
                        claim.getProblem().getId(),
                        claim.getProblem().getTitle(),
                        // 🚀 FIX: Used getTargetSubtask() to match your entity schema
                        claim.getTargetSubtask() != null ? claim.getTargetSubtask().getId() : null,
                        claim.getTargetSubtask() != null ? claim.getTargetSubtask().getTitle() : null,
                        claim.getStatus().name(),
                        claim.getCreatedAt()
                ))
                .collect(Collectors.toList());

        return new PaginatedClaimsResponse(summaries, claimPage.getNumber(), claimPage.getTotalPages(), claimPage.getTotalElements(), claimPage.getSize());
    }

    @Transactional(readOnly = true)
    public PaginatedClaimsResponse getHistoryWorkspaceClaims(UUID solverUserId, int page, int size) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ClaimRequest> claimPage = claimRequestRepository.findBySolverAndStatusIn(
                solver, List.of(ClaimRequestStatus.REJECTED, ClaimRequestStatus.CANCELLED), pageable);

        List<ClaimSummaryResponse> summaries = claimPage.getContent().stream()
                .map(claim -> new ClaimSummaryResponse(
                        claim.getId(),
                        claim.getProblem().getId(),
                        claim.getProblem().getTitle(),
                        claim.getTargetSubtask() != null ? claim.getTargetSubtask().getId() : null,
                        claim.getTargetSubtask() != null ? claim.getTargetSubtask().getTitle() : null,
                        claim.getStatus().name(),
                        claim.getCreatedAt()))
                .collect(Collectors.toList());

        return new PaginatedClaimsResponse(summaries, claimPage.getNumber(),
                claimPage.getTotalPages(), claimPage.getTotalElements(), claimPage.getSize());
    }

    @Transactional(readOnly = true)
    public List<ClaimRequest> getPendingProposalsForProblem(UUID problemId) {
        // Fetch the problem first to ensure it exists
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found"));

        // Return the list of pending claims for this specific problem
        return claimRequestRepository.findByProblemAndStatus(problem, ClaimRequestStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public List<ClaimRequest> getPendingProposalsForSubtask(UUID problemId, UUID subtaskId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found"));

        ProblemSubtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new RuntimeException("Sub-problem not found"));

        return claimRequestRepository.findByProblemAndTargetSubtaskAndStatus(
                problem, subtask, ClaimRequestStatus.PENDING);
    }


    @Transactional(readOnly = true)
    public Optional<ClaimRequestStatus> getMyProposalStatus(UUID solverUserId, UUID problemId, UUID subtaskId) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        return claimRequestRepository
                .findTopByProblemIdAndTargetSubtaskIdAndSolverIdOrderByCreatedAtDesc(
                        problemId, subtaskId, solver.getId())
                .map(ClaimRequest::getStatus)
                .filter(s -> s == ClaimRequestStatus.PENDING);
    }

    // LEGACY: GET MY PROPOSAL STATUS FOR A WHOLE PROBLEM
    @Transactional(readOnly = true)
    public Optional<ClaimRequestStatus> getMyProposalStatusForProblem(UUID solverUserId, UUID problemId) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        return claimRequestRepository
                .findTopByProblemIdAndSolverIdOrderByCreatedAtDesc(problemId, solver.getId())
                .map(ClaimRequest::getStatus)
                .filter(s -> s == ClaimRequestStatus.PENDING); // Removed the APPROVED check
    }

    @Transactional(readOnly = true)
    public ClaimDetailResponse getClaimDetails(UUID claimId, UUID solverUserId) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver not found"));

        ClaimRequest claim = claimRequestRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Proposal not found"));

        if (!claim.getSolver().getId().equals(solver.getId())) {
            throw new RuntimeException("Unauthorized access to this proposal");
        }

        return new ClaimDetailResponse(
                claim.getId(),
                claim.getProblem().getId(),
                claim.getProblem().getTitle(),
                claim.getTargetSubtask() != null ? claim.getTargetSubtask().getTitle() : null,
                claim.getStatus().name(),
                claim.getCreatedAt(),
                claim.getProposedApproach(),
                claim.getSupportingDocuments()
        );
    }

    private void publishProposalDecision(ClaimRequest request, Problem problem, String newStatus) {
        SolverProfile solver = request.getSolver();
        eventPublisher.publishEvent(new ProposalStatusChangedEvent(
                request.getId(),
                problem.getId(),
                problem.getTitle(),
                solver.getUser().getId(),
                solver.getFirstName() + " " + solver.getLastName(),
                solver.getUser().getEmail(),
                newStatus
        ));
    }
}