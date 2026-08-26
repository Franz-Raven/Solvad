package com.solvad.backend.problem.core;

import com.solvad.backend.ai.GeminiService;
import com.solvad.backend.audit.AuditEventType;
import com.solvad.backend.audit.AuditService;
import com.solvad.backend.problem.scope.GenerateScopeRequest;
import com.solvad.backend.problem.scope.GenerateScopeResponse;
import com.solvad.backend.problem.search.PaginatedProblemsResponse;
import com.solvad.backend.problem.event.ProblemCreatedEvent;
import com.solvad.backend.problem.attachment.AttachmentRequirementResponse;
import com.solvad.backend.problem.attachment.ProblemAttachment;
import com.solvad.backend.problem.search.ProblemSearchResult;
import com.solvad.backend.problem.export.ProblemPdfService;
import com.solvad.backend.problem.similarity.MatchmakingService;
import com.solvad.backend.problem.similarity.VectorSimilarityService;
import com.solvad.backend.problem.subtask.ProblemSubtask;
import com.solvad.backend.problem.subtask.SubtaskRequest;
import com.solvad.backend.problem.subtask.SubtaskResponse;
import com.solvad.backend.profile.seeker.SeekerNotificationResponse;
import com.solvad.backend.profile.seeker.SeekerProblemListResponse;
import com.solvad.backend.profile.seeker.SeekerProfile;
import com.solvad.backend.problem.subtask.ProblemSubtaskRepository;
import com.solvad.backend.profile.seeker.SeekerProfileRepository;
import com.solvad.backend.problem.solution_attempt.SolutionAttemptRepository;
import com.solvad.backend.problem.attachment.ProblemAttachmentRepository;
import com.solvad.backend.problem.solution_attempt.SolutionAttempt;
import com.solvad.backend.problem.solution_attempt.SolutionAttemptStatus;
import com.solvad.backend.storage.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Arrays;
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
    private ProblemAttachmentRepository attachmentRepository;
    
    @Autowired
    private GeminiService geminiService;

    @Autowired
    private AuditService auditService;

    @Autowired
    private VectorSimilarityService vectorSimilarityService;

    @Autowired
    private ApplicationEventPublisher eventPublisher;
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

        // SAVE ATTACHMENTS PER SUBTASK
        for (int i = 0; i < request.getSubtasks().size(); i++) {
            SubtaskRequest subtaskReq = request.getSubtasks().get(i);
            ProblemSubtask savedSubtask = savedSubtasks.get(i);
            
            if (subtaskReq.getAttachments() != null && !subtaskReq.getAttachments().isEmpty()) {
                List<ProblemAttachment> attachmentsToSave = subtaskReq.getAttachments().stream()
                        .map(att -> new ProblemAttachment(
                                att.getAttachmentTitle(),
                                att.getAttachmentType(),
                                savedSubtask
                        ))
                        .collect(Collectors.toList());
                attachmentRepository.saveAll(attachmentsToSave);
            }
        }

        savedProblem.setTags(MatchmakingService.buildTagsForProblem(savedProblem, savedSubtasks));

        auditService.log(
                savedProblem.getId(),
                seekerUserId,
                seeker.getOrganizationName(),
                "SEEKER",
                AuditEventType.PROBLEM_CREATED,
                "Problem \"" + savedProblem.getTitle() + "\" was created and published."
        );

        eventPublisher.publishEvent(new ProblemCreatedEvent(savedProblem.getId()));
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
                .map(subtask -> {
                    // 1. Fetch the attachments for this specific subtask
                    List<AttachmentRequirementResponse> attachmentResponses = attachmentRepository.findBySubtask(subtask)
                            .stream()
                            .map(att -> new AttachmentRequirementResponse(
                                    att.getId(),
                                    att.getAttachmentTitle(),
                                    att.getAttachmentType()
                            ))
                            .collect(Collectors.toList());

                    // 2. Use the NEW constructor that includes attachmentResponses
                    return new SubtaskResponse(
                            subtask.getId(),
                            subtask.getTitle(),
                            subtask.getDepartmentFocus(),
                            subtask.getSdgFocus(),
                            subtask.getDescription(),
                            attachmentResponses // <-- Now attached to the payload
                    );
                })
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
    public List<SeekerNotificationResponse> getSeekerNotifications(UUID seekerUserId) {
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

    @Transactional
    public void updateMaxConcurrentSolvers(UUID seekerUserId, UUID problemId, int maxSolvers) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found"));

        SeekerProfile seeker = seekerProfileRepository.findByUserId(seekerUserId)
                .orElseThrow(() -> new RuntimeException("Seeker profile not found"));

        if (!problem.getSeeker().getId().equals(seeker.getId())) {
            throw new RuntimeException("You do not own this problem.");
        }

        if (maxSolvers < 1) {
            throw new RuntimeException("Max solvers must be at least 1.");
        }

        problem.setMaxConcurrentSolvers(maxSolvers);
        problemRepository.save(problem);

        // Optional: Log it to the Audit service
        auditService.log(
                problemId, seekerUserId, seeker.getOrganizationName(), "SEEKER",
                AuditEventType.PROBLEM_UPDATED,
                "Updated concurrent solver limit to " + maxSolvers
        );
    }

    @Transactional(readOnly = true)
    public SeekerProblemListResponse getSeekerProblemList(UUID seekerUserId, String searchQuery, String sdgFilter, String dateSort, int page, int size) {
        SeekerProfile seeker = seekerProfileRepository.findByUserId(seekerUserId)
                .orElseThrow(() -> new RuntimeException("Seeker profile not found"));

        String orgName = seeker.getOrganizationName();
        boolean hasSearch = searchQuery != null && !searchQuery.trim().isEmpty();
        boolean hasSdg = sdgFilter != null && !sdgFilter.trim().isEmpty();

        LocalDateTime cutoff = null;
        if (dateSort != null) {
            cutoff = switch (dateSort.toLowerCase()) {
                case "1day" -> LocalDateTime.now().minusDays(1);
                case "1week" -> LocalDateTime.now().minusWeeks(1);
                case "1month" -> LocalDateTime.now().minusMonths(1);
                case "1year" -> LocalDateTime.now().minusYears(1);
                default -> null;
            };
        }

        boolean hasDateCutoff = cutoff != null;
        boolean ascending = "oldest".equalsIgnoreCase(dateSort);

        Sort sort = ascending
                ? Sort.by(Sort.Direction.ASC, "createdAt")
                : Sort.by(Sort.Direction.DESC, "createdAt");
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Problem> problemPage;
        if (hasSearch && hasSdg && hasDateCutoff) {
            problemPage = problemRepository.searchBySeekerAndSdgAfter(seeker, sdgFilter, cutoff, searchQuery, pageable);
        } else if (hasSearch && hasSdg) {
            problemPage = problemRepository.searchBySeekerAndSdg(seeker, sdgFilter, searchQuery, pageable);
        } else if (hasSearch && hasDateCutoff) {
            problemPage = problemRepository.searchBySeekerAfter(seeker, cutoff, searchQuery, pageable);
        } else if (hasSearch) {
            problemPage = problemRepository.searchBySeeker(seeker, searchQuery, pageable);
        } else if (hasSdg && hasDateCutoff) {
            problemPage = problemRepository.findBySeekerAndSdgFocusAndCreatedAtAfter(seeker, sdgFilter, cutoff, pageable);
        } else if (hasSdg) {
            problemPage = problemRepository.findBySeekerAndSdgFocus(seeker, sdgFilter, pageable);
        } else if (hasDateCutoff) {
            problemPage = problemRepository.findBySeekerAndCreatedAtAfter(seeker, cutoff, pageable);
        } else {
            problemPage = problemRepository.findBySeeker(seeker, pageable);
        }

        if (!problemPage.hasContent()) {
            return new SeekerProblemListResponse(List.of(), page, 0, 0, size);
        }

        List<Problem> pageProblems = problemPage.getContent();
        Map<UUID, Integer> subtaskCounts = subtaskRepository.findByProblemIn(pageProblems)
                .stream()
                .collect(Collectors.groupingBy(
                        s -> s.getProblem().getId(),
                        Collectors.summingInt(s -> 1)
                ));

        List<ProblemSummaryResponse> responses = pageProblems.stream()
                .map(p -> {
                    List<String> tags = p.getTags() != null ? p.getTags() : List.of();
                    return new ProblemSummaryResponse(
                            p.getId(), p.getTitle(), p.getStatus().name(), p.getCreatedAt(),
                            subtaskCounts.getOrDefault(p.getId(), 0),
                            p.getPreferredProgram(), p.getSdgFocus(), orgName, tags
                    );
                })
                .collect(Collectors.toList());

        return new SeekerProblemListResponse(responses, page, problemPage.getTotalPages(), (int) problemPage.getTotalElements(), size);
    }

    @Transactional(readOnly = true)
    public PaginatedProblemsResponse getDiscoverableProblems(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        List<ProblemStatus> visibleStatuses = Arrays.asList(
                ProblemStatus.OPEN,
                ProblemStatus.CLAIMED,
                ProblemStatus.IN_PROGRESS,
                ProblemStatus.SOLVED_OPEN_FOR_IMPROVEMENT
        );


        Page<Problem> problemPage = problemRepository.findByStatusIn(visibleStatuses, pageable);
        if (!problemPage.hasContent()) {
            return new PaginatedProblemsResponse(List.of(), page, 0, 0, size);
        }


        List<ProblemResponse> content = problemPage.getContent().stream()
                .map(problem -> {
                    List<ProblemSubtask> subtasks = subtaskRepository.findByProblem(problem);
                    return mapToResponse(problem, subtasks, problem.getSeeker());
                })
                .collect(Collectors.toList());


        return new PaginatedProblemsResponse(
                content,
                page,
                problemPage.getTotalPages(),
                problemPage.getTotalElements(),
                size
        );
    }
}