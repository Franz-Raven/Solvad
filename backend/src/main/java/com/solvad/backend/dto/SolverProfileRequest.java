package com.solvad.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class SolverProfileRequest {
    
    @NotBlank(message = "First name is required")
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    private String lastName;
    
    @NotBlank(message = "Institution is required")
    private String institution;
    
    @NotBlank(message = "Degree program is required")
    private String degreeProgram;
    
    private String skills;

    public SolverProfileRequest() {
    }

    public SolverProfileRequest(String firstName, String lastName, String institution, String degreeProgram, String skills) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.institution = institution;
        this.degreeProgram = degreeProgram;
        this.skills = skills;
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
}
