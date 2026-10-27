package com.solvad.backend.auth;

import com.solvad.backend.profile.seeker.SeekerRegisterRequest;
import com.solvad.backend.user.Role;
import com.solvad.backend.profile.seeker.SeekerProfile;
import com.solvad.backend.profile.solver.SolverProfile;
import com.solvad.backend.profile.solver.SolverProfileRequest;
import com.solvad.backend.user.AuthProvider;
import com.solvad.backend.user.User;
import com.solvad.backend.profile.seeker.SeekerProfileRepository;
import com.solvad.backend.profile.solver.SolverProfileRepository;
import com.solvad.backend.user.UserRepository;
import com.solvad.backend.security.JwtService;
import com.solvad.backend.email.EmailService;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final long VERIFICATION_CODE_VALIDITY_MINUTES = 15;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SolverProfileRepository solverProfileRepository;

    @Autowired
    private SeekerProfileRepository seekerProfileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private EmailVerificationTokenRepository tokenRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private GoogleIdentityService googleIdentityService;

    private String generateSixDigitCode() {
        SecureRandom random = new SecureRandom();
        return String.format("%06d", random.nextInt(1_000_000));
    }

    @Transactional
    public void startSolverRegistration(RegistrationStartRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmailIgnoreCase(email).orElseGet(User::new);

        if (user.getId() != null && user.getAuthProvider() == AuthProvider.GOOGLE) {
            throw new RuntimeException("This email uses Google sign-in");
        }
        if (user.getId() != null && user.isVerified()) {
            throw new RuntimeException("Email already exists. Please sign in instead.");
        }
        if (user.getId() != null && user.getRole() != Role.SOLVER) {
            throw new RuntimeException("This email is already registered for another account type");
        }

        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.SOLVER);
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setGoogleSubject(null);
        user.setVerified(false);
        user = userRepository.save(user);
        createAndSendVerificationToken(user);
    }

    @Transactional
    public AuthResponse registerSeeker(SeekerRegisterRequest request) {
        User user = findOrCreateUnverifiedUser(request.getEmail(), request.getPassword(), Role.SEEKER);
        SeekerProfile profile = seekerProfileRepository.findByUserId(user.getId())
                .orElseGet(SeekerProfile::new);
        profile.setUser(user);
        profile.setOrganizationName(request.getOrganizationName());
        profile.setContactPerson(request.getContactPerson());
        profile.setContactNumber(request.getContactNumber());
        seekerProfileRepository.save(profile);
        createAndSendVerificationToken(user);
        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        return new AuthResponse(token, user.getId(), user.getEmail(), user.getRole(), user.getProfileUrl());
    }

    @Transactional
    public AuthResponse completeSolverProfile(UUID userId, SolverProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!user.isVerified() || user.getRole() != Role.SOLVER) {
            throw new RuntimeException("A verified solver account is required");
        }

        saveSolverProfile(user, request);
        return createAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public GoogleAuthResponse authenticateWithGoogle(String credential) {
        GoogleIdentity identity = googleIdentityService.verify(credential);
        User user = userRepository.findByGoogleSubject(identity.subject()).orElse(null);

        if (user == null) {
            user = userRepository.findByEmailIgnoreCase(normalizeEmail(identity.email())).orElse(null);
            if (user != null) {
                throw new RuntimeException(
                        "An account already exists with this email. Sign in using its original method.");
            }
            return new GoogleAuthResponse(
                    false,
                    normalizeEmail(identity.email()),
                    identity.firstName(),
                    identity.lastName(),
                    null);
        }

        if (user.getAuthProvider() != AuthProvider.GOOGLE) {
            throw new RuntimeException("This account does not use Google sign-in");
        }

        boolean profileComplete = solverProfileRepository.existsByUserId(user.getId());
        AuthResponse authResponse = profileComplete ? createAuthResponse(user) : null;
        return new GoogleAuthResponse(
                profileComplete,
                user.getEmail(),
                identity.firstName(),
                identity.lastName(),
                authResponse);
    }

    @Transactional
    public AuthResponse completeGoogleRegistration(GoogleProfileRequest request) {
        GoogleIdentity identity = googleIdentityService.verify(request.getToken());
        User user = userRepository.findByGoogleSubject(identity.subject()).orElse(null);

        if (user == null) {
            user = userRepository.findByEmailIgnoreCase(normalizeEmail(identity.email())).orElse(null);
            if (user != null) {
                throw new RuntimeException(
                        "An account already exists with this email. Sign in using its original method.");
            }

            user = new User();
            user.setEmail(normalizeEmail(identity.email()));
            user.setPassword(null);
            user.setRole(Role.SOLVER);
            user.setAuthProvider(AuthProvider.GOOGLE);
            user.setGoogleSubject(identity.subject());
            user.setVerified(true);
            user = userRepository.save(user);
        } else if (user.getAuthProvider() != AuthProvider.GOOGLE) {
            throw new RuntimeException("This account does not use Google sign-in");
        }

        if (!solverProfileRepository.existsByUserId(user.getId())) {
            saveSolverProfile(user, request);
        }
        return createAuthResponse(user);
    }

    private User findOrCreateUnverifiedUser(String email, String password, Role role) {
        Optional<User> existingUser = userRepository.findByEmailIgnoreCase(normalizeEmail(email));
        User user = existingUser.orElseGet(User::new);
        if (user.isVerified()) {
            throw new RuntimeException("Email already exists");
        }

        user.setEmail(normalizeEmail(email));
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setGoogleSubject(null);
        user.setVerified(false);
        return userRepository.save(user);
    }

    @Transactional
    public void createAndSendVerificationToken(User user) {
        String code = generateSixDigitCode();
        EmailVerificationToken token = tokenRepository.findByUser_Id(user.getId())
                .orElseGet(() -> new EmailVerificationToken());
        token.setToken(code);
        token.setUser(user);
        token.setExpiryDate(LocalDateTime.now().plusMinutes(VERIFICATION_CODE_VALIDITY_MINUTES));

        tokenRepository.save(token);
        emailService.sendVerificationEmail(user.getEmail(), code);
    }

    @Transactional
    public AuthResponse verifyEmail(String code) {
        EmailVerificationToken token = tokenRepository.findByToken(code)
                .orElseThrow(() -> new RuntimeException("Invalid code"));

        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Code expired");
        }

        User user = token.getUser();
        user.setVerified(true);
        userRepository.save(user);

        tokenRepository.delete(token);
        return createAuthResponse(user);
    }

    @Transactional
    public void resendVerificationCode(String email) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(email))
                .orElseThrow(() -> new RuntimeException("User missing"));

        if (user.isVerified()) {
            throw new RuntimeException("Already verified");
        }

        createAndSendVerificationToken(user);
    }
    
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.getEmail()))
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (user.getAuthProvider() != AuthProvider.LOCAL
                || user.getPassword() == null
                || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        if (!user.isVerified()) {
            throw new RuntimeException("Please verify your email before signing in");
        }

        return createAuthResponse(user);
    }

    private void saveSolverProfile(User user, SolverProfileRequest request) {
        SolverProfile profile = solverProfileRepository.findByUserId(user.getId())
                .orElseGet(SolverProfile::new);
        profile.setUser(user);
        profile.setFirstName(request.getFirstName().trim());
        profile.setLastName(request.getLastName().trim());
        profile.setInstitution(request.getInstitution().trim());
        profile.setDegreeProgram(request.getDegreeProgram().trim());
        profile.setSkills(resolveRegistrationSkills(request.getSkills(), request.getDegreeProgram()));
        solverProfileRepository.save(profile);
    }

    private AuthResponse createAuthResponse(User user) {
        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        AuthResponse response = new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getRole(),
                user.getProfileUrl());
        response.setProfileComplete(
                user.getRole() != Role.SOLVER || solverProfileRepository.existsByUserId(user.getId()));
        return response;
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String resolveRegistrationSkills(String skills, String degreeProgram) {
        if (skills != null && !skills.isBlank()) {
            return skills.trim();
        }
        return degreeProgram;
    }
}
