package com.solvad.backend.profile.solver;

import com.solvad.backend.entity.Role;
import com.solvad.backend.entity.User;
import com.solvad.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SolverProfileService {

    @Autowired
    private SolverProfileRepository solverProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional(readOnly = true)
    public SolverProfileResponse getProfileByUserId(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != Role.SOLVER) {
            throw new RuntimeException("User is not aaa solver");
        }

        SolverProfile profile = solverProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        return mapToResponse(profile);
    }

    @Transactional(readOnly = true)
    public List<SolverProfileResponse> getAllProfiles() {
        return solverProfileRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SolverProfileResponse updateProfile(UUID userId, SolverProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != Role.SOLVER) {
            throw new RuntimeException("User is not aaa solver");
        }

        SolverProfile profile = solverProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Solver profile not found"));

        profile.setFirstName(request.getFirstName());
        profile.setLastName(request.getLastName());
        profile.setInstitution(request.getInstitution());
        profile.setDegreeProgram(request.getDegreeProgram());
        profile.setSkills(request.getSkills());

        profile = solverProfileRepository.save(profile);

        return mapToResponse(profile);
    }

    private SolverProfileResponse mapToResponse(SolverProfile profile) {
        return new SolverProfileResponse(
                profile.getId(),
                profile.getUser().getId(),
                profile.getUser().getEmail(),
                profile.getFirstName(),
                profile.getLastName(),
                profile.getInstitution(),
                profile.getDegreeProgram(),
                profile.getSkills(),
                profile.getUser().getProfileUrl()
        );
    }
}
