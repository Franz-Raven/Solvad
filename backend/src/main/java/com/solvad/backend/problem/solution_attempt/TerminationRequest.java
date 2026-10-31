package com.solvad.backend.problem.solution_attempt;

import jakarta.validation.constraints.NotBlank;

public record TerminationRequest(
        @NotBlank(message = "Termination reason is required")
        String reason
) {}