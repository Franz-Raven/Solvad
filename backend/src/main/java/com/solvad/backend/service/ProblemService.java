package com.solvad.backend.service;

import com.solvad.backend.dto.*;
import com.solvad.backend.entity.*;
import com.solvad.backend.repository.ProblemRepository;
import com.solvad.backend.repository.ProblemSubtaskRepository;
import com.solvad.backend.repository.SeekerProfileRepository;
import com.solvad.backend.repository.SolutionAttemptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProblemService {

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private ProblemSubtaskRepository subtaskRepository;

    @Autowired
    private SeekerProfileRepository seekerProfileRepository;

    @Autowired
    private SolutionAttemptRepository attemptRepository;

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private AuditService auditService;

    public GenerateScopeResponse generateScope(GenerateScopeRequest request, List<MultipartFile> attachments) {
        List<SubtaskResponse> generatedSubtasks = geminiService.generateSubtasks(
                request.getTitle(),
                request.getBackgroundContext(),
                request.getPrimaryStatement(),
                request.getObjectives(),
                request.getConstraints(),
                request.getRequiredProgram(),
                attachments
        );

        return new GenerateScopeResponse(generatedSubtasks);
    }

    @Transactional
    public ProblemResponse createProblem(UUID seekerUserId, ProblemRequest request) {
        // Find seeker profile by user ID
        SeekerProfile seeker = seekerProfileRepository.findByUserId(seekerUserId)
                .orElseThrow(() -> new RuntimeException("Seeker profile not found"));

        // Create and save Problem entity
        Problem problem = new Problem(
                seeker,
                request.getTitle(),
                request.getBackgroundContext(),
                request.getPrimaryStatement(),
                request.getObjectives(),
                request.getConstraints(),
                request.getRequiredCourse()
        );
        
        Problem savedProblem = problemRepository.save(problem);

        // Create and save ProblemSubtask entities
        List<ProblemSubtask> subtasks = request.getSubtasks().stream()
                .map(subtaskReq -> new ProblemSubtask(
                        savedProblem,
                        subtaskReq.getTitle(),
                        subtaskReq.getDescription(),
                        subtaskReq.getDepartmentFocus()
                ))
                .collect(Collectors.toList());

        List<ProblemSubtask> savedSubtasks = subtaskRepository.saveAll(subtasks);

        savedProblem.setTags(MatchmakingService.buildTagsForProblem(savedProblem, savedSubtasks));
        problemRepository.save(savedProblem);

        auditService.log(
                savedProblem.getId(),
                seekerUserId,
                seeker.getOrganizationName(),
                "SEEKER",
                AuditEventType.PROBLEM_CREATED,
                "Problem \"" + savedProblem.getTitle() + "\" was created and published."
        );

        // Map to response DTO
        return mapToResponse(savedProblem, savedSubtasks, seeker);
    }

    public List<ProblemResponse> getMyProblems(UUID seekerUserId) {
        SeekerProfile seeker = seekerProfileRepository.findByUserId(seekerUserId)
                .orElseThrow(() -> new RuntimeException("Seeker profile not found"));

        List<Problem> problems = problemRepository.findBySeeker(seeker);

        return problems.stream()
                .map(problem -> {
                    List<ProblemSubtask> subtasks = subtaskRepository.findByProblem(problem);
                    return mapToResponse(problem, subtasks, seeker);
                })
                .collect(Collectors.toList());
    }

    public ProblemResponse getProblemById(UUID problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found"));

        List<ProblemSubtask> subtasks = subtaskRepository.findByProblem(problem);

        return mapToResponse(problem, subtasks, problem.getSeeker());
    }

    @Transactional
    public ProblemResponse updateProblemStatus(UUID seekerUserId, UUID problemId, String newStatusStr) {
        // Find the problem
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found"));

        // Verify ownership
        SeekerProfile seeker = seekerProfileRepository.findByUserId(seekerUserId)
                .orElseThrow(() -> new RuntimeException("Seeker profile not found"));

        if (!problem.getSeeker().getId().equals(seeker.getId())) {
            throw new RuntimeException("You do not have permission to update this problem");
        }

        try {
            ProblemStatus newStatus = ProblemStatus.valueOf(newStatusStr);
            ProblemStatus oldStatus = problem.getStatus();

            // Guardrail: Prevent manual shifts to automated solver states
            if (newStatus == ProblemStatus.CLAIMED || newStatus == ProblemStatus.IN_PROGRESS) {
                throw new RuntimeException("Status " + newStatus + " is driven by solver actions and cannot be set manually.");
            }

            // FORCE CLOSE LOGIC: If moving to CLOSED or COMPLETED, we must terminate any active attempts
            if (newStatus == ProblemStatus.CLOSED || newStatus == ProblemStatus.COMPLETED) {
                attemptRepository.findByProblemAndStatus(problem, SolutionAttemptStatus.ACTIVE)
                        .ifPresent(attempt -> {
                            attempt.setStatus(SolutionAttemptStatus.TERMINATED); // <-- Updated
                            attemptRepository.save(attempt);

                            auditService.log(
                                    problemId,
                                    seekerUserId,
                                    seeker.getOrganizationName(),
                                    "SEEKER",
                                    AuditEventType.STATUS_CHANGED,
                                    "Seeker forcefully " + newStatus.name().toLowerCase() + " the problem. The active solution attempt was terminated."
                            );
                        });
            }

            problem.setStatus(newStatus);
            problemRepository.save(problem);

            auditService.log(
                    problemId,
                    seekerUserId,
                    seeker.getOrganizationName(),
                    "SEEKER",
                    AuditEventType.STATUS_CHANGED,
                    "Status manually changed from " + oldStatus.name() + " → " + newStatus.name()
            );

        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + newStatusStr);
        }

        // Return updated problem
        List<ProblemSubtask> subtasks = subtaskRepository.findByProblem(problem);
        return mapToResponse(problem, subtasks, seeker);
    }

    @Transactional
    public void deleteProblem(UUID seekerUserId, UUID problemId) {
        // Find the problem
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found"));

        // Verify ownership
        SeekerProfile seeker = seekerProfileRepository.findByUserId(seekerUserId)
                .orElseThrow(() -> new RuntimeException("Seeker profile not found"));

        if (!problem.getSeeker().getId().equals(seeker.getId())) {
            throw new RuntimeException("You do not have permission to delete this problem");
        }

        // Delete subtasks first (cascade should handle this, but being explicit)
        List<ProblemSubtask> subtasks = subtaskRepository.findByProblem(problem);
        subtaskRepository.deleteAll(subtasks);

        // Delete the problem
        problemRepository.delete(problem);
    }

    private ProblemResponse mapToResponse(Problem problem, List<ProblemSubtask> subtasks, SeekerProfile seeker) {
        List<SubtaskResponse> subtaskResponses = subtasks.stream()
                .map(subtask -> new SubtaskResponse(
                        subtask.getId(),
                        subtask.getTitle(),
                        subtask.getDepartmentFocus(),
                        subtask.getDescription()
                ))
                .collect(Collectors.toList());

        List<String> tags = problem.getTags() != null ? problem.getTags() : List.of();

        return new ProblemResponse(
                problem.getId(),
                problem.getTitle(),
                problem.getBackgroundContext(),
                problem.getPrimaryStatement(),
                problem.getObjectives(),
                problem.getConstraints(),
                problem.getRequiredProgram(),
                problem.getStatus().name(),
                seeker.getId(),
                seeker.getOrganizationName(),
                problem.getCreatedAt(),
                subtaskResponses,
                tags,
                problem.getProblemDocumentUrl()
        );
    }

    @Transactional(readOnly = true)
    public List<com.solvad.backend.dto.SeekerNotificationResponse> getSeekerNotifications(UUID seekerUserId) {
        SeekerProfile seeker = seekerProfileRepository.findByUserId(seekerUserId)
                .orElseThrow(() -> new RuntimeException("Seeker profile not found"));

        List<Problem> problems = problemRepository.findBySeeker(seeker);
        if (problems.isEmpty()) {
            return List.of();
        }

        List<UUID> problemIds = problems.stream().map(Problem::getId).collect(Collectors.toList());
        Map<UUID, String> titles = problems.stream()
                .collect(Collectors.toMap(Problem::getId, Problem::getTitle));

        return auditService.getRecentNotificationsForProblems(problemIds, titles);
    }
}