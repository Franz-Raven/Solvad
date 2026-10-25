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

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

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
        int number = random.nextInt(999999);
        return String.format("%06d", number)
        ;
    }

    @Transactional
    public AuthResponse registerSolver(SolverRegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.SOLVER);

        user = userRepository.save(user);

        SolverProfile profile = new SolverProfile();
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
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.SEEKER);

        user = userRepository.save(user);

        SeekerProfile profile = new SeekerProfile();
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
    public void createAndSendVerificationToken(User user) {
        String code = generateSixDigitCode();
        EmailVerificationToken token = tokenRepository.findByUser_Id(user.getId())
                .orElseGet(() -> new EmailVerificationToken());
        token.setToken(code);
        token.setUser(user);
        token.setExpiryDate(LocalDateTime.now().plusMinutes(15));

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
