package com.solvad.backend.problem.GapAnalysis;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/gap-analysis")
@CrossOrigin(origins = "http://localhost:3000")
public class GapAnalysisController {

    @Autowired
    private GapAnalysisService gapAnalysisService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SEEKER', 'SOLVER', 'ADMIN')")
    public ResponseEntity<GapAnalysisResponse> generateGapAnalysis(
            @RequestBody GapAnalysisRequest request
    ) {
        try {
            GapAnalysisResponse response = gapAnalysisService.generateGapAnalysis(
                    request.newProblemId(),
                    request.historicalProblemId()
            );
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

     // GET /api/gap-analysis?newProblemId={id}&historicalProblemId={id}
    @GetMapping
    @PreAuthorize("hasAnyRole('SEEKER', 'SOLVER', 'ADMIN')")
    public ResponseEntity<GapAnalysisResponse> getGapAnalysis(
            @RequestParam("newProblemId") String newProblemId,
            @RequestParam("historicalProblemId") String historicalProblemId,
            @RequestParam(value = "refresh", defaultValue = "false") boolean refresh
    ) {
        try {
            GapAnalysisResponse response = gapAnalysisService.generateGapAnalysis(
                    java.util.UUID.fromString(newProblemId),
                    java.util.UUID.fromString(historicalProblemId),
                    refresh
            );
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}