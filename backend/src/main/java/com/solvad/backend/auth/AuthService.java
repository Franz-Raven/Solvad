package com.solvad.backend.auth;

import com.solvad.backend.profile.seeker.SeekerRegisterRequest;
import com.solvad.backend.profile.solver.SolverRegisterRequest;
import com.solvad.backend.user.Role;
import com.solvad.backend.profile.seeker.SeekerProfile;
import com.solvad.backend.profile.solver.SolverProfile;
import com.solvad.backend.user.User;
import com.solvad.backend.profile.seeker.SeekerProfileRepository;
import com.solvad.backend.profile.solver.SolverProfileRepository;
import com.solvad.backend.user.UserRepository;
import com.solvad.backend.security.JwtService;
import com.solvad.backend.email.EmailService;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

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

    private String generateSixDigitCode() {
        SecureRandom random = new SecureRandom();
        return String.format("%06d", random.nextInt(1_000_000));
    }

    @Transactional
    public AuthResponse registerSolver(SolverRegisterRequest request) {
        User user = findOrCreateUnverifiedUser(request.getEmail(), request.getPassword(), Role.SOLVER);
        SolverProfile profile = solverProfileRepository.findByUserId(user.getId())
                .orElseGet(SolverProfile::new);
        profile.setUser(user);
        profile.setFirstName(request.getFirstName());
        profile.setLastName(request.getLastName());
        profile.setInstitution(request.getInstitution());
        profile.setDegreeProgram(request.getDegreeProgram());
        profile.setSkills(resolveRegistrationSkills(request.getSkills(), request.getDegreeProgram()));
        solverProfileRepository.save(profile);
        createAndSendVerificationToken(user);
        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        return new AuthResponse(token, user.getId(), user.getEmail(), user.getRole(), user.getProfileUrl());
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

    private User findOrCreateUnverifiedUser(String email, String password, Role role) {
        Optional<User> existingUser = userRepository.findByEmail(email);
        User user = existingUser.orElseGet(User::new);
        if (user.isVerified()) {
            throw new RuntimeException("Email already exists");
        }

        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
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
    public void verifyEmail(String code) {
        EmailVerificationToken token = tokenRepository.findByToken(code)
                .orElseThrow(() -> new RuntimeException("Invalid code"));

        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Code expired");
        }

        User user = token.getUser();
        user.setVerified(true);
        userRepository.save(user);

        tokenRepository.delete(token);
    }

    @Transactional
    public void resendVerificationCode(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User missing"));

        if (user.isVerified()) {
            throw new RuntimeException("Already verified");
        }

        createAndSendVerificationToken(user);
    }
    
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        return new AuthResponse(token, user.getId(), user.getEmail(), user.getRole(), user.getProfileUrl());
    }

    private String resolveRegistrationSkills(String skills, String degreeProgram) {
        if (skills != null && !skills.isBlank()) {
            return skills.trim();
        }
        return degreeProgram;
    }
}
