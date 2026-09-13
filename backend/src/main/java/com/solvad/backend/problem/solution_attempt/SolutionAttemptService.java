package com.solvad.backend.problem.solution_attempt;

import com.solvad.backend.audit.AuditEventType;
import com.solvad.backend.problem.attachment.ProblemAttachmentRepository;
import com.solvad.backend.problem.attachment.AttachmentRequirementResponse;
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
    private SolutionAttemptRepository solutionAttemptRepository;

    @Autowired
    private ClaimRequestRepository claimRequestRepository;

    
    @Transactional
    public SolutionAttemptResponse initializeApprovedAttempt(ClaimRequest request) {
        Problem problem = request.getProblem();
        SolverProfile solver = request.getSolver();
        ProblemSubtask targetSubtask = request.getTargetSubtask();

        if (targetSubtask == null) {
            throw new RuntimeException("Claim request has no target sub-problem.");
        }

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
                if (parentSub.getStatus() == SubtaskSubmissionStatus.SUBMITTED
                        && parentSub.getSubtask().getId().equals(targetSubtask.getId())) {
                    SubtaskSubmission newDraft = new SubtaskSubmission(savedAttempt, parentSub.getSubtask());
                    newDraft.setStatus(SubtaskSubmissionStatus.DRAFT);
                    submissionRepository.save(newDraft);
                }
            }

            String parentName = parent.getSolver().getFirstName() + " " + parent.getSolver().getLastName();
            auditService.log(
                    problem.getId(),
                    solverUserId,
                    solverFullName,
                    "SOLVER",
                    AuditEventType.ATTEMPT_FORKED,
                    solverFullName + "'s proposal was approved. Forked workspace created for sub-problem \""
                            + targetSubtask.getTitle() + "\" based on " + parentName + "'s attempt."
            );
            List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(savedAttempt);
            return mapToResponse(savedAttempt, submissions, solverUserId);

        } else {
            SolutionAttempt savedAttempt = attemptRepository.save(attempt);
            auditService.log(
                    problem.getId(),
                    solverUserId,
                    solverFullName,
                    "SOLVER",
                    AuditEventType.ATTEMPT_CLAIMED,
                    solverFullName + "'s proposal was approved. Active workspace created for sub-problem \""
                            + targetSubtask.getTitle() + "\"."
            );

            List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(savedAttempt);
            return mapToResponse(savedAttempt, submissions, solverUserId);
        }
    }

    public SolutionAttemptResponse getMyAttempt(UUID solverUserId, UUID problemId) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        List<SolutionAttempt> allMyAttempts = attemptRepository.findBySolverOrderByClaimedAtDesc(solver);

        SolutionAttempt targetAttempt = null;
        for (SolutionAttempt attempt : allMyAttempts) {
            if (attempt.getProblem().getId().equals(problemId)) {
                targetAttempt = attempt;
                break;
            }
        }

        if (targetAttempt == null) {
            throw new RuntimeException("No active attempt found");
        }

        List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(targetAttempt);
        return mapToResponse(targetAttempt, submissions, solverUserId);
    }

    // -------------------------------------------------------------------------
    // GETTERS & DASHBOARD QUERIES
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<SolutionAttemptResponse> getMyAttempts(UUID solverUserId) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        List<SolutionAttempt> attempts = attemptRepository
                .findBySolverOrderByClaimedAtDesc(solver);

        return attempts.stream().map(attempt -> {
            List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(attempt);
            return mapToResponse(attempt, submissions, solverUserId);
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SolutionAttemptResponse> getAttemptsForSubtask(UUID problemId, UUID subtaskId, UUID currentUserId) {
        List<SolutionAttempt> attempts = attemptRepository
                .findByProblemIdAndTargetSubtaskIdOrderByClaimedAtAsc(problemId, subtaskId);

        return attempts.stream().map(attempt -> {
            List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(attempt);
            return mapToResponse(attempt, submissions, currentUserId);
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SolutionAttemptResponse> getAllAttemptsForProblem(UUID problemId, UUID currentUserId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found"));

        List<SolutionAttempt> attempts = attemptRepository
                .findByProblemOrderByClaimedAtDesc(problem);

        return attempts.stream().map(attempt -> {
            List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(attempt);
            return mapToResponse(attempt, submissions, currentUserId);
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SolutionAttemptResponse getAttemptById(UUID attemptId, UUID currentUserId) {
        SolutionAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));

        List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(attempt);
        return mapToResponse(attempt, submissions, currentUserId);
    }

    @Transactional(readOnly = true)
    public List<ProblemResponse> getOpenProblems() {
        List<ProblemStatus> visibleStatuses = Arrays.asList(
                ProblemStatus.OPEN,
                ProblemStatus.CLAIMED,
                ProblemStatus.IN_PROGRESS,
                ProblemStatus.SOLVED_OPEN_FOR_IMPROVEMENT
        );

        List<Problem> openProblems = problemRepository.findByStatusIn(visibleStatuses);

        return openProblems.stream()
                .map(problem -> {
                    List<ProblemSubtask> subtasks = subtaskRepository.findByProblem(problem);
                    return mapProblemToResponse(problem, subtasks);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PaginatedAttemptsResponse getWorkspaceAttempts(UUID solverUserId, String tab, int page, int size) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        Pageable pageable = PageRequest.of(page, size);

        if ("PENDING".equalsIgnoreCase(tab)) {
            Page<ClaimRequest> claimPage = claimRequestRepository.findBySolverAndStatusOrderByCreatedAtDesc(
                    solver, ClaimRequestStatus.PENDING, pageable);

            List<SolutionAttemptResponse> content = claimPage.getContent().stream()
                    .map(claim -> new SolutionAttemptResponse(
                            claim.getId(),
                            claim.getProblem().getId(),
                            claim.getProblem().getTitle(),
                            solver.getId(),
                            solver.getFirstName(),
                            solver.getLastName(),
                            solver.getUser().getProfileUrl(),
                            solver.getInstitution(),
                            solver.getDegreeProgram(),
                            claim.getStatus().name(),
                            new ArrayList<>(),
                            claim.getCreatedAt(),
                            claim.getCreatedAt(),
                            null,
                            claim.getParentAttempt() != null ? claim.getParentAttempt().getId() : null,
                            claim.getParentAttempt() != null ? claim.getParentAttempt().getSolver().getFirstName() + " " + claim.getParentAttempt().getSolver().getLastName() : null,
                            claim.getTargetSubtask() != null ? claim.getTargetSubtask().getId() : null,
                            claim.getTargetSubtask() != null ? claim.getTargetSubtask().getTitle() : null,
                            null,
                            new ArrayList<>()
                    ))
                    .collect(Collectors.toList());

            return new PaginatedAttemptsResponse(content, page, claimPage.getTotalPages(), claimPage.getTotalElements(), size);
        }

        List<SolutionAttemptStatus> statuses;
        if ("HISTORY".equalsIgnoreCase(tab)) {
            statuses = List.of(SolutionAttemptStatus.COMPLETED, SolutionAttemptStatus.TERMINATED, SolutionAttemptStatus.ABANDONED);
        } else {
            statuses = List.of(SolutionAttemptStatus.ACTIVE);
        }

        Page<SolutionAttempt> attemptPage = solutionAttemptRepository.findBySolverAndStatusInOrderByClaimedAtDesc(solver, statuses, pageable);

        List<SolutionAttemptResponse> content = attemptPage.getContent().stream()
                .map(attempt -> {
                    List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(attempt);
                    return mapToResponse(attempt, submissions, solverUserId);
                })
                .collect(Collectors.toList());

        return new PaginatedAttemptsResponse(content, page, attemptPage.getTotalPages(), attemptPage.getTotalElements(), size);
    }

    // -------------------------------------------------------------------------
    // WORKSPACE MUTATIONS (Actions)
    // -------------------------------------------------------------------------

    @Transactional
    public SubtaskSubmissionResponse deleteFileFromSubmission(UUID solverUserId, UUID submissionId, String fileUrl) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        SubtaskSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        if (!submission.getAttempt().getSolver().getId().equals(solver.getId())) {
            throw new RuntimeException("You do not own this submission.");
        }

        if (submission.getStatus() == SubtaskSubmissionStatus.SUBMITTED) {
            throw new RuntimeException("Cannot modify a submitted submission.");
        }

        List<String> urls = new ArrayList<>(submission.getFileUrlsAsList());
        urls.remove(fileUrl);
        submission.setFileUrls(urls.isEmpty() ? null : String.join(",", urls));

        submissionRepository.save(submission);
        storageService.deleteFile(fileUrl);

        return mapSubmissionToResponse(submission, solverUserId);
    }

    @Transactional
    public void markAsSolved(UUID seekerUserId, UUID problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found"));

        SeekerProfile seeker = seekerProfileRepository.findByUserId(seekerUserId)
                .orElseThrow(() -> new RuntimeException("Seeker profile not found"));

        if (!problem.getSeeker().getId().equals(seeker.getId())) {
            throw new RuntimeException("You do not own this problem.");
        }

        List<SolutionAttempt> activeAttempts = attemptRepository
                .findByProblemAndStatus(problem, SolutionAttemptStatus.ACTIVE);

        for (SolutionAttempt attempt : activeAttempts) {
            attempt.setStatus(SolutionAttemptStatus.COMPLETED);
            attempt.setCompletedAt(LocalDateTime.now());
            attemptRepository.save(attempt);
        }

        problem.setStatus(ProblemStatus.SOLVED_OPEN_FOR_IMPROVEMENT);
        problemRepository.save(problem);

        auditService.log(
                problem.getId(),
                seekerUserId,
                seeker.getOrganizationName(),
                "SEEKER",
                AuditEventType.STATUS_CHANGED,
                "Problem marked as Solved by " + seeker.getOrganizationName() + " and left open for improvement."
        );

        auditService.log(
                problem.getId(),
                null,
                "SYSTEM",
                "SYSTEM",
                AuditEventType.ATTEMPT_COMPLETED,
                "All active attempts were automatically completed when the problem was marked Solved."
        );
    }

    @Transactional
    public SubtaskSubmissionResponse saveSubtaskDraft(UUID solverUserId, UUID attemptId,
                                                      UUID subtaskId, String description,
                                                      List<MultipartFile> files,
                                                      String deltaDescription) {
        return processSubtask(solverUserId, attemptId, subtaskId, description,
                files, deltaDescription, false);
    }

    @Transactional
    public SubtaskSubmissionResponse lockAndSubmitSubtask(UUID solverUserId, UUID attemptId,
                                                          UUID subtaskId, String description,
                                                          List<MultipartFile> files,
                                                          String deltaDescription) {
        return processSubtask(solverUserId, attemptId, subtaskId, description,
                files, deltaDescription, true);
    }

    private SubtaskSubmissionResponse processSubtask(UUID solverUserId, UUID attemptId,
                                                     UUID subtaskId, String description,
                                                     List<MultipartFile> files,
                                                     String deltaDescription,
                                                     boolean isSubmitting) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        SolutionAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Solution attempt not found"));

        if (!attempt.getSolver().getId().equals(solver.getId())) {
            throw new RuntimeException("You do not own this solution attempt.");
        }

        if (attempt.getStatus() != SolutionAttemptStatus.ACTIVE) {
            throw new RuntimeException("This attempt is no longer active.");
        }

        ProblemSubtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new RuntimeException("Sub-problem not found"));

        if (attempt.getTargetSubtask() != null
                && !attempt.getTargetSubtask().getId().equals(subtask.getId())) {
            throw new RuntimeException("This workspace is scoped to sub-problem \"" + attempt.getTargetSubtask().getTitle() + "\".");
        }

        if (!subtask.getProblem().getId().equals(attempt.getProblem().getId())) {
            throw new RuntimeException("Sub-problem does not belong to this problem.");
        }

        SubtaskSubmission submission = submissionRepository
                .findByAttemptAndSubtask(attempt, subtask)
                .orElseGet(() -> new SubtaskSubmission(attempt, subtask));

        if (submission.getStatus() == SubtaskSubmissionStatus.SUBMITTED) {
            throw new RuntimeException("This sub-problem has already been submitted and cannot be edited.");
        }

        int newFileCount = 0;

        if (files != null && !files.isEmpty()) {
            List<String> existingUrls = submission.getFileUrlsAsList();
            List<String> newUrls = new ArrayList<>(existingUrls);

            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    String url = storageService.uploadFile(
                            file, attemptId + "/" + subtaskId);
                    newUrls.add(url);
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

            Problem problem = attempt.getProblem();
            String msg = "Sub-problem \"" + subtask.getTitle() + "\" submitted by " + solverFullName;
            if (deltaDescription != null && !deltaDescription.isBlank()) {
                msg += " — Delta: " + deltaDescription;
            }
            if (newFileCount > 0) {
                msg += " (" + newFileCount + " file(s) attached)";
            }

            auditService.log(
                    problem.getId(),
                    solverUserId,
                    solverFullName,
                    "SOLVER",
                    AuditEventType.SUBTASK_SUBMITTED,
                    msg
            );

            attemptRepository.save(attempt);

        } else {
            submission.setStatus(SubtaskSubmissionStatus.DRAFT);

            if (newFileCount > 0) {
                auditService.log(
                        attempt.getProblem().getId(),
                        solverUserId,
                        solverFullName,
                        "SOLVER",
                        AuditEventType.FILE_UPLOADED,
                        solverFullName + " uploaded " + newFileCount + " file(s) to sub-problem \"" + subtask.getTitle() + "\"."
                );
            }
        }

        SubtaskSubmission saved = submissionRepository.save(submission);
        return mapSubmissionToResponse(saved, solverUserId);
    }

    @Transactional
    public void abandonAttempt(UUID solverUserId, UUID attemptId) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        SolutionAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Solution attempt not found"));

        if (!attempt.getSolver().getId().equals(solver.getId())) {
            throw new RuntimeException("You do not own this attempt.");
        }

        if (attempt.getStatus() != SolutionAttemptStatus.ACTIVE) {
            throw new RuntimeException("Attempt is not active.");
        }

        Problem problem = attempt.getProblem();
        String solverFullName = solver.getFirstName() + " " + solver.getLastName();
        String subtaskTitle = attempt.getTargetSubtask() != null
                ? attempt.getTargetSubtask().getTitle() : "unknown sub-problem";

        attempt.setStatus(SolutionAttemptStatus.ABANDONED);
        attemptRepository.save(attempt);

        auditService.log(
                problem.getId(),
                solverUserId,
                solverFullName,
                "SOLVER",
                AuditEventType.ATTEMPT_ABANDONED,
                solverFullName + " abandoned their attempt on sub-problem \"" + subtaskTitle + "\"."
        );

        long remainingActive = attemptRepository.countByProblemAndStatus(problem, SolutionAttemptStatus.ACTIVE);

        if (remainingActive == 0 && problem.getStatus() != ProblemStatus.SOLVED_OPEN_FOR_IMPROVEMENT) {
            problem.setStatus(ProblemStatus.OPEN);
            problemRepository.save(problem);

            auditService.log(
                    problem.getId(),
                    null,
                    "SYSTEM",
                    "SYSTEM",
                    AuditEventType.STATUS_CHANGED,
                    "Status automatically changed back to OPEN — no active attempts remain."
            );
        }
    }

    @Transactional
    public SolutionAttemptResponse finalizeAttempt(UUID solverUserId, UUID attemptId) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        SolutionAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));

        if (!attempt.getSolver().getId().equals(solver.getId())) {
            throw new RuntimeException("You do not own this attempt.");
        }

        if (attempt.getStatus() == SolutionAttemptStatus.COMPLETED) {
            throw new RuntimeException("This attempt has already been completed.");
        }

        List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(attempt);

        boolean hasSubmitted = submissions.stream()
                .anyMatch(sub -> sub.getStatus() == SubtaskSubmissionStatus.SUBMITTED);

        if (!hasSubmitted) {
            throw new RuntimeException("You must submit your sub-problem solution before finalizing.");
        }

        String solverFullName = solver.getFirstName() + " " + solver.getLastName();
        String subtaskTitle = attempt.getTargetSubtask() != null
                ? attempt.getTargetSubtask().getTitle() : "sub-problem";

        attempt.setStatus(SolutionAttemptStatus.COMPLETED);
        attempt.setCompletedAt(LocalDateTime.now());
        SolutionAttempt savedAttempt = attemptRepository.save(attempt);

        auditService.log(
                attempt.getProblem().getId(),
                solverUserId,
                solverFullName,
                "SOLVER",
                AuditEventType.ATTEMPT_COMPLETED,
                solverFullName + " finalized and submitted their attempt for sub-problem \"" + subtaskTitle + "\"."
        );

        Problem problem = attempt.getProblem();

        long remainingActive = attemptRepository.countByProblemAndStatus(problem, SolutionAttemptStatus.ACTIVE);

        if (remainingActive == 0 && problem.getStatus() != ProblemStatus.SOLVED_OPEN_FOR_IMPROVEMENT) {
            problem.setStatus(ProblemStatus.OPEN);
            problemRepository.save(problem);

            auditService.log(
                    problem.getId(),
                    null,
                    "SYSTEM",
                    "SYSTEM",
                    AuditEventType.STATUS_CHANGED,
                    "Status automatically changed back to OPEN — no active attempts remain."
            );
        }

        return mapToResponse(savedAttempt, submissions, solverUserId);
    }


    private SolutionAttemptResponse mapToResponse(SolutionAttempt attempt,
                                                  List<SubtaskSubmission> submissions,
                                                  UUID currentUserId) {
        List<SubtaskSubmissionResponse> submissionResponses = submissions.stream()
                .map(sub -> mapSubmissionToResponse(sub, currentUserId))
                .collect(Collectors.toList());

        SolverProfile solver = attempt.getSolver();
        String profilePictureUrl = solver.getUser().getProfileUrl();

        UUID parentId = attempt.getParentAttempt() != null ? attempt.getParentAttempt().getId() : null;
        String parentName = attempt.getParentAttempt() != null ? attempt.getParentAttempt().getSolver().getFirstName() + " " + attempt.getParentAttempt().getSolver().getLastName() : null;
        UUID targetSubtaskId = attempt.getTargetSubtask() != null ? attempt.getTargetSubtask().getId() : null;
        String targetSubtaskTitle = attempt.getTargetSubtask() != null ? attempt.getTargetSubtask().getTitle() : null;

        String parentDesc = null;
        List<String> parentFiles = new ArrayList<>();

        if (attempt.getParentAttempt() != null && attempt.getTargetSubtask() != null) {
            Optional<SubtaskSubmission> parentSub = submissionRepository
                    .findByAttemptAndSubtask(attempt.getParentAttempt(), attempt.getTargetSubtask());
            if (parentSub.isPresent()) {
                parentDesc = parentSub.get().getDescription();
                parentFiles = parentSub.get().getFileUrlsAsList();
            }
        }

        return new SolutionAttemptResponse(
                attempt.getId(),
                attempt.getProblem().getId(),
                attempt.getProblem().getTitle(),
                solver.getId(),
                solver.getFirstName(),
                solver.getLastName(),
                profilePictureUrl,
                solver.getInstitution(),
                solver.getDegreeProgram(),
                attempt.getStatus().name(),
                submissionResponses,
                attempt.getClaimedAt(),
                attempt.getUpdatedAt(),
                attempt.getCompletedAt(),
                parentId,
                parentName,
                targetSubtaskId,
                targetSubtaskTitle,
                parentDesc,
                parentFiles
        );
    }

    private SubtaskSubmissionResponse mapSubmissionToResponse(SubtaskSubmission submission, UUID currentUserId) {
        UUID ownerUserId = submission.getAttempt().getSolver().getUser().getId();
        boolean isOwner = currentUserId != null && currentUserId.equals(ownerUserId);
        boolean isDraft = submission.getStatus() == SubtaskSubmissionStatus.DRAFT;
        boolean hideDraft = isDraft && !isOwner;

        return new SubtaskSubmissionResponse(
                submission.getId(),
                submission.getSubtask().getId(),
                submission.getSubtask().getTitle(),
                submission.getSubtask().getDepartmentFocus(),
                hideDraft ? "Confidential Workspace: The solver is actively drafting a solution." : submission.getDescription(),
                hideDraft ? Collections.emptyList() : submission.getFileUrlsAsList(),
                submission.getStatus().name(),
                submission.getCreatedAt(),
                submission.getUpdatedAt(),
                submission.getSubmittedAt(),
                hideDraft ? null : submission.getDeltaDescription()
        );
    }

    private ProblemResponse mapProblemToResponse(Problem problem,
                                                 List<ProblemSubtask> subtasks) {
        List<SubtaskResponse> subtaskResponses = subtasks.stream()
                .map(s -> {
                    List<AttachmentRequirementResponse> attachments = attachmentRepository.findBySubtask(s)
                            .stream()
                            .map(att -> new AttachmentRequirementResponse(
                                    att.getId(),
                                    att.getAttachmentTitle(),
                                    att.getAttachmentType()
                            ))
                            .collect(Collectors.toList());
                    return new SubtaskResponse(
                            s.getId(),
                            s.getTitle(),
                            s.getDepartmentFocus(),
                            s.getSdgFocus(),
                            s.getDescription(),
                            attachments
                    );
                })
                .collect(Collectors.toList());

        List<String> tags = problem.getTags() != null
                ? problem.getTags()
                : MatchmakingService.buildTagsForProblem(problem, subtasks);

        return new ProblemResponse(
                problem.getId(),
                problem.getTitle(),
                problem.getBackgroundContext(),
                problem.getPrimaryStatement(),
                problem.getObjectives(),
                problem.getConstraints(),
                problem.getPreferredProgram(),
                problem.getSdgFocus(),
                problem.getStatus().name(),
                problem.getSeeker().getId(),
                problem.getSeeker().getOrganizationName(),
                problem.getCreatedAt(),
                subtaskResponses,
                tags,
                problem.getProblemDocumentUrl(),
                problem.getMaxConcurrentSolvers()
        );
    }
}