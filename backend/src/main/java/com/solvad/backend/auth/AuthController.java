package com.solvad.backend.auth;

import com.solvad.backend.profile.seeker.SeekerRegisterRequest;
import com.solvad.backend.profile.solver.SolverRegisterRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register/solver")
    public ResponseEntity<?> registerSolver(@Valid @RequestBody SolverRegisterRequest request) {
        try {
            AuthResponse response = authService.registerSolver(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/register/seeker")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> registerSeeker(@Valid @RequestBody SeekerRegisterRequest request) {
        try {
            AuthResponse response = authService.registerSeeker(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok("Logged out successfully");
    }
}
