package com.solvad.backend.problem.scope;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.solvad.backend.problem.core.ProblemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/problems/scope")
@CrossOrigin(origins = "http://localhost:3000")
public class ProblemScopeController {

    @Autowired
    private ProblemService problemService;

    @PostMapping("/generate")
    @PreAuthorize("hasRole('SEEKER')")
    public ResponseEntity<?> generateScope(
            @RequestParam("data") String requestData,
            @RequestParam(value = "attachments", required = false) List<MultipartFile> attachments) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            GenerateScopeRequest request = objectMapper.readValue(requestData, GenerateScopeRequest.class);

            GenerateScopeResponse response = problemService.generateScope(request, attachments);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to process request: " + e.getMessage());
        }
    }
}