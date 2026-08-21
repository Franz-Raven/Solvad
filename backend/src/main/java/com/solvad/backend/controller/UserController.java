package com.solvad.backend.controller;

import com.solvad.backend.profile.solver.SolverProfile;
import com.solvad.backend.entity.User;
import com.solvad.backend.profile.solver.SolverProfileRepository;
import com.solvad.backend.repository.UserRepository;
import com.solvad.backend.service.CloudinaryService;
import com.solvad.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SolverProfileRepository solverProfileRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

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

    @PostMapping("/me/profile-picture")
    public ResponseEntity<?> uploadProfilePicture(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        try {
            UUID userId = (UUID) authentication.getPrincipal();
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Upload to Cloudinary in the profiles folder
            String profileUrl = cloudinaryService.uploadFile(file, "profiles");

            // Update user's profile URL
            user.setProfileUrl(profileUrl);
            userRepository.save(user);

            Map<String, String> response = new HashMap<>();
            response.put("profileUrl", profileUrl);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
