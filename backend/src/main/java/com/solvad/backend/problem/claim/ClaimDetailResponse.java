package com.solvad.backend.problem.claim;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ClaimDetailResponse(
        UUID id,
        UUID problemId,
        String problemTitle,
        String targetSubtaskTitle,
        String status,
        LocalDateTime submittedAt,
        String proposalText,
        String supportingDocuments
) {}