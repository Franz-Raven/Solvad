package com.solvad.backend.problem.search;

import com.solvad.backend.problem.core.ProblemResponse;
import com.solvad.backend.problem.core.ProblemService;
import com.solvad.backend.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/problems")
@CrossOrigin(origins = "http://localhost:3000")
public class ProblemSearchController {

    @Autowired
    private ProblemService problemService;

    @Autowired
    private JwtService jwtService;

    @GetMapping("/discover")
    public ResponseEntity<PaginatedProblemsResponse> getDiscoverableProblems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PaginatedProblemsResponse response = problemService.getDiscoverableProblems(page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-problems")
    @PreAuthorize("hasRole('SEEKER')")
    public ResponseEntity<?> getMyProblems(@RequestHeader("Authorization") String authHeader) {
        try {
            UUID seekerUserId = jwtService.extractUserId(authHeader.substring(7));
            List<ProblemResponse> problems = problemService.getMyProblems(seekerUserId);
            return ResponseEntity.ok(problems);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/my-problems/search")
    @PreAuthorize("hasRole('SEEKER')")
    public ResponseEntity<?> searchMyProblems(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String sdgFilter,
            @RequestParam(required = false) String dateSort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            UUID seekerUserId = jwtService.extractUserId(authHeader.substring(7));
            PaginatedProblemsResponse response = problemService.searchMyProblems(seekerUserId, query, sdgFilter, dateSort, page, size);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/seeker/list")
    @PreAuthorize("hasRole('SEEKER')")
    public ResponseEntity<?> getSeekerProblemList(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String sdgFilter,
            @RequestParam(required = false) String dateSort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            UUID seekerUserId = jwtService.extractUserId(authHeader.substring(7));
            return ResponseEntity.ok(problemService.getSeekerProblemList(seekerUserId, query, sdgFilter, dateSort, page, size));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}