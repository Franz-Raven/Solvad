package com.solvad.backend.problem.claim;

import com.solvad.backend.audit.AuditEventType;
import com.solvad.backend.dto.ProposalDTO;
import com.solvad.backend.entity.*;
import com.solvad.backend.profile.seeker.SeekerProfileRepository;
import com.solvad.backend.profile.seeker.SeekerProfile;
import com.solvad.backend.profile.solver.SolverProfile;
import com.solvad.backend.profile.solver.SolverProfileRepository;
import com.solvad.backend.repository.*;
import com.solvad.backend.audit.AuditService;
import com.solvad.backend.service.CloudinaryService;
import com.solvad.backend.solution.attempt.SolutionAttemptService;
import com.solvad.backend.solution.attempt.SolutionAttempt;
import com.solvad.backend.solution.attempt.SolutionAttemptRepository;
import com.solvad.backend.solution.attempt.SolutionAttemptStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

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

    // -------------------------------------------------------------------------
    // SUBMIT PROPOSAL (Solver Action)
    // Now scoped to aaa specific subtask instead of the whole problem.
    // -------------------------------------------------------------------------
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

        return savedRequest;
    }

    // -------------------------------------------------------------------------
    // EVALUATE PROPOSAL (Seeker Action)
    // Concurrency limit is now per-subtask and uses the problem's
    // seeker-configured maxConcurrentSolvers value.
    // -------------------------------------------------------------------------
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

        // Ensure the proposal has aaa target subtask
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
            return;
        }

        // Check active solvers for this specific subtask against the problem's configured limit
        int currentActiveSolvers = attemptRepository.countActiveSolversBySubtaskId(
                problem.getId(), targetSubtask.getId());

        int maxAllowed = problem.getMaxConcurrentSolvers();

        if (currentActiveSolvers >= maxAllowed) {
            throw new RuntimeException(
                    "Maximum concurrent solvers (" + maxAllowed + ") already reached for sub-problem \""
                            + targetSubtask.getTitle() + "\"."
            );
        }

        request.setStatus(ClaimRequestStatus.APPROVED);
        claimRequestRepository.save(request);

        // Delegate workspace generation to SolutionAttemptService
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

        // If capacity is now full for this subtask, cancel remaining pending proposals for it
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
        }
    }

    // -------------------------------------------------------------------------
    // GET PENDING PROPOSALS FOR A PROBLEM (Seeker Action)
    // Returns all pending proposals across all subtasks for aaa problem.
    // -------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<ClaimRequest> getPendingProposalsForProblem(UUID problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found"));

        return claimRequestRepository.findByProblemAndStatus(problem, ClaimRequestStatus.PENDING);
    }

    // -------------------------------------------------------------------------
    // GET PENDING PROPOSALS FOR A SPECIFIC SUBTASK (Seeker Action)
    // -------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<ClaimRequest> getPendingProposalsForSubtask(UUID problemId, UUID subtaskId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found"));

        ProblemSubtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new RuntimeException("Sub-problem not found"));

        return claimRequestRepository.findByProblemAndTargetSubtaskAndStatus(
                problem, subtask, ClaimRequestStatus.PENDING);
    }

    // -------------------------------------------------------------------------
    // GET MY PROPOSAL STATUS FOR A SPECIFIC SUBTASK (Solver Action)
    // -------------------------------------------------------------------------
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
}