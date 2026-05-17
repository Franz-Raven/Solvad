package com.solvad.backend.service;

import com.solvad.backend.dto.AuthResponse;
import com.solvad.backend.dto.LoginRequest;
import com.solvad.backend.dto.RegisterRequest;
import com.solvad.backend.entity.Role;
import com.solvad.backend.entity.SolverProfile;
import com.solvad.backend.entity.User;
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
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole() != null ? request.getRole() : Role.SOLVER);

        user = userRepository.save(user);

        if (user.getRole() == Role.SOLVER) {
            SolverProfile profile = new SolverProfile();
            profile.setUser(user);
            profile.setFirstName(request.getFirstName());
            profile.setLastName(request.getLastName());
            profile.setInstitution(request.getInstitution());
            profile.setDegreeProgram(request.getDegreeProgram());
            solverProfileRepository.save(profile);
        }

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
}
