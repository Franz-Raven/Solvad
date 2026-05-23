package com.solvad.backend.service;

import com.solvad.backend.dto.SolutionAttemptResponse;
import com.solvad.backend.dto.SubtaskSubmissionResponse;
import com.solvad.backend.entity.*;
import com.solvad.backend.repository.*;
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
    private SupabaseStorageService storageService;

    @Autowired
    private AuditService auditService;

    // -------------------------------------------------------------------------
    // CLAIM
    // -------------------------------------------------------------------------

    @Transactional
    public SolutionAttemptResponse claimProblem(UUID solverUserId, UUID problemId, UUID parentAttemptId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found"));

        boolean isFork = parentAttemptId != null;
        if (isFork) {
            if (problem.getStatus() != ProblemStatus.OPEN
                    && problem.getStatus() != ProblemStatus.SOLVED_OPEN_FOR_IMPROVEMENT) {
                throw new RuntimeException("Problem is not available for forking");
            }
        } else if (problem.getStatus() != ProblemStatus.OPEN) {
            throw new RuntimeException("Only OPEN problems can be claimed");
        }

        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        if (attemptRepository.existsByProblemAndSolverAndStatus(problem, solver, SolutionAttemptStatus.ACTIVE)) {
            throw new RuntimeException("You have already claimed this problem");
        }

        String solverFullName = solver.getFirstName() + " " + solver.getLastName();

        SolutionAttempt attempt = new SolutionAttempt(problem, solver);

        if (parentAttemptId != null) {
            SolutionAttempt parent = attemptRepository.findById(parentAttemptId)
                    .orElseThrow(() -> new RuntimeException("Parent attempt not found"));

            attempt.setParentAttempt(parent);
            SolutionAttempt savedAttempt = attemptRepository.save(attempt);

            List<SubtaskSubmission> parentSubmissions = submissionRepository.findByAttempt(parent);
            for (SubtaskSubmission parentSub : parentSubmissions) {
                if (parentSub.getStatus() == SubtaskSubmissionStatus.SUBMITTED) {
                    SubtaskSubmission newDraft = new SubtaskSubmission(savedAttempt, parentSub.getSubtask());
                    newDraft.setDescription(parentSub.getDescription());
                    newDraft.setStatus(SubtaskSubmissionStatus.DRAFT);
                    submissionRepository.save(newDraft);
                }
            }

            String parentName = parent.getSolver().getFirstName() + " " + parent.getSolver().getLastName();

            auditService.log(
                    problemId,
                    solverUserId,
                    solverFullName,
                    "SOLVER",
                    AuditEventType.ATTEMPT_FORKED,
                    solverFullName + " forked this attempt, building on " + parentName + "'s previous work."
            );

        } else {
            attemptRepository.save(attempt);

            auditService.log(
                    problemId,
                    solverUserId,
                    solverFullName,
                    "SOLVER",
                    AuditEventType.ATTEMPT_CLAIMED,
                    solverFullName + " claimed this problem. The seeker has been notified."
            );
        }

        // Only transition to CLAIMED if it was OPEN. If it's already SOLVED_OPEN_FOR_IMPROVEMENT, leave it.
        if (problem.getStatus() == ProblemStatus.OPEN) {
            problem.setStatus(ProblemStatus.CLAIMED);
            problemRepository.save(problem);

            auditService.log(
                    problemId,
                    null,
                    "SYSTEM",
                    "SYSTEM",
                    AuditEventType.STATUS_CHANGED,
                    "Status automatically changed from OPEN → CLAIMED after solver claimed the problem."
            );
        }

        return mapToResponse(attempt, submissionRepository.findByAttempt(attempt));
    }

    // -------------------------------------------------------------------------
    // ABANDON
    // -------------------------------------------------------------------------

    @Transactional
    public void abandonClaim(UUID solverUserId, UUID problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found"));

        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        SolutionAttempt attempt = attemptRepository.findByProblemAndSolverAndStatus(
                        problem, solver, SolutionAttemptStatus.ACTIVE)
                .orElseThrow(() -> new RuntimeException("No active claim found for this problem"));

        String solverFullName = solver.getFirstName() + " " + solver.getLastName();

        attempt.setStatus(SolutionAttemptStatus.ABANDONED);
        attemptRepository.save(attempt);

        auditService.log(
                problem.getId(),
                solverUserId,
                solverFullName,
                "SOLVER",
                AuditEventType.ATTEMPT_ABANDONED,
                solverFullName + " abandoned their attempt."
        );

        // Only revert to OPEN if it's not already in an open-for-improvement state
        if (problem.getStatus() != ProblemStatus.SOLVED_OPEN_FOR_IMPROVEMENT) {
            problem.setStatus(ProblemStatus.OPEN);
            problemRepository.save(problem);

            auditService.log(
                    problem.getId(),
                    null,
                    "SYSTEM",
                    "SYSTEM",
                    AuditEventType.STATUS_CHANGED,
                    "Status automatically changed to OPEN after solver abandoned."
            );
        }
    }

    // -------------------------------------------------------------------------
    // SAVE DRAFT / SUBMIT subtask submission
    // -------------------------------------------------------------------------

    @Transactional
    public SubtaskSubmissionResponse saveOrSubmitSubtask(UUID solverUserId, UUID attemptId,
                                                         UUID subtaskId, String description,
                                                         String action,
                                                         List<MultipartFile> files,
                                                         String deltaDescription) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        SolutionAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Solution attempt not found"));

        if (!attempt.getSolver().getId().equals(solver.getId())) {
            throw new RuntimeException("You do not own this solution attempt");
        }

        if (attempt.getStatus() != SolutionAttemptStatus.ACTIVE) {
            throw new RuntimeException("This attempt is no longer active");
        }

        ProblemSubtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new RuntimeException("Subtask not found"));

        if (!subtask.getProblem().getId().equals(attempt.getProblem().getId())) {
            throw new RuntimeException("Subtask does not belong to this problem");
        }

        SubtaskSubmission submission = submissionRepository
                .findByAttemptAndSubtask(attempt, subtask)
                .orElseGet(() -> new SubtaskSubmission(attempt, subtask));

        if (submission.getStatus() == SubtaskSubmissionStatus.SUBMITTED) {
            throw new RuntimeException("This subtask has already been submitted and cannot be edited");
        }

        int newFileCount = 0;

        if (files != null && !files.isEmpty()) {
            List<String> existingUrls = submission.getFileUrlsAsList();
            List<String> newUrls = new ArrayList<>(existingUrls);

            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    String url = storageService.uploadFile(file, attemptId, subtaskId);
                    newUrls.add(url);
                    newFileCount++;
                }
            }
            submission.setFileUrls(String.join(",", newUrls));
        }

        submission.setDescription(description);
        submission.setDeltaDescription(deltaDescription);

        String solverFullName = solver.getFirstName() + " " + solver.getLastName();
        boolean isSubmitting = "SUBMIT".equalsIgnoreCase(action);

        if (isSubmitting) {
            submission.setStatus(SubtaskSubmissionStatus.SUBMITTED);
            submission.setSubmittedAt(LocalDateTime.now());

            Problem problem = attempt.getProblem();
            String deltaMsg = "Subtask \"" + subtask.getTitle() + "\" submitted by " + solverFullName;

            if (deltaDescription != null && !deltaDescription.isBlank()) {
                deltaMsg += " — Delta: " + deltaDescription;
            }
            if (newFileCount > 0) {
                deltaMsg += " (" + newFileCount + " file(s) attached)";
            }

            auditService.log(
                    problem.getId(),
                    solverUserId,
                    solverFullName,
                    "SOLVER",
                    AuditEventType.SUBTASK_SUBMITTED,
                    deltaMsg
            );

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
                        solverFullName + " uploaded " + newFileCount + " file(s) to subtask \""
                                + subtask.getTitle() + "\"."
                );
            }
        }

        SubtaskSubmission saved = submissionRepository.save(submission);
        return mapSubmissionToResponse(saved);
    }

    // -------------------------------------------------------------------------
    // DELETE FILE from a draft submission
    // -------------------------------------------------------------------------

    @Transactional
    public SubtaskSubmissionResponse deleteFileFromSubmission(UUID solverUserId, UUID submissionId,
                                                              String fileUrl) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        SubtaskSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        if (!submission.getAttempt().getSolver().getId().equals(solver.getId())) {
            throw new RuntimeException("You do not own this submission");
        }

        if (submission.getStatus() == SubtaskSubmissionStatus.SUBMITTED) {
            throw new RuntimeException("Cannot modify a submitted submission");
        }

        List<String> urls = new ArrayList<>(submission.getFileUrlsAsList());
        urls.remove(fileUrl);
        submission.setFileUrls(urls.isEmpty() ? null : String.join(",", urls));

        submissionRepository.save(submission);
        storageService.deleteFile(fileUrl);

        return mapSubmissionToResponse(submission);
    }

    // -------------------------------------------------------------------------
    // GET solver's active attempt on a problem
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public SolutionAttemptResponse getMyAttempt(UUID solverUserId, UUID problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found"));

        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        SolutionAttempt attempt = attemptRepository
                .findByProblemAndSolverAndStatus(problem, solver, SolutionAttemptStatus.ACTIVE)
                .orElseThrow(() -> new RuntimeException("No active attempt found"));

        List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(attempt);
        return mapToResponse(attempt, submissions);
    }

    // -------------------------------------------------------------------------
    // GET all attempts for a specific solver (solver dashboard)
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<SolutionAttemptResponse> getMyAttempts(UUID solverUserId) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        List<SolutionAttempt> attempts = attemptRepository.findBySolverOrderByClaimedAtDesc(solver);

        return attempts.stream().map(attempt -> {
            List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(attempt);
            return mapToResponse(attempt, submissions);
        }).collect(Collectors.toList());
    }

    // -------------------------------------------------------------------------
    // GET all attempts for a problem (seeker / attempt tree view)
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<SolutionAttemptResponse> getAllAttemptsForProblem(UUID problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found"));

        List<SolutionAttempt> attempts = attemptRepository.findByProblemOrderByClaimedAtDesc(problem);

        return attempts.stream().map(attempt -> {
            List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(attempt);
            return mapToResponse(attempt, submissions);
        }).collect(Collectors.toList());
    }

    // -------------------------------------------------------------------------
    // GET single attempt by ID
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public SolutionAttemptResponse getAttemptById(UUID attemptId) {
        SolutionAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));

        List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(attempt);
        return mapToResponse(attempt, submissions);
    }

    // -------------------------------------------------------------------------
    // GET all open problems (solver browse)
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<com.solvad.backend.dto.ProblemResponse> getOpenProblems() {
        // Fetch both OPEN problems and problems marked as SOLVED_OPEN_FOR_IMPROVEMENT
        List<ProblemStatus> visibleStatuses = Arrays.asList(
                ProblemStatus.OPEN,
                ProblemStatus.SOLVED_OPEN_FOR_IMPROVEMENT
        );

        List<Problem> openProblems = problemRepository.findByStatusIn(visibleStatuses);

        return openProblems.stream()
                .map(problem -> {
                    List<com.solvad.backend.entity.ProblemSubtask> subtasks =
                            subtaskRepository.findByProblem(problem);
                    return mapProblemToResponse(problem, subtasks);
                })
                .collect(Collectors.toList());
    }

    // -------------------------------------------------------------------------
    // MARK problem as SOLVED (seeker action)
    // -------------------------------------------------------------------------

    @Transactional
    public SolutionAttemptResponse markAsSolved(UUID seekerUserId, UUID problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found"));

        SeekerProfile seeker = seekerProfileRepository.findByUserId(seekerUserId)
                .orElseThrow(() -> new RuntimeException("Seeker profile not found"));

        if (!problem.getSeeker().getId().equals(seeker.getId())) {
            throw new RuntimeException("You do not own this problem");
        }

        if (problem.getStatus() != ProblemStatus.IN_PROGRESS) {
            throw new RuntimeException("Problem must be IN_PROGRESS to mark as solved");
        }

        SolutionAttempt attempt = attemptRepository
                .findByProblemAndStatus(problem, SolutionAttemptStatus.ACTIVE)
                .orElseThrow(() -> new RuntimeException("No active attempt found"));

        attempt.setStatus(SolutionAttemptStatus.COMPLETED);
        attempt.setCompletedAt(LocalDateTime.now());
        attemptRepository.save(attempt);

        // We mark it as SOLVED_OPEN_FOR_IMPROVEMENT by default so others can keep working on it.
        // The seeker can manually change it to COMPLETED if they want to hide it completely.
        problem.setStatus(ProblemStatus.SOLVED_OPEN_FOR_IMPROVEMENT);
        problemRepository.save(problem);

        auditService.log(
                problem.getId(),
                seekerUserId,
                seeker.getOrganizationName(),
                "SEEKER",
                AuditEventType.STATUS_CHANGED,
                "Problem marked as Solved by " + seeker.getOrganizationName() + " and left Open for Improvement."
        );

        auditService.log(
                problem.getId(),
                null,
                "SYSTEM",
                "SYSTEM",
                AuditEventType.ATTEMPT_COMPLETED,
                "Active attempt was automatically completed when problem was marked Solved."
        );

        List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(attempt);
        return mapToResponse(attempt, submissions);
    }

    // -------------------------------------------------------------------------
    // SUBMIT FULL ATTEMPT (solver finishes, problem reopens)
    // -------------------------------------------------------------------------

    @Transactional
    public SolutionAttemptResponse submitFullAttempt(UUID solverUserId, UUID attemptId) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        SolutionAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));

        if (!attempt.getSolver().getId().equals(solver.getId())) {
            throw new RuntimeException("You do not own this attempt");
        }

        if (attempt.getStatus() != SolutionAttemptStatus.ACTIVE) {
            throw new RuntimeException("Attempt is not active");
        }

        String solverFullName = solver.getFirstName() + " " + solver.getLastName();

        attempt.setStatus(SolutionAttemptStatus.COMPLETED);
        attempt.setCompletedAt(LocalDateTime.now());

        SolutionAttempt savedAttempt = attemptRepository.save(attempt);

        auditService.log(
                attempt.getProblem().getId(),
                solverUserId,
                solverFullName,
                "SOLVER",
                AuditEventType.ATTEMPT_COMPLETED,
                solverFullName + " completed and submitted their full attempt."
        );

        Problem problem = attempt.getProblem();

        // Only transition to OPEN if it isn't already marked open for improvement
        if (problem.getStatus() != ProblemStatus.SOLVED_OPEN_FOR_IMPROVEMENT) {
            problem.setStatus(ProblemStatus.OPEN);
            problemRepository.save(problem);

            auditService.log(
                    problem.getId(),
                    null,
                    "SYSTEM",
                    "SYSTEM",
                    AuditEventType.STATUS_CHANGED,
                    "Status automatically changed back to OPEN after solver submitted their completed attempt."
            );
        }

        List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(savedAttempt);
        return mapToResponse(savedAttempt, submissions);
    }

    // -------------------------------------------------------------------------
    // MAPPERS
    // -------------------------------------------------------------------------

    private SolutionAttemptResponse mapToResponse(SolutionAttempt attempt,
                                                  List<SubtaskSubmission> submissions) {
        List<SubtaskSubmissionResponse> submissionResponses = submissions.stream()
                .map(this::mapSubmissionToResponse)
                .collect(Collectors.toList());

        SolverProfile solver = attempt.getSolver();

        UUID parentId = attempt.getParentAttempt() != null
                ? attempt.getParentAttempt().getId() : null;
        String parentName = attempt.getParentAttempt() != null
                ? attempt.getParentAttempt().getSolver().getFirstName() + " "
                + attempt.getParentAttempt().getSolver().getLastName()
                : null;

        return new SolutionAttemptResponse(
                attempt.getId(),
                attempt.getProblem().getId(),
                attempt.getProblem().getTitle(),
                solver.getId(),
                solver.getFirstName(),
                solver.getLastName(),
                solver.getInstitution(),
                solver.getDegreeProgram(),
                attempt.getStatus().name(),
                submissionResponses,
                attempt.getClaimedAt(),
                attempt.getUpdatedAt(),
                attempt.getCompletedAt(),
                parentId,
                parentName
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

    private com.solvad.backend.dto.ProblemResponse mapProblemToResponse(
            Problem problem,
            List<com.solvad.backend.entity.ProblemSubtask> subtasks) {

        List<com.solvad.backend.dto.SubtaskResponse> subtaskResponses = subtasks.stream()
                .map(s -> new com.solvad.backend.dto.SubtaskResponse(
                        s.getId(), s.getTitle(), s.getDepartmentFocus(), s.getSdgFocus(),s.getDescription()))
                .collect(Collectors.toList());

        List<String> tags = problem.getTags() != null
                ? problem.getTags()
                : MatchmakingService.buildTagsForProblem(problem, subtasks);

        return new com.solvad.backend.dto.ProblemResponse(
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
                problem.getProblemDocumentUrl()
        );
    }
}