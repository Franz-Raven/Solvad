package com.solvad.backend.audit;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/audit")
@CrossOrigin(origins = "*")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    // 🚀 Endpoint 1: Fetches ONLY the accordion headers (dates & counts)
    @GetMapping("/problem/{problemId}/summary")
    public ResponseEntity<List<AuditDateSummaryResponse>> getSummaries(@PathVariable UUID problemId) {
        return ResponseEntity.ok(auditService.getAuditSummaries(problemId));
    }

    // 🚀 Endpoint 2: Lazy loads the exact logs when a user clicks a specific date
    @GetMapping("/problem/{problemId}")
    public ResponseEntity<List<AuditLogResponse>> getLogsByDate(
            @PathVariable UUID problemId,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(auditService.getAuditLogsByDate(problemId, date));
    }
}