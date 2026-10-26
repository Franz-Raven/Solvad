package com.solvad.backend.problem.solution_attempt;

import com.solvad.backend.audit.AuditEventType;
import com.solvad.backend.problem.attachment.ProblemAttachmentRepository;
import com.solvad.backend.problem.attachment.AttachmentRequirementResponse;
import com.solvad.backend.problem.claim.ClaimDetailResponse;
import com.solvad.backend.problem.claim.ClaimRequestRepository;
import com.solvad.backend.problem.claim.ClaimRequestStatus;
import com.solvad.backend.problem.core.ProblemResponse;
import com.solvad.backend.problem.claim.ClaimRequest;
import com.solvad.backend.problem.core.Problem;
import com.solvad.backend.problem.core.ProblemRepository;
import com.solvad.backend.problem.core.ProblemStatus;
import com.solvad.backend.problem.subtask.*;
import com.solvad.backend.profile.seeker.SeekerProfileRepository;
import com.solvad.backend.profile.seeker.SeekerProfile;
import com.solvad.backend.profile.solver.SolverProfile;
import com.solvad.backend.profile.solver.SolverProfileRepository;
import com.solvad.backend.audit.AuditService;
import com.solvad.backend.storage.CloudinaryService;
import com.solvad.backend.problem.similarity.MatchmakingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SolutionAttemptService {

    @Autowired
    private SolutionAttemptRepository attemptRepository;

    @Autowired
    private SubtaskSubmissionRepository submissionRepository;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private ProblemSubtaskRepository subtaskRepository;

    @Autowired
    private SolverProfileRepository solverProfileRepository;

    @Autowired
    private SeekerProfileRepository seekerProfileRepository;

    @Autowired
    private ProblemAttachmentRepository attachmentRepository;

    @Autowired
    private CloudinaryService storageService;

    @Autowired
    private AuditService auditService;

    @Autowired
    private ClaimRequestRepository claimRequestRepository;

    private SolutionAttemptResponse mapToResponse(SolutionAttempt attempt, List<SubtaskSubmission> submissions, UUID currentUserId) {
        List<SubtaskSubmissionResponse> submissionResponses = submissions.stream().map(sub -> mapSubmissionToResponse(sub, currentUserId)).collect(Collectors.toList());
        SolverProfile solver = attempt.getSolver();
        String profilePictureUrl = solver.getUser().getProfileUrl();
        UUID parentId = attempt.getParentAttempt() != null ? attempt.getParentAttempt().getId() : null;
        String parentName = attempt.getParentAttempt() != null ? attempt.getParentAttempt().getSolver().getFirstName() + " " + attempt.getParentAttempt().getSolver().getLastName() : null;
        UUID targetSubtaskId = attempt.getTargetSubtask() != null ? attempt.getTargetSubtask().getId() : null;
        String targetSubtaskTitle = attempt.getTargetSubtask() != null ? attempt.getTargetSubtask().getTitle() : null;
        String parentDesc = null;
        List<String> parentFiles = new ArrayList<>();
        if (attempt.getParentAttempt() != null && attempt.getTargetSubtask() != null) {
            Optional<SubtaskSubmission> parentSub = submissionRepository.findByAttemptAndSubtask(attempt.getParentAttempt(), attempt.getTargetSubtask());
            if (parentSub.isPresent()) {
                parentDesc = parentSub.get().getDescription();
                parentFiles = parentSub.get().getFileUrlsAsList();
            }
        }
        String seekerName = null;
        String seekerProfileUrl = null;
        if (attempt.getProblem() != null && attempt.getProblem().getSeeker() != null) {
            seekerName = attempt.getProblem().getSeeker().getOrganizationName();
            if (attempt.getProblem().getSeeker().getUser() != null) seekerProfileUrl = attempt.getProblem().getSeeker().getUser().getProfileUrl();
        }
        return new SolutionAttemptResponse(
                attempt.getId(), attempt.getProblem().getId(), attempt.getProblem().getTitle(),
                solver.getId(), solver.getFirstName(), solver.getLastName(), profilePictureUrl,
                solver.getInstitution(), solver.getDegreeProgram(), attempt.getStatus().name(),
                submissionResponses, attempt.getClaimedAt(), attempt.getUpdatedAt(), attempt.getCompletedAt(),
                parentId, parentName, targetSubtaskId, targetSubtaskTitle, parentDesc, parentFiles,
                seekerName, seekerProfileUrl, attempt.getRejectionReason() // 🚀 MAP IT HERE
        );
    }

    private SolutionAttemptSummaryResponse mapToSummaryResponse(SolutionAttempt attempt) {
        String parentName = null;
        UUID parentId = null;
        if (attempt.getParentAttempt() != null) {
            parentName = attempt.getParentAttempt().getSolver().getFirstName() + " " + attempt.getParentAttempt().getSolver().getLastName();
            parentId = attempt.getParentAttempt().getId();
        }

        UUID subtaskId = attempt.getTargetSubtask() != null ? attempt.getTargetSubtask().getId() : null;
        String subtaskTitle = attempt.getTargetSubtask() != null ? attempt.getTargetSubtask().getTitle() : null;

        String seekerOrgName = null;
        String seekerProfileUrl = null;
        if (attempt.getProblem() != null && attempt.getProblem().getSeeker() != null) {
            SeekerProfile seeker = attempt.getProblem().getSeeker();
            seekerOrgName = seeker.getOrganizationName();
            if (seeker.getUser() != null) seekerProfileUrl = seeker.getUser().getProfileUrl();
        }

        String solverProfileUrl = attempt.getSolver().getUser() != null ? attempt.getSolver().getUser().getProfileUrl() : null;

        return new SolutionAttemptSummaryResponse(
                attempt.getId(), attempt.getProblem().getId(), attempt.getProblem().getTitle(),
                attempt.getSolver().getFirstName(), attempt.getSolver().getLastName(), solverProfileUrl,
                attempt.getSolver().getInstitution(), attempt.getSolver().getDegreeProgram(),
                attempt.getStatus().name(),
                attempt.getSubmissions() != null ? attempt.getSubmissions().size() : 0,
                attempt.getClaimedAt(), attempt.getUpdatedAt(), attempt.getCompletedAt(),
                parentId, parentName, subtaskId, subtaskTitle, seekerOrgName, seekerProfileUrl
        );
    }

    private SubtaskSubmissionResponse mapSubmissionToResponse(SubtaskSubmission submission, UUID currentUserId) {
        UUID ownerUserId = submission.getAttempt().getSolver().getUser().getId();
        boolean isOwner = currentUserId != null && currentUserId.equals(ownerUserId);
        boolean isDraft = submission.getStatus() == SubtaskSubmissionStatus.DRAFT;

        // 🚀 FIX: Check if the overarching attempt is in a terminal state
        SolutionAttemptStatus attemptStatus = submission.getAttempt().getStatus();
        boolean isTerminal = attemptStatus == SolutionAttemptStatus.TERMINATED ||
                attemptStatus == SolutionAttemptStatus.REJECTED ||
                attemptStatus == SolutionAttemptStatus.ABANDONED;

        // 🚀 FIX: Only hide the draft if it's NOT terminal
        boolean hideDraft = isDraft && !isOwner && !isTerminal;

        return new SubtaskSubmissionResponse(
                submission.getId(), submission.getSubtask().getId(), submission.getSubtask().getTitle(),
                submission.getSubtask().getDepartmentFocus(),
                hideDraft ? "Confidential Workspace: The solver is actively drafting a solution." : submission.getDescription(),
                hideDraft ? Collections.emptyList() : submission.getFileUrlsAsList(),
                submission.getStatus().name(), submission.getCreatedAt(), submission.getUpdatedAt(),
                submission.getSubmittedAt(), hideDraft ? null : submission.getDeltaDescription()
        );
    }

    private ProblemResponse mapProblemToResponse(Problem problem, List<ProblemSubtask> subtasks) {
        List<SubtaskResponse> subtaskResponses = subtasks.stream().map(s -> {
            List<AttachmentRequirementResponse> attachments = attachmentRepository.findBySubtask(s).stream()
                    .map(att -> new AttachmentRequirementResponse(att.getId(), att.getAttachmentTitle(), att.getAttachmentType()))
                    .collect(Collectors.toList());
            return new SubtaskResponse(s.getId(), s.getTitle(), s.getDepartmentFocus(), s.getSdgFocus(), s.getDescription(), attachments);
        }).collect(Collectors.toList());

        List<String> tags = problem.getTags() != null ? problem.getTags() : MatchmakingService.buildTagsForProblem(problem, subtasks);

        return new ProblemResponse(
                problem.getId(), problem.getTitle(), problem.getBackgroundContext(), problem.getPrimaryStatement(),
                problem.getObjectives(), problem.getConstraints(), problem.getPreferredProgram(), problem.getSdgFocus(),
                problem.getStatus().name(), problem.getSeeker().getId(), problem.getSeeker().getOrganizationName(),
                problem.getCreatedAt(), subtaskResponses, tags, problem.getProblemDocumentUrl(), problem.getMaxConcurrentSolvers()
        );
    }

    @Transactional
    public SolutionAttemptResponse initializeApprovedAttempt(ClaimRequest request) {
        Problem problem = request.getProblem();
        SolverProfile solver = request.getSolver();
        ProblemSubtask targetSubtask = request.getTargetSubtask();

        if (targetSubtask == null) throw new RuntimeException("Claim request has no target sub-problem.");

        SolutionAttempt attempt = new SolutionAttempt(problem, solver);
        attempt.setTargetSubtask(targetSubtask);
        String solverFullName = solver.getFirstName() + " " + solver.getLastName();
        UUID solverUserId = solver.getUser().getId();

        if (request.getParentAttempt() != null) {
            SolutionAttempt parent = request.getParentAttempt();
            attempt.setParentAttempt(parent);
            SolutionAttempt savedAttempt = attemptRepository.save(attempt);

            List<SubtaskSubmission> parentSubmissions = submissionRepository.findByAttempt(parent);
            for (SubtaskSubmission parentSub : parentSubmissions) {
                if (parentSub.getStatus() == SubtaskSubmissionStatus.SUBMITTED && parentSub.getSubtask().getId().equals(targetSubtask.getId())) {
                    SubtaskSubmission newDraft = new SubtaskSubmission(savedAttempt, parentSub.getSubtask());
                    newDraft.setStatus(SubtaskSubmissionStatus.DRAFT);
                    submissionRepository.save(newDraft);
                }
            }

            String parentName = parent.getSolver().getFirstName() + " " + parent.getSolver().getLastName();
            auditService.log(problem.getId(), solverUserId, solverFullName, "SOLVER", AuditEventType.ATTEMPT_FORKED,
                    solverFullName + "'s proposal was approved. Forked workspace created for sub-problem \"" + targetSubtask.getTitle() + "\" based on " + parentName + "'s attempt.");
            return mapToResponse(savedAttempt, submissionRepository.findByAttempt(savedAttempt), solverUserId);
        } else {
            SolutionAttempt savedAttempt = attemptRepository.save(attempt);
            auditService.log(problem.getId(), solverUserId, solverFullName, "SOLVER", AuditEventType.ATTEMPT_CLAIMED,
                    solverFullName + "'s proposal was approved. Active workspace created for sub-problem \"" + targetSubtask.getTitle() + "\".");
            return mapToResponse(savedAttempt, submissionRepository.findByAttempt(savedAttempt), solverUserId);
        }
    }

    public SolutionAttemptResponse getMyAttempt(UUID solverUserId, UUID problemId) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId).orElseThrow(() -> new RuntimeException("Solver profile not found"));
        SolutionAttempt targetAttempt = attemptRepository.findBySolverOrderByClaimedAtDesc(solver).stream()
                .filter(a -> a.getProblem().getId().equals(problemId)).findFirst()
                .orElseThrow(() -> new RuntimeException("No active attempt found"));
        return mapToResponse(targetAttempt, submissionRepository.findByAttempt(targetAttempt), solverUserId);
    }

    @Transactional(readOnly = true)
    public List<SolutionAttemptResponse> getMyAttempts(UUID solverUserId) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId).orElseThrow(() -> new RuntimeException("Solver profile not found"));
        List<SolutionAttempt> attempts = attemptRepository.findBySolverOrderByClaimedAtDesc(solver);
        if (attempts.isEmpty()) return Collections.emptyList();

        List<SubtaskSubmission> allSubmissions = submissionRepository.findByAttemptIn(attempts);
        Map<UUID, List<SubtaskSubmission>> submissionsByAttemptId = allSubmissions.stream().collect(Collectors.groupingBy(sub -> sub.getAttempt().getId()));

        return attempts.stream().map(attempt -> mapToResponse(attempt, submissionsByAttemptId.getOrDefault(attempt.getId(), new ArrayList<>()), solverUserId)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SolutionAttemptResponse> getAttemptsForSubtask(UUID problemId, UUID subtaskId, UUID currentUserId) {
        List<SolutionAttempt> attempts = attemptRepository.findByProblemIdAndTargetSubtaskIdOrderByClaimedAtAsc(problemId, subtaskId);
        if (attempts.isEmpty()) return Collections.emptyList();

        List<SubtaskSubmission> allSubmissions = submissionRepository.findByAttemptIn(attempts);
        Map<UUID, List<SubtaskSubmission>> submissionsByAttemptId = allSubmissions.stream().collect(Collectors.groupingBy(sub -> sub.getAttempt().getId()));

        return attempts.stream().map(attempt -> mapToResponse(attempt, submissionsByAttemptId.getOrDefault(attempt.getId(), new ArrayList<>()), currentUserId)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SolutionAttemptResponse> getAllAttemptsForProblem(UUID problemId, UUID currentUserId) {
        Problem problem = problemRepository.findById(problemId).orElseThrow(() -> new RuntimeException("Problem not found"));
        List<SolutionAttempt> attempts = attemptRepository.findByProblemOrderByClaimedAtDesc(problem);
        if (attempts.isEmpty()) return Collections.emptyList();

        List<SubtaskSubmission> allSubmissions = submissionRepository.findByAttemptIn(attempts);
        Map<UUID, List<SubtaskSubmission>> submissionsByAttemptId = allSubmissions.stream().collect(Collectors.groupingBy(sub -> sub.getAttempt().getId()));

        return attempts.stream().map(attempt -> mapToResponse(attempt, submissionsByAttemptId.getOrDefault(attempt.getId(), new ArrayList<>()), currentUserId)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SolutionAttemptResponse getAttemptById(UUID attemptId, UUID currentUserId) {
        SolutionAttempt attempt = attemptRepository.findById(attemptId).orElseThrow(() -> new RuntimeException("Attempt not found"));
        return mapToResponse(attempt, submissionRepository.findByAttempt(attempt), currentUserId);
    }

    @Transactional(readOnly = true)
    public List<ProblemResponse> getOpenProblems() {
        List<ProblemStatus> visibleStatuses = Arrays.asList(ProblemStatus.OPEN, ProblemStatus.CLAIMED, ProblemStatus.IN_PROGRESS, ProblemStatus.SOLVED_OPEN_FOR_IMPROVEMENT);
        return problemRepository.findByStatusIn(visibleStatuses).stream()
                .map(problem -> mapProblemToResponse(problem, subtaskRepository.findByProblem(problem)))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PaginatedAttemptsResponse getWorkspaceAttempts(UUID solverId, String tab, int page, int size) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverId).orElseThrow(() -> new RuntimeException("Solver profile not found"));
        Pageable pageable = PageRequest.of(page, size);
        Page<SolutionAttempt> attemptPage;

        if ("HISTORY".equalsIgnoreCase(tab)) {
            // 🚀 Added SolutionAttemptStatus.REJECTED to the History tab query
            attemptPage = attemptRepository.findBySolverAndStatusInOrderByUpdatedAtDesc(
                    solver,
                    List.of(SolutionAttemptStatus.COMPLETED, SolutionAttemptStatus.ABANDONED, SolutionAttemptStatus.TERMINATED, SolutionAttemptStatus.REJECTED),
                    pageable
            );
        } else if ("ACTIVE".equalsIgnoreCase(tab)) {
            attemptPage = attemptRepository.findBySolverAndStatusInOrderByUpdatedAtDesc(solver, List.of(SolutionAttemptStatus.ACTIVE, SolutionAttemptStatus.PENDING_REVIEW), pageable);
        } else {
            attemptPage = attemptRepository.findBySolverAndStatusOrderByUpdatedAtDesc(solver, SolutionAttemptStatus.PENDING_REVIEW, pageable);
        }

        List<SolutionAttemptSummaryResponse> summaries = attemptPage.getContent().stream().map(this::mapToSummaryResponse).collect(Collectors.toList());
        return new PaginatedAttemptsResponse(summaries, attemptPage.getNumber(), attemptPage.getTotalPages(), attemptPage.getTotalElements(), attemptPage.getSize());
    }

    @Transactional
    public SubtaskSubmissionResponse deleteFileFromSubmission(UUID solverUserId, UUID submissionId, String fileUrl) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId).orElseThrow(() -> new RuntimeException("Solver profile not found"));
        SubtaskSubmission submission = submissionRepository.findById(submissionId).orElseThrow(() -> new RuntimeException("Submission not found"));

        if (!submission.getAttempt().getSolver().getId().equals(solver.getId())) throw new RuntimeException("You do not own this submission.");
        if (submission.getStatus() == SubtaskSubmissionStatus.SUBMITTED) throw new RuntimeException("Cannot modify a submitted submission.");

        List<String> urls = new ArrayList<>(submission.getFileUrlsAsList());
        urls.remove(fileUrl);
        submission.setFileUrls(urls.isEmpty() ? null : String.join(",", urls));

        submissionRepository.save(submission);
        storageService.deleteFile(fileUrl);
        return mapSubmissionToResponse(submission, solverUserId);
    }

    @Transactional
    public void markAsSolved(UUID seekerUserId, UUID problemId) {
        Problem problem = problemRepository.findById(problemId).orElseThrow(() -> new RuntimeException("Problem not found"));
        SeekerProfile seeker = seekerProfileRepository.findByUserId(seekerUserId).orElseThrow(() -> new RuntimeException("Seeker profile not found"));

        if (!problem.getSeeker().getId().equals(seeker.getId())) throw new RuntimeException("You do not own this problem.");

        List<SolutionAttempt> activeAttempts = attemptRepository.findByProblemAndStatus(problem, SolutionAttemptStatus.ACTIVE);
        for (SolutionAttempt attempt : activeAttempts) {
            attempt.setStatus(SolutionAttemptStatus.COMPLETED);
            attempt.setCompletedAt(LocalDateTime.now());
            attemptRepository.save(attempt);
        }

        problem.setStatus(ProblemStatus.SOLVED_OPEN_FOR_IMPROVEMENT);
        problemRepository.save(problem);
        auditService.log(problem.getId(), seekerUserId, seeker.getOrganizationName(), "SEEKER", AuditEventType.STATUS_CHANGED, "Problem marked as Solved by " + seeker.getOrganizationName() + " and left open for improvement.");
    }

    @Transactional
    public SubtaskSubmissionResponse saveSubtaskDraft(UUID solverUserId, UUID attemptId, UUID subtaskId, String description, List<MultipartFile> files, String deltaDescription) {
        return processSubtask(solverUserId, attemptId, subtaskId, description, files, deltaDescription, false);
    }

    @Transactional
    public SubtaskSubmissionResponse lockAndSubmitSubtask(UUID solverUserId, UUID attemptId, UUID subtaskId, String description, List<MultipartFile> files, String deltaDescription) {
        return processSubtask(solverUserId, attemptId, subtaskId, description, files, deltaDescription, true);
    }

    private SubtaskSubmissionResponse processSubtask(UUID solverUserId, UUID attemptId, UUID subtaskId, String description, List<MultipartFile> files, String deltaDescription, boolean isSubmitting) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId).orElseThrow(() -> new RuntimeException("Solver profile not found"));
        SolutionAttempt attempt = attemptRepository.findById(attemptId).orElseThrow(() -> new RuntimeException("Solution attempt not found"));

        if (!attempt.getSolver().getId().equals(solver.getId())) throw new RuntimeException("You do not own this solution attempt.");
        if (attempt.getStatus() != SolutionAttemptStatus.ACTIVE) throw new RuntimeException("This attempt is no longer active.");

        ProblemSubtask subtask = subtaskRepository.findById(subtaskId).orElseThrow(() -> new RuntimeException("Sub-problem not found"));
        if (attempt.getTargetSubtask() != null && !attempt.getTargetSubtask().getId().equals(subtask.getId())) throw new RuntimeException("This workspace is scoped to sub-problem \"" + attempt.getTargetSubtask().getTitle() + "\".");

        SubtaskSubmission submission = submissionRepository.findByAttemptAndSubtask(attempt, subtask).orElseGet(() -> new SubtaskSubmission(attempt, subtask));
        if (submission.getStatus() == SubtaskSubmissionStatus.SUBMITTED) throw new RuntimeException("This sub-problem has already been submitted and cannot be edited.");

        int newFileCount = 0;
        if (files != null && !files.isEmpty()) {
            List<String> newUrls = new ArrayList<>(submission.getFileUrlsAsList());
            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    newUrls.add(storageService.uploadFile(file, attemptId + "/" + subtaskId));
                    newFileCount++;
                }
            }
            submission.setFileUrls(String.join(",", newUrls));
        }

        submission.setDescription(description);
        submission.setDeltaDescription(deltaDescription);
        String solverFullName = solver.getFirstName() + " " + solver.getLastName();

        if (isSubmitting) {
            submission.setStatus(SubtaskSubmissionStatus.SUBMITTED);
            submission.setSubmittedAt(LocalDateTime.now());
            String msg = "Sub-problem \"" + subtask.getTitle() + "\" submitted by " + solverFullName;
            if (deltaDescription != null && !deltaDescription.isBlank()) msg += " — Delta: " + deltaDescription;
            if (newFileCount > 0) msg += " (" + newFileCount + " file(s) attached)";
            auditService.log(attempt.getProblem().getId(), solverUserId, solverFullName, "SOLVER", AuditEventType.SUBTASK_SUBMITTED, msg);
            attemptRepository.save(attempt);
        } else {
            submission.setStatus(SubtaskSubmissionStatus.DRAFT);
            if (newFileCount > 0) auditService.log(attempt.getProblem().getId(), solverUserId, solverFullName, "SOLVER", AuditEventType.FILE_UPLOADED, solverFullName + " uploaded " + newFileCount + " file(s) to sub-problem \"" + subtask.getTitle() + "\".");
        }

        return mapSubmissionToResponse(submissionRepository.save(submission), solverUserId);
    }

    @Transactional
    public void abandonAttempt(UUID solverUserId, UUID attemptId) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId).orElseThrow(() -> new RuntimeException("Solver profile not found"));
        SolutionAttempt attempt = attemptRepository.findById(attemptId).orElseThrow(() -> new RuntimeException("Solution attempt not found"));

        if (!attempt.getSolver().getId().equals(solver.getId())) throw new RuntimeException("You do not own this attempt.");
        if (attempt.getStatus() != SolutionAttemptStatus.ACTIVE) throw new RuntimeException("Attempt is not active.");

        attempt.setStatus(SolutionAttemptStatus.ABANDONED);
        attemptRepository.save(attempt);

        String solverFullName = solver.getFirstName() + " " + solver.getLastName();
        String subtaskTitle = attempt.getTargetSubtask() != null ? attempt.getTargetSubtask().getTitle() : "unknown sub-problem";
        auditService.log(attempt.getProblem().getId(), solverUserId, solverFullName, "SOLVER", AuditEventType.ATTEMPT_ABANDONED, solverFullName + " abandoned their attempt on sub-problem \"" + subtaskTitle + "\".");

        if (attemptRepository.countByProblemAndStatus(attempt.getProblem(), SolutionAttemptStatus.ACTIVE) == 0 && attempt.getProblem().getStatus() != ProblemStatus.SOLVED_OPEN_FOR_IMPROVEMENT) {
            attempt.getProblem().setStatus(ProblemStatus.OPEN);
            problemRepository.save(attempt.getProblem());
            auditService.log(attempt.getProblem().getId(), null, "SYSTEM", "SYSTEM", AuditEventType.STATUS_CHANGED, "Status automatically changed back to OPEN — no active attempts remain.");
        }
    }

    // 🚀 RESTORED AND FIXED: Uses PENDING_REVIEW instead of COMPLETED
    @Transactional
    public SolutionAttemptResponse finalizeAttempt(UUID solverUserId, UUID attemptId) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId).orElseThrow(() -> new RuntimeException("Solver profile not found"));
        SolutionAttempt attempt = attemptRepository.findById(attemptId).orElseThrow(() -> new RuntimeException("Attempt not found"));

        if (!attempt.getSolver().getId().equals(solver.getId())) throw new RuntimeException("You do not own this attempt.");
        if (attempt.getStatus() == SolutionAttemptStatus.COMPLETED || attempt.getStatus() == SolutionAttemptStatus.PENDING_REVIEW) {
            throw new RuntimeException("This attempt has already been submitted.");
        }

        List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(attempt);
        boolean hasSubmitted = submissions.stream().anyMatch(sub -> sub.getStatus() == SubtaskSubmissionStatus.SUBMITTED);

        if (!hasSubmitted) throw new RuntimeException("You must submit your sub-problem solution before finalizing.");

        attempt.setStatus(SolutionAttemptStatus.PENDING_REVIEW);
        attempt.setCompletedAt(LocalDateTime.now());
        SolutionAttempt savedAttempt = attemptRepository.save(attempt);

        String solverFullName = solver.getFirstName() + " " + solver.getLastName();
        String subtaskTitle = attempt.getTargetSubtask() != null ? attempt.getTargetSubtask().getTitle() : "sub-problem";

        auditService.log(attempt.getProblem().getId(), solverUserId, solverFullName, "SOLVER", AuditEventType.ATTEMPT_COMPLETED,
                solverFullName + " finalized and submitted their attempt for sub-problem \"" + subtaskTitle + "\" and is awaiting seeker approval.");

        return mapToResponse(savedAttempt, submissions, solverUserId);
    }

    @Transactional(readOnly = true)
    public ActiveAttemptsCountResponse getMyActiveAttemptsCount(UUID solverUserId) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId).orElseThrow(() -> new RuntimeException("Solver profile not found"));
        return new ActiveAttemptsCountResponse(attemptRepository.countBySolverAndStatus(solver, SolutionAttemptStatus.ACTIVE));
    }

    @Transactional(readOnly = true)
    public ClaimDetailResponse getClaimDetails(UUID claimId, UUID solverUserId) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId).orElseThrow(() -> new RuntimeException("Solver not found"));
        ClaimRequest claim = claimRequestRepository.findById(claimId).orElseThrow(() -> new RuntimeException("Proposal not found"));

        if (!claim.getSolver().getId().equals(solver.getId())) throw new RuntimeException("Unauthorized access to this proposal");

        return new ClaimDetailResponse(claim.getId(), claim.getProblem().getId(), claim.getProblem().getTitle(),
                claim.getTargetSubtask() != null ? claim.getTargetSubtask().getTitle() : null,
                claim.getStatus().name(), claim.getCreatedAt(), claim.getProposedApproach(), claim.getSupportingDocuments());
    }

    @Transactional(readOnly = true)
    public AttemptDetailResponse getAttemptDetails(UUID attemptId, UUID solverUserId) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId).orElseThrow(() -> new RuntimeException("Solver not found"));
        SolutionAttempt attempt = attemptRepository.findById(attemptId).orElseThrow(() -> new RuntimeException("Attempt not found"));

        if (!attempt.getSolver().getId().equals(solver.getId())) throw new RuntimeException("Unauthorized access to this attempt");

        String summary = "No submissions recorded.";
        List<String> attachedFiles = new ArrayList<>();
        String deltaDescription = null; // 🚀 ADDED

        if (attempt.getSubmissions() != null && !attempt.getSubmissions().isEmpty()) {
            SubtaskSubmission latestSubmission = attempt.getSubmissions().get(attempt.getSubmissions().size() - 1);
            summary = latestSubmission.getDescription();
            attachedFiles = latestSubmission.getFileUrlsAsList();
            deltaDescription = latestSubmission.getDeltaDescription(); // 🚀 EXTRACT DELTA
        }

        return new AttemptDetailResponse(
                attempt.getId(), attempt.getProblem().getId(), attempt.getProblem().getTitle(),
                attempt.getTargetSubtask() != null ? attempt.getTargetSubtask().getTitle() : null, attempt.getStatus().name(),
                attempt.getCompletedAt() != null ? attempt.getCompletedAt() : attempt.getUpdatedAt(), summary, attachedFiles, attempt.getRejectionReason(), deltaDescription); // 🚀 PASS DELTA
    }


    @Transactional(readOnly = true)
    public List<SolutionAttemptSummaryResponse> getLightweightTree(UUID problemId) {
        Problem problem = problemRepository.findById(problemId).orElseThrow(() -> new RuntimeException("Problem not found"));
        return attemptRepository.findByProblemOrderByClaimedAtAsc(problem).stream().map(this::mapToSummaryResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getActiveAttemptsCountForProblem(UUID problemId) {
        Problem problem = problemRepository.findById(problemId).orElseThrow(() -> new RuntimeException("Problem not found"));
        return attemptRepository.countByProblemAndStatus(problem, SolutionAttemptStatus.ACTIVE);
    }

    @Transactional(readOnly = true)
    public List<SolutionAttemptSummaryResponse> getActiveWorkspaces(UUID problemId) {
        Problem problem = problemRepository.findById(problemId).orElseThrow(() -> new RuntimeException("Problem not found"));
        return attemptRepository.findByProblemAndStatus(problem, SolutionAttemptStatus.ACTIVE).stream().map(this::mapToSummaryResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSubtaskCapacities(UUID problemId) {
        Problem problem = problemRepository.findById(problemId).orElseThrow(() -> new RuntimeException("Problem not found"));

        List<SolutionAttempt> activeAttempts = attemptRepository.findByProblemAndStatus(problem, SolutionAttemptStatus.ACTIVE);
        List<SolutionAttempt> pendingAttempts = attemptRepository.findByProblemAndStatus(problem, SolutionAttemptStatus.PENDING_REVIEW);

        Map<UUID, Long> activeCounts = activeAttempts.stream().filter(a -> a.getTargetSubtask() != null).collect(Collectors.groupingBy(a -> a.getTargetSubtask().getId(), Collectors.counting()));
        Map<UUID, Long> pendingCounts = pendingAttempts.stream().filter(a -> a.getTargetSubtask() != null).collect(Collectors.groupingBy(a -> a.getTargetSubtask().getId(), Collectors.counting()));

        return subtaskRepository.findByProblem(problem).stream().map(st -> {
            Map<String, Object> map = new HashMap<>();
            map.put("subtaskId", st.getId());
            map.put("title", st.getTitle());
            map.put("activeCount", activeCounts.getOrDefault(st.getId(), 0L).intValue());
            map.put("pendingReviewCount", pendingCounts.getOrDefault(st.getId(), 0L).intValue());
            map.put("maxSolvers", st.getMaxConcurrentSolvers() != null ? st.getMaxConcurrentSolvers() : 3);
            return map;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PaginatedAttemptsResponse getPendingReviewAttempts(UUID problemId, UUID subtaskId, String search, String sort, int page, int size, UUID currentUserId) {
        Problem problem = problemRepository.findById(problemId).orElseThrow(() -> new RuntimeException("Problem not found"));
        ProblemSubtask subtask = subtaskId != null ? subtaskRepository.findById(subtaskId).orElse(null) : null;
        org.springframework.data.domain.Sort.Direction direction = "oldest-first".equalsIgnoreCase(sort) ? org.springframework.data.domain.Sort.Direction.ASC : org.springframework.data.domain.Sort.Direction.DESC;

        Page<SolutionAttempt> attemptPage = attemptRepository.findPendingReviews(problem, SolutionAttemptStatus.PENDING_REVIEW, subtask, search, PageRequest.of(page, size, org.springframework.data.domain.Sort.by(direction, "updatedAt")));

        List<SolutionAttemptSummaryResponse> summaries = attemptPage.getContent().stream().map(this::mapToSummaryResponse).collect(Collectors.toList());
        return new PaginatedAttemptsResponse(summaries, attemptPage.getNumber(), attemptPage.getTotalPages(), attemptPage.getTotalElements(), attemptPage.getSize());
    }

    @Transactional
    public SolutionAttemptResponse evaluateSolution(UUID seekerUserId, UUID attemptId, boolean isApproved, String rejectionReason) {
        SeekerProfile seeker = seekerProfileRepository.findByUserId(seekerUserId).orElseThrow(() -> new RuntimeException("Seeker profile not found"));
        SolutionAttempt attempt = attemptRepository.findById(attemptId).orElseThrow(() -> new RuntimeException("Attempt not found"));

        if (!attempt.getProblem().getSeeker().getId().equals(seeker.getId())) throw new RuntimeException("You do not own this problem.");
        if (attempt.getStatus() != SolutionAttemptStatus.PENDING_REVIEW) throw new RuntimeException("This attempt is not pending review.");

        String seekerName = seeker.getOrganizationName();
        String subtaskTitle = attempt.getTargetSubtask() != null ? attempt.getTargetSubtask().getTitle() : "sub-problem";

        if (isApproved) {
            attempt.setStatus(SolutionAttemptStatus.COMPLETED);
            auditService.log(attempt.getProblem().getId(), seekerUserId, seekerName, "SEEKER", AuditEventType.STATUS_CHANGED,
                    seekerName + " approved the final solution for sub-problem \"" + subtaskTitle + "\" from " + attempt.getSolver().getFirstName() + ".");
        } else {
            // 🚀 Assign true REJECTED status instead of TERMINATED
            attempt.setStatus(SolutionAttemptStatus.REJECTED);
            attempt.setCompletedAt(null);
            attempt.setRejectionReason(rejectionReason);

            String auditMsg = seekerName + " rejected the final solution for sub-problem \"" + subtaskTitle + "\" from " + attempt.getSolver().getFirstName() + ".";
            if (rejectionReason != null && !rejectionReason.isBlank()) {
                auditMsg += " Reason: " + rejectionReason;
            }
            auditService.log(attempt.getProblem().getId(), seekerUserId, seekerName, "SEEKER", AuditEventType.STATUS_CHANGED, auditMsg);
        }

        SolutionAttempt savedAttempt = attemptRepository.save(attempt);
        return mapToResponse(savedAttempt, submissionRepository.findByAttempt(savedAttempt), seekerUserId);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getLightweightPendingProposals(UUID problemId) {
        Problem problem = problemRepository.findById(problemId).orElseThrow(() -> new RuntimeException("Problem not found"));

        return claimRequestRepository.findByProblemAndStatus(problem, ClaimRequestStatus.PENDING).stream().map(claim -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", claim.getId());
            map.put("targetSubtaskId", claim.getTargetSubtask() != null ? claim.getTargetSubtask().getId() : null);
            map.put("parentAttemptId", claim.getParentAttempt() != null ? claim.getParentAttempt().getId() : null);
            map.put("status", claim.getStatus().name());
            map.put("createdAt", claim.getCreatedAt());
            map.put("fileCount", claim.getSupportingDocuments() != null && !claim.getSupportingDocuments().isBlank() ? claim.getSupportingDocuments().split(",").length : 0);

            Map<String, Object> solver = new HashMap<>();
            solver.put("firstName", claim.getSolver().getFirstName());
            solver.put("lastName", claim.getSolver().getLastName());
            solver.put("institution", claim.getSolver().getInstitution());
            solver.put("profilePictureUrl", claim.getSolver().getUser().getProfileUrl());
            map.put("solver", solver);
            return map;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getProposalDetailsForSeeker(UUID proposalId) {
        ClaimRequest claim = claimRequestRepository.findById(proposalId).orElseThrow(() -> new RuntimeException("Proposal not found"));
        Map<String, Object> map = new HashMap<>();
        map.put("id", claim.getId());
        map.put("proposedApproach", claim.getProposedApproach());
        map.put("supportingDocuments", claim.getSupportingDocuments());
        map.put("status", claim.getStatus().name());
        map.put("createdAt", claim.getCreatedAt());
        map.put("targetSubtaskId", claim.getTargetSubtask() != null ? claim.getTargetSubtask().getId() : null);
        map.put("parentAttemptId", claim.getParentAttempt() != null ? claim.getParentAttempt().getId() : null);

        Map<String, Object> solver = new HashMap<>();
        solver.put("firstName", claim.getSolver().getFirstName());
        solver.put("lastName", claim.getSolver().getLastName());
        solver.put("institution", claim.getSolver().getInstitution());
        solver.put("profilePictureUrl", claim.getSolver().getUser().getProfileUrl());
        map.put("solver", solver);
        return map;
    }

    @Transactional(readOnly = true)
    public List<SolutionAttemptSummaryResponse> getMyLightweightAttemptsByUserId(UUID solverUserId) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId).orElseThrow(() -> new RuntimeException("Solver not found"));
        return attemptRepository.findBySolver(solver).stream().map(this::mapToSummaryResponse).collect(Collectors.toList());
    }
}