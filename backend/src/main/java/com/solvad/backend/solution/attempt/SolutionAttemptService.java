package com.solvad.backend.solution.attempt;

import com.solvad.backend.dto.*;
import com.solvad.backend.entity.*;
import com.solvad.backend.problem.claim.ClaimRequest;
import com.solvad.backend.repository.*;
import com.solvad.backend.service.AuditService;
import com.solvad.backend.service.CloudinaryService;
import com.solvad.backend.service.MatchmakingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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

    // -------------------------------------------------------------------------
    // WORKSPACE INITIALIZATION (Triggered via ClaimRequestService Approval)
    // Each approved attempt is now scoped to a single subtask.
    // -------------------------------------------------------------------------
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

        if (request.getParentAttempt() != null) {
            SolutionAttempt parent = request.getParentAttempt();
            attempt.setParentAttempt(parent);
            SolutionAttempt savedAttempt = attemptRepository.save(attempt);

            // FIX: DO NOT copy parent's description or files into the new draft.
            List<SubtaskSubmission> parentSubmissions = submissionRepository.findByAttempt(parent);
            for (SubtaskSubmission parentSub : parentSubmissions) {
                if (parentSub.getStatus() == SubtaskSubmissionStatus.SUBMITTED
                        && parentSub.getSubtask().getId().equals(targetSubtask.getId())) {
                    SubtaskSubmission newDraft = new SubtaskSubmission(savedAttempt, parentSub.getSubtask());
                    // Description and FileUrls are left completely blank here.
                    newDraft.setStatus(SubtaskSubmissionStatus.DRAFT);
                    submissionRepository.save(newDraft);
                }
            }

            String parentName = parent.getSolver().getFirstName() + " " + parent.getSolver().getLastName();
            auditService.log(
                    problem.getId(),
                    solver.getUser().getId(),
                    solverFullName,
                    "SOLVER",
                    AuditEventType.ATTEMPT_FORKED,
                    solverFullName + "'s proposal was approved. Forked workspace created for sub-problem \""
                            + targetSubtask.getTitle() + "\" based on " + parentName + "'s attempt."
            );
            List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(savedAttempt);
            return mapToResponse(savedAttempt, submissions);

        } else {
            SolutionAttempt savedAttempt = attemptRepository.save(attempt);
            auditService.log(
                    problem.getId(),
                    solver.getUser().getId(),
                    solverFullName,
                    "SOLVER",
                    AuditEventType.ATTEMPT_CLAIMED,
                    solverFullName + "'s proposal was approved. Active workspace created for sub-problem \""
                            + targetSubtask.getTitle() + "\"."
            );
            if (problem.getStatus() == ProblemStatus.OPEN) {
                problem.setStatus(ProblemStatus.CLAIMED);
                problemRepository.save(problem);
                auditService.log(
                        problem.getId(), null, "SYSTEM", "SYSTEM", AuditEventType.STATUS_CHANGED,
                        "Status automatically changed from OPEN → CLAIMED after first proposal was approved."
                );
            }

            List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(savedAttempt);
            return mapToResponse(savedAttempt, submissions);
        }
    }

    public SolutionAttemptResponse getMyAttempt(UUID solverUserId, UUID problemId) {

        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found"));

        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));


        List<SolutionAttempt> activeAttempts = attemptRepository.findByProblemAndSolverAndStatus(
                problem, solver, SolutionAttemptStatus.ACTIVE
        );

        if (activeAttempts.isEmpty()) {
            throw new RuntimeException("No active attempt found");
        }

        SolutionAttempt attempt = activeAttempts.get(0);
        List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(attempt);


        return mapToResponse(attempt, submissions);
    }

    // -------------------------------------------------------------------------
    // GET all active attempts for a solver on a problem (may have multiple
    // if they are working on different subtasks simultaneously — future use)
    // -------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<SolutionAttemptResponse> getMyActiveAttemptsForProblem(UUID solverUserId, UUID problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found"));

        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        List<SolutionAttempt> attempts = attemptRepository
                .findByProblemAndSolverAndStatus(problem, solver, SolutionAttemptStatus.ACTIVE);

        return attempts.stream().map(attempt -> {
            List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(attempt);
            return mapToResponse(attempt, submissions);
        }).collect(Collectors.toList());
    }

    // -------------------------------------------------------------------------
    // GET all attempts for a specific subtask (solution tree per subtask)
    // -------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<SolutionAttemptResponse> getAttemptsForSubtask(UUID problemId, UUID subtaskId) {
        List<SolutionAttempt> attempts = attemptRepository
                .findByProblemIdAndTargetSubtaskIdOrderByClaimedAtAsc(problemId, subtaskId);

        return attempts.stream().map(attempt -> {
            List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(attempt);
            return mapToResponse(attempt, submissions);
        }).collect(Collectors.toList());
    }

    // -------------------------------------------------------------------------
    // GET all attempts for a problem (used by seeker overview / audit)
    // -------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<SolutionAttemptResponse> getAllAttemptsForProblem(UUID problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found"));

        List<SolutionAttempt> attempts = attemptRepository
                .findByProblemOrderByClaimedAtDesc(problem);

        return attempts.stream().map(attempt -> {
            List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(attempt);
            return mapToResponse(attempt, submissions);
        }).collect(Collectors.toList());
    }

    // -------------------------------------------------------------------------
    // GET all attempts for a solver (solver dashboard)
    // -------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<SolutionAttemptResponse> getMyAttempts(UUID solverUserId) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        List<SolutionAttempt> attempts = attemptRepository
                .findBySolverOrderByClaimedAtDesc(solver);

        return attempts.stream().map(attempt -> {
            List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(attempt);
            return mapToResponse(attempt, submissions);
        }).collect(Collectors.toList());
    }
    @Transactional(readOnly = true)
    public SolutionAttemptResponse getAttemptById(UUID attemptId) {
        SolutionAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));

        List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(attempt);
        return mapToResponse(attempt, submissions);
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


    @Transactional
    public SubtaskSubmissionResponse deleteFileFromSubmission(UUID solverUserId, UUID submissionId,
                                                              String fileUrl) {
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

        return mapSubmissionToResponse(submission);
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

        // Complete all active attempts across all subtasks
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
                "Problem marked as Solved by " + seeker.getOrganizationName()
                        + " and left open for improvement."
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

    // -------------------------------------------------------------------------
    // SAVE DRAFT
    // -------------------------------------------------------------------------
    @Transactional
    public SubtaskSubmissionResponse saveSubtaskDraft(UUID solverUserId, UUID attemptId,
                                                      UUID subtaskId, String description,
                                                      List<MultipartFile> files,
                                                      String deltaDescription) {
        return processSubtask(solverUserId, attemptId, subtaskId, description,
                files, deltaDescription, false);
    }

    // -------------------------------------------------------------------------
    // LOCK AND SUBMIT SUBTASK
    // -------------------------------------------------------------------------
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

        // Enforce that this attempt can only submit to its target subtask
        if (attempt.getTargetSubtask() != null
                && !attempt.getTargetSubtask().getId().equals(subtask.getId())) {
            throw new RuntimeException(
                    "This workspace is scoped to sub-problem \""
                            + attempt.getTargetSubtask().getTitle()
                            + "\" and cannot submit to a different sub-problem.");
        }

        if (!subtask.getProblem().getId().equals(attempt.getProblem().getId())) {
            throw new RuntimeException("Sub-problem does not belong to this problem.");
        }

        SubtaskSubmission submission = submissionRepository
                .findByAttemptAndSubtask(attempt, subtask)
                .orElseGet(() -> new SubtaskSubmission(attempt, subtask));

        if (submission.getStatus() == SubtaskSubmissionStatus.SUBMITTED) {
            throw new RuntimeException(
                    "This sub-problem has already been submitted and cannot be edited.");
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

            // Transition problem status on first submission
            if (problem.getStatus() == ProblemStatus.CLAIMED) {
                problem.setStatus(ProblemStatus.IN_PROGRESS);
                problemRepository.save(problem);

                auditService.log(
                        problem.getId(),
                        null,
                        "SYSTEM",
                        "SYSTEM",
                        AuditEventType.STATUS_CHANGED,
                        "Status automatically changed from CLAIMED → IN_PROGRESS after first subtask submission."
                );
            }

        } else {
            submission.setStatus(SubtaskSubmissionStatus.DRAFT);

            if (newFileCount > 0) {
                auditService.log(
                        attempt.getProblem().getId(),
                        solverUserId,
                        solverFullName,
                        "SOLVER",
                        AuditEventType.FILE_UPLOADED,
                        solverFullName + " uploaded " + newFileCount + " file(s) to sub-problem \""
                                + subtask.getTitle() + "\"."
                );
            }
        }

        SubtaskSubmission saved = submissionRepository.save(submission);
        return mapSubmissionToResponse(saved);
    }

    // -------------------------------------------------------------------------
    // ABANDON ATTEMPT
    // -------------------------------------------------------------------------
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
                solverFullName + " abandoned their attempt on sub-problem \""
                        + subtaskTitle + "\"."
        );

        // Only revert problem status if no other active attempts remain
        long remainingActive = attemptRepository.countByProblemAndStatus(
                problem, SolutionAttemptStatus.ACTIVE);

        if (remainingActive == 0
                && problem.getStatus() != ProblemStatus.SOLVED_OPEN_FOR_IMPROVEMENT) {
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

    // -------------------------------------------------------------------------
    // FINALIZE ATTEMPT (Solver submits their completed work)
    // -------------------------------------------------------------------------
    @Transactional
    public SolutionAttemptResponse finalizeAttempt(UUID solverUserId, UUID attemptId) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        SolutionAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));

        if (!attempt.getSolver().getId().equals(solver.getId())) {
            throw new RuntimeException("You do not own this attempt.");
        }

        if (attempt.getStatus() != SolutionAttemptStatus.ACTIVE) {
            throw new RuntimeException("Attempt is not active.");
        }

        List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(attempt);

        // Must have submitted the target subtask
        boolean hasSubmitted = submissions.stream()
                .anyMatch(sub -> sub.getStatus() == SubtaskSubmissionStatus.SUBMITTED);

        if (!hasSubmitted) {
            throw new RuntimeException(
                    "You must submit your sub-problem solution before finalizing.");
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
                solverFullName + " finalized and submitted their attempt for sub-problem \""
                        + subtaskTitle + "\"."
        );

        Problem problem = attempt.getProblem();

        // Only revert to OPEN if no other active attempts remain
        long remainingActive = attemptRepository.countByProblemAndStatus(
                problem, SolutionAttemptStatus.ACTIVE);

        if (remainingActive == 0
                && problem.getStatus() != ProblemStatus.SOLVED_OPEN_FOR_IMPROVEMENT) {
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

        return mapToResponse(savedAttempt, submissions);
    }

    private SolutionAttemptResponse mapToResponse(SolutionAttempt attempt,
                                                  List<SubtaskSubmission> submissions) {
        List<SubtaskSubmissionResponse> submissionResponses = submissions.stream()
                .map(this::mapSubmissionToResponse)
                .collect(Collectors.toList());

        SolverProfile solver = attempt.getSolver();
        String profilePictureUrl = solver.getUser().getProfileUrl();

        UUID parentId = attempt.getParentAttempt() != null ? attempt.getParentAttempt().getId() : null;
        String parentName = attempt.getParentAttempt() != null ? attempt.getParentAttempt().getSolver().getFirstName() + " " + attempt.getParentAttempt().getSolver().getLastName() : null;
        UUID targetSubtaskId = attempt.getTargetSubtask() != null ? attempt.getTargetSubtask().getId() : null;
        String targetSubtaskTitle = attempt.getTargetSubtask() != null ? attempt.getTargetSubtask().getTitle() : null;

        // FIX: Fetch the parent's actual narrative and files to pass to the frontend
        String parentDesc = null;
        List<String> parentFiles = new java.util.ArrayList<>();

        if (attempt.getParentAttempt() != null && attempt.getTargetSubtask() != null) {
            java.util.Optional<SubtaskSubmission> parentSub = submissionRepository
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
                parentDesc,     // newly added
                parentFiles     // newly added
        );
    }

    private SubtaskSubmissionResponse mapSubmissionToResponse(SubtaskSubmission submission) {
        return new SubtaskSubmissionResponse(
                submission.getId(),
                submission.getSubtask().getId(),
                submission.getSubtask().getTitle(),
                submission.getSubtask().getDepartmentFocus(),
                submission.getDescription(),
                submission.getFileUrlsAsList(),
                submission.getStatus().name(),
                submission.getCreatedAt(),
                submission.getUpdatedAt(),
                submission.getSubmittedAt(),
                submission.getDeltaDescription()
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