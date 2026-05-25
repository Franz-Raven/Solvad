package com.solvad.backend.dto;

import java.util.UUID;

public class SeekerProfileResponse {
    
    private UUID id;
    private UUID userId;
    private String email;
    private String organizationName;
    private String contactPerson;
    private String contactNumber;
    private String profileUrl;

    public SeekerProfileResponse() {
    }

    public SeekerProfileResponse(UUID id, UUID userId, String email, String organizationName, String contactPerson, String contactNumber) {
        this.id = id;
        this.userId = userId;
        this.email = email;
        this.organizationName = organizationName;
        this.contactPerson = contactPerson;
        this.contactNumber = contactNumber;
    }

    public SeekerProfileResponse(UUID id, UUID userId, String email, String organizationName, String contactPerson, String contactNumber, String profileUrl) {
        this.id = id;
        this.userId = userId;
        this.email = email;
        this.organizationName = organizationName;
        this.contactPerson = contactPerson;
        this.contactNumber = contactNumber;
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

    public String getProfileUrl() {
        return profileUrl;
    }

    public void setProfileUrl(String profileUrl) {
        this.profileUrl = profileUrl;
    }
}
