package com.solvad.backend.account;

import com.solvad.backend.user.AuthProvider;
import com.solvad.backend.user.User;
import com.solvad.backend.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AccountSettingsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AccountSettingsService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public AccountSettingsResponse getSettings(UUID userId) {
        User user = findUser(userId);
        return new AccountSettingsResponse(
                user.getEmail(),
                user.getRole().name(),
                user.getAuthProvider().name(),
                user.isVerified(),
                hasLocalPassword(user),
                user.getCreatedAt());
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = findUser(userId);

        if (!hasLocalPassword(user)) {
            throw new RuntimeException("This account signs in with Google and has no Solvad password to change.");
        }
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new RuntimeException("Your current password is incorrect.");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw new RuntimeException("Your new password must be different from your current password.");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
    }

    private static boolean hasLocalPassword(User user) {
        return user.getAuthProvider() == AuthProvider.LOCAL && user.getPassword() != null;
    }
}
