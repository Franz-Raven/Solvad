package com.solvad.backend.auth; // Adjust package if needed

import com.solvad.backend.profile.seeker.SeekerRegisterRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin") // 🚀 Secure base path
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private AuthService authService;

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
}