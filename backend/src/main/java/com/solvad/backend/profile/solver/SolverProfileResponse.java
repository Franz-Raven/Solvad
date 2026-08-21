package com.solvad.backend.profile.solver;

import java.util.UUID;

public class SolverProfileResponse {
    
    private UUID id;
    private UUID userId;
    private String email;
    private String firstName;
    private String lastName;
    private String institution;
    private String degreeProgram;
    private String skills;
    private String profileUrl;

    public SolverProfileResponse() {
    }

    public SolverProfileResponse(UUID id, UUID userId, String email, String firstName, String lastName, 
                                String institution, String degreeProgram, String skills) {
        this.id = id;
        this.userId = userId;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.institution = institution;
        this.degreeProgram = degreeProgram;
        this.skills = skills;
    }

    public SolverProfileResponse(UUID id, UUID userId, String email, String firstName, String lastName, 
                                String institution, String degreeProgram, String skills, String profileUrl) {
        this.id = id;
        this.userId = userId;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.institution = institution;
        this.degreeProgram = degreeProgram;
        this.skills = skills;
        this.profileUrl = profileUrl;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getInstitution() {
        return institution;
    }

    public void setInstitution(String institution) {
        this.institution = institution;
    }

    public String getDegreeProgram() {
        return degreeProgram;
    }

    public void setDegreeProgram(String degreeProgram) {
        this.degreeProgram = degreeProgram;
    }

    public String getSkills() {
        return skills;
    }

    public void setSkills(String skills) {
        this.skills = skills;
    }

    public String getProfileUrl() {
        return profileUrl;
    }

    public void setProfileUrl(String profileUrl) {
        this.profileUrl = profileUrl;
    }
}
