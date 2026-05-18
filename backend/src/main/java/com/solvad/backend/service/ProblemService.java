package com.solvad.backend.service;

import com.solvad.backend.dto.*;
import com.solvad.backend.entity.Problem;
import com.solvad.backend.entity.ProblemSubtask;
import com.solvad.backend.entity.SeekerProfile;
import com.solvad.backend.repository.ProblemRepository;
import com.solvad.backend.repository.ProblemSubtaskRepository;
import com.solvad.backend.repository.SeekerProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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
    private GeminiService geminiService;

    public GenerateScopeResponse generateScope(GenerateScopeRequest request) {
        // Call Gemini AI to generate subtasks
        List<SubtaskResponse> generatedSubtasks = geminiService.generateSubtasks(
            request.getTitle(),
            request.getBackgroundContext(),
            request.getPrimaryStatement(),
            request.getObjectives(),
            request.getConstraints(),
            request.getRequiredCourse()
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

    private ProblemResponse mapToResponse(Problem problem, List<ProblemSubtask> subtasks, SeekerProfile seeker) {
        List<SubtaskResponse> subtaskResponses = subtasks.stream()
            .map(subtask -> new SubtaskResponse(
                subtask.getId(),
                subtask.getTitle(),
                subtask.getDepartmentFocus(),
                subtask.getDescription()
            ))
            .collect(Collectors.toList());

        return new ProblemResponse(
            problem.getId(),
            problem.getTitle(),
            problem.getBackgroundContext(),
            problem.getPrimaryStatement(),
            problem.getObjectives(),
            problem.getConstraints(),
            problem.getRequiredCourse(),
            problem.getStatus().name(),
            seeker.getId(),
            seeker.getOrganizationName(),
            problem.getCreatedAt(),
            subtaskResponses
        );
    }
}
