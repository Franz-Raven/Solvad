package com.solvad.backend.controller;

import com.solvad.backend.entity.SolverProfile;
import com.solvad.backend.entity.User;
import com.solvad.backend.repository.SolverProfileRepository;
import com.solvad.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private SolverProfileRepository solverProfileRepository;

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        try {
            UUID userId = (UUID) authentication.getPrincipal();
            Optional<User> user = userService.findById(userId);
            
            if (user.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(user.get());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/me/profile")
    public ResponseEntity<?> getCurrentUserProfile(Authentication authentication) {
        try {
            UUID userId = (UUID) authentication.getPrincipal();
            Optional<SolverProfile> profile = solverProfileRepository.findByUserId(userId);
            
            if (profile.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(profile.get());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable UUID id) {
        try {
            Optional<User> user = userService.findById(id);
            
            if (user.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(user.get());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
