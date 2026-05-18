package com.solvad.backend.service;

import com.solvad.backend.dto.ActivityLedgerResponse;
import com.solvad.backend.entity.ActivityActionType;
import com.solvad.backend.entity.ActivityLedger;
import com.solvad.backend.entity.Problem;
import com.solvad.backend.entity.Role;
import com.solvad.backend.entity.SeekerProfile;
import com.solvad.backend.entity.SolverProfile;
import com.solvad.backend.entity.User;
import com.solvad.backend.repository.ActivityLedgerRepository;
import com.solvad.backend.repository.ProblemRepository;
import com.solvad.backend.repository.SeekerProfileRepository;
import com.solvad.backend.repository.SolverProfileRepository;
import com.solvad.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ActivityLedgerService {

    @Autowired
    private ActivityLedgerRepository activityLedgerRepository;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SolverProfileRepository solverProfileRepository;

    @Autowired
    private SeekerProfileRepository seekerProfileRepository;

    /**
     * Core logging method. Called internally by other services — never directly by controllers.
     * Runs within the caller's existing @Transactional context.
     */
    @Transactional
    public void log(UUID actorUserId, UUID problemId, ActivityActionType actionType,
                    String description, String metadata) {

        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found: " + problemId));

        User actor = userRepository.findById(actorUserId)
                .orElseThrow(() -> new RuntimeException("User not found: " + actorUserId));

        ActivityLedger entry = new ActivityLedger(problem, actor, actionType, description);
        entry.setMetadata(metadata);
        activityLedgerRepository.save(entry);
    }

    /**
     * Convenience overload for events that have no metadata.
     */
    @Transactional
    public void log(UUID actorUserId, UUID problemId, ActivityActionType actionType, String description) {
        log(actorUserId, problemId, actionType, description, null);
    }

    /**
     * Returns the full activity feed for a problem, newest first.
     */
    @Transactional(readOnly = true)
    public List<ActivityLedgerResponse> getActivityFeed(UUID problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found: " + problemId));

        return activityLedgerRepository.findByProblemOrderByTimestampDesc(problem)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ActivityLedgerResponse mapToResponse(ActivityLedger entry) {
        User actor = entry.getActor();
        String actorName = resolveActorName(actor);
        String actorRole = actor.getRole().name();

        return new ActivityLedgerResponse(
                entry.getId(),
                entry.getProblem().getId(),
                actor.getId(),
                actorName,
                actorRole,
                entry.getActionType().name(),
                entry.getDescription(),
                entry.getMetadata(),
                entry.getTimestamp()
        );
    }

    /**
     * Resolves a display name from whichever profile the user has.
     * Seekers use contactPerson, Solvers use firstName + lastName.
     */
    private String resolveActorName(User actor) {
        if (actor.getRole() == Role.SOLVER) {
            return solverProfileRepository.findByUserId(actor.getId())
                    .map(p -> p.getFirstName() + " " + p.getLastName())
                    .orElse(actor.getEmail());
        } else if (actor.getRole() == Role.SEEKER) {
            return seekerProfileRepository.findByUserId(actor.getId())
                    .map(SeekerProfile::getContactPerson)
                    .orElse(actor.getEmail());
        }
        return actor.getEmail(); // ADMIN fallback
    }
}