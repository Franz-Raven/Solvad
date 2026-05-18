package com.solvad.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class SeekerProfileRequest {
    
    @NotBlank(message = "Organization name is required")
    private String organizationName;
    
    @NotBlank(message = "Contact person is required")
    private String contactPerson;

    public SeekerProfileRequest() {
    }

    public SeekerProfileRequest(String organizationName, String contactPerson) {
        this.organizationName = organizationName;
        this.contactPerson = contactPerson;
    }

    public String getOrganizationName() {
        return organizationName;
    }

    public void setOrganizationName(String organizationName) {
        this.organizationName = organizationName;
    }

    public String getContactPerson() {
        return contactPerson;
    }

    public void setContactPerson(String contactPerson) {
        this.contactPerson = contactPerson;
    }
}
