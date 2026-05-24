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
import com.solvad.backend.entity.SolutionAttempt;
import com.solvad.backend.entity.SolutionAttemptStatus;

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

    @Autowired
    private ProblemPdfService problemPdfService;

    @Autowired
    private CloudinaryService cloudinaryService;

    public GenerateScopeResponse generateScope(GenerateScopeRequest request, List<MultipartFile> attachments) {
        GenerateScopeResponse response = geminiService.generateSubtasks(
                request.getTitle(),
                request.getBackgroundContext(),
                request.getPrimaryStatement(),
                request.getObjectives(),
                request.getConstraints(),
                request.getPreferredProgram(),
                attachments
        );

        return response;
    }

    @Transactional
    public ProblemResponse createProblem(UUID seekerUserId, ProblemRequest request) {
        SeekerProfile seeker = seekerProfileRepository.findByUserId(seekerUserId)
                .orElseThrow(() -> new RuntimeException("Seeker profile not found"));

        Problem problem = new Problem(
                seeker,
                request.getTitle(),
                request.getBackgroundContext(),
                request.getPrimaryStatement(),
                request.getObjectives(),
                request.getConstraints(),
                request.getPreferredProgram(),
                request.getSdgFocus()
        );
        
        try {
            byte[] pdfBytes = problemPdfService.generateProblemPdf(request, seeker.getOrganizationName());
            String filename = "problem_" + System.currentTimeMillis() + ".pdf";
            String pdfUrl = cloudinaryService.uploadBytes(pdfBytes, filename, "problem-documents");
            problem.setProblemDocumentUrl(pdfUrl);
        } catch (Exception e) {
            System.err.println("Failed to generate/upload problem PDF: " + e.getMessage());
            e.printStackTrace();
        }
        
        Problem savedProblem = problemRepository.save(problem);

        List<ProblemSubtask> subtasks = request.getSubtasks().stream()
                .map(subtaskReq -> new ProblemSubtask(
                        savedProblem,
                        subtaskReq.getTitle(),
                        subtaskReq.getDescription(),
                        subtaskReq.getDepartmentFocus(),
                        subtaskReq.getSdgFocus()
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
                List<SolutionAttempt> activeAttempts = attemptRepository.findByProblemAndStatus(problem, SolutionAttemptStatus.ACTIVE);
                for (SolutionAttempt attempt : activeAttempts) {
                    attempt.setStatus(SolutionAttemptStatus.TERMINATED);
                    attemptRepository.save(attempt);
                }
                if (!activeAttempts.isEmpty()) {
                    auditService.log(
                            problemId,
                            seekerUserId,
                            seeker.getOrganizationName(),
                            "SEEKER",
                            AuditEventType.STATUS_CHANGED,
                            "Seeker forcefully " + newStatus.name().toLowerCase() + " the problem. All active solution attempts were terminated."
                    );
                }
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
                        subtask.getSdgFocus(),
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
                problem.getPreferredProgram(),
                problem.getSdgFocus(),
                problem.getStatus().name(),
                seeker.getId(),
                seeker.getOrganizationName(),
                problem.getCreatedAt(),
                subtaskResponses,
                tags,
                problem.getProblemDocumentUrl(),
                problem.getMaxConcurrentSolvers()
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

    @Transactional(readOnly = true)
    public PaginatedProblemsResponse searchMyProblems(UUID seekerUserId, String searchQuery, String sdgFilter, String dateSort, int page, int size) {
        SeekerProfile seeker = seekerProfileRepository.findByUserId(seekerUserId)
                .orElseThrow(() -> new RuntimeException("Seeker profile not found"));

        List<Problem> allProblems = problemRepository.findBySeeker(seeker);
        
        if (sdgFilter != null && !sdgFilter.trim().isEmpty()) {
            allProblems = allProblems.stream()
                    .filter(problem -> sdgFilter.equals(problem.getSdgFocus()))
                    .collect(Collectors.toList());
        }

        List<ProblemSearchResult> searchResults;

        if (searchQuery == null || searchQuery.trim().isEmpty()) {
            searchResults = allProblems.stream()
                    .map(problem -> {
                        List<ProblemSubtask> subtasks = subtaskRepository.findByProblem(problem);
                        ProblemResponse response = mapToResponse(problem, subtasks, seeker);
                        return new ProblemSearchResult(response, 0.0);
                    })
                    .collect(Collectors.toList());
        } else {
            String normalizedQuery = searchQuery.toLowerCase().trim();
            String[] queryTerms = normalizedQuery.split("\\s+");

            searchResults = allProblems.stream()
                    .map(problem -> {
                        List<ProblemSubtask> subtasks = subtaskRepository.findByProblem(problem);
                        ProblemResponse response = mapToResponse(problem, subtasks, seeker);
                        double score = calculateSearchScore(problem, queryTerms);
                        return new ProblemSearchResult(response, score);
                    })
                    .filter(result -> result.getScore() > 0)
                    .sorted((a, b) -> Double.compare(b.getScore(), a.getScore()))
                    .collect(Collectors.toList());
        }
        
        if (dateSort != null) {
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            java.time.LocalDateTime filterDate = null;
            
            switch (dateSort.toLowerCase()) {
                case "1day":
                    filterDate = now.minusDays(1);
                    break;
                case "1week":
                    filterDate = now.minusWeeks(1);
                    break;
                case "1month":
                    filterDate = now.minusMonths(1);
                    break;
                case "1year":
                    filterDate = now.minusYears(1);
                    break;
            }
            
            if (filterDate != null) {
                final java.time.LocalDateTime finalFilterDate = filterDate;
                searchResults = searchResults.stream()
                        .filter(result -> {
                            java.time.LocalDateTime createdAt = result.getProblem().getCreatedAt();
                            return createdAt.isAfter(finalFilterDate);
                        })
                        .collect(Collectors.toList());
            } else if (dateSort.equalsIgnoreCase("oldest")) {
                searchResults.sort((a, b) -> a.getProblem().getCreatedAt().compareTo(b.getProblem().getCreatedAt()));
            } else if (dateSort.equalsIgnoreCase("newest")) {
                searchResults.sort((a, b) -> b.getProblem().getCreatedAt().compareTo(a.getProblem().getCreatedAt()));
            }
        }

        long totalElements = searchResults.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int fromIndex = page * size;

        List<ProblemResponse> paginatedProblems = searchResults.stream()
                .skip(fromIndex)
                .limit(size)
                .map(ProblemSearchResult::getProblem)
                .collect(Collectors.toList());

        return new PaginatedProblemsResponse(paginatedProblems, page, totalPages, totalElements, size);
    }

    private double calculateSearchScore(Problem problem, String[] queryTerms) {
        double score = 0.0;
        
        String title = problem.getTitle() != null ? problem.getTitle().toLowerCase() : "";
        String primaryStatement = problem.getPrimaryStatement() != null ? problem.getPrimaryStatement().toLowerCase() : "";
        String backgroundContext = problem.getBackgroundContext() != null ? problem.getBackgroundContext().toLowerCase() : "";

        for (String term : queryTerms) {
            int titleMatches = countOccurrences(title, term);
            int primaryMatches = countOccurrences(primaryStatement, term);
            int backgroundMatches = countOccurrences(backgroundContext, term);

            score += titleMatches * 10.0;
            score += primaryMatches * 5.0;
            score += backgroundMatches * 2.0;
        }

        return score;
    }

    private int countOccurrences(String text, String term) {
        if (text.isEmpty() || term.isEmpty()) {
            return 0;
        }
        
        int count = 0;
        int index = 0;
        
        while ((index = text.indexOf(term, index)) != -1) {
            count++;
            index += term.length();
        }
        
        return count;
    }
}