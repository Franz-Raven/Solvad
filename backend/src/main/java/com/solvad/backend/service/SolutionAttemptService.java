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

    // -------------------------------------------------------------------------
    // CLAIM
    // -------------------------------------------------------------------------

    @Transactional
    public SolutionAttemptResponse claimProblem(UUID solverUserId, UUID problemId, UUID parentAttemptId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found"));

        if (problem.getStatus() != ProblemStatus.OPEN) {
            throw new RuntimeException("Problem is not available for claiming");
        }

        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        if (attemptRepository.existsByProblemAndSolverAndStatus(problem, solver, SolutionAttemptStatus.ACTIVE)) {
            throw new RuntimeException("You have already claimed this problem");
        }

        // Create the new attempt
        SolutionAttempt attempt = new SolutionAttempt(problem, solver);

        // --- THE BRANCHING LOGIC ---
        if (parentAttemptId != null) {
            SolutionAttempt parent = attemptRepository.findById(parentAttemptId)
                    .orElseThrow(() -> new RuntimeException("Parent attempt not found"));

            // Link them in the tree
            attempt.setParentAttempt(parent);
            SolutionAttempt savedAttempt = attemptRepository.save(attempt);

            // Copy parent's submitted text into the new solver's DRAFTs
            List<SubtaskSubmission> parentSubmissions = submissionRepository.findByAttempt(parent);
            for (SubtaskSubmission parentSub : parentSubmissions) {
                if (parentSub.getStatus() == SubtaskSubmissionStatus.SUBMITTED) {
                    SubtaskSubmission newDraft = new SubtaskSubmission(savedAttempt, parentSub.getSubtask());
                    // Copy text so they can edit/improve it
                    newDraft.setDescription(parentSub.getDescription());
                    // Leave fileUrls blank to prevent accidental deletion of parent files
                    newDraft.setStatus(SubtaskSubmissionStatus.DRAFT);
                    submissionRepository.save(newDraft);
                }
            }
        } else {
            attemptRepository.save(attempt);
        }
        // ---------------------------

        problem.setStatus(ProblemStatus.CLAIMED);
        problemRepository.save(problem);

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

        // Mark attempt as abandoned
        attempt.setStatus(SolutionAttemptStatus.ABANDONED);
        attemptRepository.save(attempt);

        // Reopen the problem
        problem.setStatus(ProblemStatus.OPEN);
        problemRepository.save(problem);
    }

    // -------------------------------------------------------------------------
    // SAVE DRAFT / SUBMIT subtask submission
    // -------------------------------------------------------------------------


    @Transactional
    public SubtaskSubmissionResponse saveOrSubmitSubtask(UUID solverUserId, UUID attemptId,
                                                         UUID subtaskId, String description,
                                                         String action,
                                                         List<MultipartFile> files) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        SolutionAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Solution attempt not found"));

        // Ownership check
        if (!attempt.getSolver().getId().equals(solver.getId())) {
            throw new RuntimeException("You do not own this solution attempt");
        }

        if (attempt.getStatus() != SolutionAttemptStatus.ACTIVE) {
            throw new RuntimeException("This attempt is no longer active");
        }

        ProblemSubtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new RuntimeException("Subtask not found"));

        // Subtask must belong to the same problem
        if (!subtask.getProblem().getId().equals(attempt.getProblem().getId())) {
            throw new RuntimeException("Subtask does not belong to this problem");
        }

        // Get or create the submission
        SubtaskSubmission submission = submissionRepository
                .findByAttemptAndSubtask(attempt, subtask)
                .orElseGet(() -> new SubtaskSubmission(attempt, subtask));

        // Cannot edit a SUBMITTED submission
        if (submission.getStatus() == SubtaskSubmissionStatus.SUBMITTED) {
            throw new RuntimeException("This subtask has already been submitted and cannot be edited");
        }

        // Upload new files if provided
        if (files != null && !files.isEmpty()) {
            List<String> existingUrls = submission.getFileUrlsAsList();
            List<String> newUrls = new ArrayList<>(existingUrls);

            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    String url = storageService.uploadFile(file, attemptId, subtaskId);
                    newUrls.add(url);
                }
            }
            submission.setFileUrls(String.join(",", newUrls));
        }

        submission.setDescription(description);

        boolean isSubmitting = "SUBMIT".equalsIgnoreCase(action);
        if (isSubmitting) {
            submission.setStatus(SubtaskSubmissionStatus.SUBMITTED);
            submission.setSubmittedAt(LocalDateTime.now());

            // Auto-transition problem to IN_PROGRESS on first submission
            Problem problem = attempt.getProblem();
            if (problem.getStatus() == ProblemStatus.CLAIMED) {
                problem.setStatus(ProblemStatus.IN_PROGRESS);
                problemRepository.save(problem);
            }
        } else {
            submission.setStatus(SubtaskSubmissionStatus.DRAFT);
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

        // Remove URL from list
        List<String> urls = new ArrayList<>(submission.getFileUrlsAsList());
        urls.remove(fileUrl);
        submission.setFileUrls(urls.isEmpty() ? null : String.join(",", urls));
        submissionRepository.save(submission);

        // Delete from Supabase
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
    // GET all attempts for a specific solver (for solver dashboard)
    // -------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<SolutionAttemptResponse> getMyAttempts(UUID solverUserId) {
        SolverProfile solver = solverProfileRepository.findByUserId(solverUserId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        // Find all attempts by this solver, newest first
        List<SolutionAttempt> attempts = attemptRepository.findBySolverOrderByClaimedAtDesc(solver);

        // Map to responses
        return attempts.stream().map(attempt -> {
            List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(attempt);
            return mapToResponse(attempt, submissions);
        }).collect(Collectors.toList());
    }

    // -------------------------------------------------------------------------
    // GET all attempts for a problem (seeker / attempt tree view)
    // -------------------------------------------------------------------------

    // -------------------------------------------------------------------------
    // GET all attempts for a problem (seeker / attempt tree view)
    // -------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<SolutionAttemptResponse> getAllAttemptsForProblem(UUID problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found"));

        // Removed the Seeker ownership verification so Solvers can view the timeline too!

        List<SolutionAttempt> attempts = attemptRepository.findByProblemOrderByClaimedAtDesc(problem);

        return attempts.stream().map(attempt -> {
            List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(attempt);
            return mapToResponse(attempt, submissions);
        }).collect(Collectors.toList());
    }

    // -------------------------------------------------------------------------
    // GET single attempt detail by ID (seeker or solver can view)
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public SolutionAttemptResponse getAttemptById(UUID attemptId) {
        SolutionAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));

        List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(attempt);
        return mapToResponse(attempt, submissions);
    }

    // -------------------------------------------------------------------------
    // GET all open problems (for solver browse page)
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<com.solvad.backend.dto.ProblemResponse> getOpenProblems() {
        List<Problem> openProblems = problemRepository.findByStatus(ProblemStatus.OPEN);
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

        // Find the active attempt and complete it
        SolutionAttempt attempt = attemptRepository
                .findByProblemAndStatus(problem, SolutionAttemptStatus.ACTIVE)
                .orElseThrow(() -> new RuntimeException("No active attempt found"));

        attempt.setStatus(SolutionAttemptStatus.COMPLETED);
        attempt.setCompletedAt(LocalDateTime.now());
        attemptRepository.save(attempt);

        problem.setStatus(ProblemStatus.SOLVED);
        problemRepository.save(problem);

        List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(attempt);
        return mapToResponse(attempt, submissions);
    }

    // -------------------------------------------------------------------------
    // MAPPERS
    // -------------------------------------------------------------------------

    private SolutionAttemptResponse mapToResponse(SolutionAttempt attempt, List<SubtaskSubmission> submissions) {
        List<SubtaskSubmissionResponse> submissionResponses = submissions.stream()
                .map(this::mapSubmissionToResponse)
                .collect(Collectors.toList());

        SolverProfile solver = attempt.getSolver();

        // Extract parent info if it exists
        UUID parentId = attempt.getParentAttempt() != null ? attempt.getParentAttempt().getId() : null;
        String parentName = attempt.getParentAttempt() != null ?
                attempt.getParentAttempt().getSolver().getFirstName() + " " + attempt.getParentAttempt().getSolver().getLastName() : null;

        return new SolutionAttemptResponse(
                attempt.getId(), attempt.getProblem().getId(), attempt.getProblem().getTitle(),
                solver.getId(), solver.getFirstName(), solver.getLastName(),
                solver.getInstitution(), solver.getDegreeProgram(),
                attempt.getStatus().name(), submissionResponses,
                attempt.getClaimedAt(), attempt.getUpdatedAt(), attempt.getCompletedAt(),
                parentId, parentName // <-- Added here
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
                submission.getSubmittedAt()
        );
    }

    private com.solvad.backend.dto.ProblemResponse mapProblemToResponse(
            Problem problem,
            List<com.solvad.backend.entity.ProblemSubtask> subtasks) {

        List<com.solvad.backend.dto.SubtaskResponse> subtaskResponses = subtasks.stream()
                .map(s -> new com.solvad.backend.dto.SubtaskResponse(
                        s.getId(), s.getTitle(), s.getDepartmentFocus(), s.getDescription()))
                .collect(Collectors.toList());

        return new com.solvad.backend.dto.ProblemResponse(
                problem.getId(),
                problem.getTitle(),
                problem.getBackgroundContext(),
                problem.getPrimaryStatement(),
                problem.getObjectives(),
                problem.getConstraints(),
                problem.getRequiredCourse(),
                problem.getStatus().name(),
                problem.getSeeker().getId(),
                problem.getSeeker().getOrganizationName(),
                problem.getCreatedAt(),
                subtaskResponses
        );
    }

    // -------------------------------------------------------------------------
    // SUBMIT FULL ATTEMPT — Solver finishes their work, reopening the problem
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

        // Mark attempt as COMPLETED
        attempt.setStatus(SolutionAttemptStatus.COMPLETED);
        attempt.setCompletedAt(LocalDateTime.now());
        SolutionAttempt savedAttempt = attemptRepository.save(attempt);

        // Reopen the problem for other solvers
        Problem problem = attempt.getProblem();
        problem.setStatus(ProblemStatus.OPEN);
        problemRepository.save(problem);

        List<SubtaskSubmission> submissions = submissionRepository.findByAttempt(savedAttempt);
        return mapToResponse(savedAttempt, submissions);
    }
}