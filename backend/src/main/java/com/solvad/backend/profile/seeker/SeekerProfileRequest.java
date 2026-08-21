package com.solvad.backend.profile.seeker;

import jakarta.validation.constraints.NotBlank;

public class SeekerProfileRequest {
    
    @NotBlank(message = "Organization name is required")
    private String organizationName;
    
    @NotBlank(message = "Contact person is required")
    private String contactPerson;

    private String contactNumber;

    public SeekerProfileRequest() {
    }

    public SeekerProfileRequest(String organizationName, String contactPerson, String contactNumber) {
        this.organizationName = organizationName;
        this.contactPerson = contactPerson;
        this.contactNumber = contactNumber;
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

    public String getContactNumber() {
        return contactNumber;
    }

    public void setContactNumber(String contactNumber) {
        this.contactNumber = contactNumber;
    }
}
