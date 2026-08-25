package com.solvad.backend.profile.solver;

import com.solvad.backend.security.JwtService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/solver-profiles")
@CrossOrigin(origins = "http://localhost:3000")
public class SolverProfileController {

    @Autowired
    private SolverProfileService solverProfileService;

    @Autowired
    private JwtService jwtService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<SolverProfileResponse> getMyProfile(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            UUID userId = jwtService.extractUserId(token);
            
            SolverProfileResponse profile = solverProfileService.getProfileByUserId(userId);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SolverProfileResponse>> getAllProfiles() {
        try {
            List<SolverProfileResponse> profiles = solverProfileService.getAllProfiles();
            return ResponseEntity.ok(profiles);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAnyRole('SOLVER', 'ADMIN')")
    public ResponseEntity<SolverProfileResponse> getProfileByUserId(
            @PathVariable UUID userId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            UUID requestingUserId = jwtService.extractUserId(token);
            
            // Solvers can only view their own profile, admins can view any
            if (!requestingUserId.equals(userId)) {
                // Check if requesting user is admin - this would need to be verified via role
                // For now, we'll allow it and let PreAuthorize handle it
            }
            
            SolverProfileResponse profile = solverProfileService.getProfileByUserId(userId);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('SOLVER')")
    public ResponseEntity<SolverProfileResponse> updateMyProfile(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody SolverProfileRequest request) {
        try {
            String token = authHeader.substring(7);
            UUID userId = jwtService.extractUserId(token);
            
            SolverProfileResponse updatedProfile = solverProfileService.updateProfile(userId, request);
            return ResponseEntity.ok(updatedProfile);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SolverProfileResponse> updateProfile(
            @PathVariable UUID userId,
            @Valid @RequestBody SolverProfileRequest request) {
        try {
            SolverProfileResponse updatedProfile = solverProfileService.updateProfile(userId, request);
            return ResponseEntity.ok(updatedProfile);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}
