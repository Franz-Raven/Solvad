package com.solvad.backend.problem.event;

import java.util.UUID;

public class ProblemCreatedEvent {
    private final UUID problemId;

    public ProblemCreatedEvent(UUID problemId) {
        this.problemId = problemId;
    }

    public UUID getProblemId() { return problemId; }
}