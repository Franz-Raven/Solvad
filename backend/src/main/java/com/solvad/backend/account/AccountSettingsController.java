package com.solvad.backend.account;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/** Self-service account settings for any signed-in user (solver, seeker, or admin). */
@RestController
@RequestMapping("/api/account")
public class AccountSettingsController {

    private final AccountSettingsService accountSettingsService;

    public AccountSettingsController(AccountSettingsService accountSettingsService) {
        this.accountSettingsService = accountSettingsService;
    }

    @GetMapping("/settings")
    public ResponseEntity<?> getSettings(Authentication authentication) {
        try {
            return ResponseEntity.ok(accountSettingsService.getSettings(currentUserId(authentication)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(Authentication authentication,
                                            @Valid @RequestBody ChangePasswordRequest request) {
        try {
            accountSettingsService.changePassword(currentUserId(authentication), request);
            return ResponseEntity.ok(Map.of("message", "Password updated successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /** Return the first validation message as { message } so the frontend can show it directly. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(err -> err.getDefaultMessage())
                .orElse("Invalid request");
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }

    private static UUID currentUserId(Authentication authentication) {
        return (UUID) authentication.getPrincipal();
    }
}
