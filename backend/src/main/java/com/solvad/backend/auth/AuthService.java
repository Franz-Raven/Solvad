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

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        return new AuthResponse(token, user.getId(), user.getEmail(), user.getRole(), user.getProfileUrl());
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
