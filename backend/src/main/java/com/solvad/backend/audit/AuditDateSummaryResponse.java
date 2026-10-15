package com.solvad.backend.audit;

public record AuditDateSummaryResponse(
        String date,
        String displayDate,
        long eventCount
) {}