package com.solvad.backend.profile.seeker;

import com.solvad.backend.user.Role;
import com.solvad.backend.user.User;
import com.solvad.backend.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SeekerProfileService {

    @Autowired
    private SeekerProfileRepository seekerProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional(readOnly = true)
    public SeekerProfileResponse getProfileByUserId(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != Role.SEEKER) {
            throw new RuntimeException("User is not aaa seeker");
        }

        SeekerProfile profile = seekerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Seeker profile not found"));

        return mapToResponse(profile);
    }

    @Transactional(readOnly = true)
    public List<SeekerProfileResponse> getAllProfiles() {
        return seekerProfileRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SeekerProfileResponse updateProfile(UUID userId, SeekerProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != Role.SEEKER) {
            throw new RuntimeException("User is not aaa seeker");
        }

        SeekerProfile profile = seekerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Seeker profile not found"));

        profile.setOrganizationName(request.getOrganizationName());
        profile.setContactPerson(request.getContactPerson());
        profile.setContactNumber(request.getContactNumber());

        profile = seekerProfileRepository.save(profile);

        return mapToResponse(profile);
    }

    @Transactional
    public SeekerProfile createProfile(User user, String organizationName, String contactPerson) {
        if (user.getRole() != Role.SEEKER) {
            throw new RuntimeException("User is not aaa seeker");
        }

        SeekerProfile profile = new SeekerProfile();
        profile.setUser(user);
        profile.setOrganizationName(organizationName);
        profile.setContactPerson(contactPerson);

        return seekerProfileRepository.save(profile);
    }

    private SeekerProfileResponse mapToResponse(SeekerProfile profile) {
        return new SeekerProfileResponse(
                profile.getId(),
                profile.getUser().getId(),
                profile.getUser().getEmail(),
                profile.getOrganizationName(),
                profile.getContactPerson(),
                profile.getContactNumber(),
                profile.getUser().getProfileUrl()
        );
    }
}
