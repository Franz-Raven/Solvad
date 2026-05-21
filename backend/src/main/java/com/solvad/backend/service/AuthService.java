package com.solvad.backend.service;

import com.solvad.backend.dto.AuthResponse;
import com.solvad.backend.dto.LoginRequest;
import com.solvad.backend.dto.SeekerRegisterRequest;
import com.solvad.backend.dto.SolverRegisterRequest;
import com.solvad.backend.entity.Role;
import com.solvad.backend.entity.SeekerProfile;
import com.solvad.backend.entity.SolverProfile;
import com.solvad.backend.entity.User;
import com.solvad.backend.repository.SeekerProfileRepository;
import com.solvad.backend.repository.SolverProfileRepository;
import com.solvad.backend.repository.UserRepository;
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

        return new AuthResponse(token, user.getId(), user.getEmail(), user.getRole());
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
        seekerProfileRepository.save(profile);

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        return new AuthResponse(token, user.getId(), user.getEmail(), user.getRole());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        return new AuthResponse(token, user.getId(), user.getEmail(), user.getRole());
    }

    private String resolveRegistrationSkills(String skills, String degreeProgram) {
        if (skills != null && !skills.isBlank()) {
            return skills.trim();
        }
        return degreeProgram;
    }
}
