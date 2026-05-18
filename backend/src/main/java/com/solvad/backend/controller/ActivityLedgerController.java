package com.solvad.backend.controller;

import com.solvad.backend.dto.ActivityLedgerResponse;
import com.solvad.backend.service.ActivityLedgerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/problems")
@CrossOrigin(origins = "http://localhost:3000")
public class ActivityLedgerController {

    @Autowired
    private ActivityLedgerService activityLedgerService;

    @GetMapping("/{problemId}/activity")
    @PreAuthorize("hasAnyRole('SEEKER', 'SOLVER', 'ADMIN')")
    public ResponseEntity<?> getActivityFeed(@PathVariable UUID problemId) {
        try {
            List<ActivityLedgerResponse> feed = activityLedgerService.getActivityFeed(problemId);
            return ResponseEntity.ok(feed);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}