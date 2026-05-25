package com.solvad.backend.entity;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "seeker_profiles")
public class SeekerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "organization_name", nullable = false)
    private String organizationName;

    @Column(name = "contact_person", nullable = false)
    private String contactPerson;

    @Column(name = "contact_number")
    private String contactNumber;

    public SeekerProfile() {
    }

    public SeekerProfile(User user, String organizationName, String contactPerson) {
        this.user = user;
        this.organizationName = organizationName;
        this.contactPerson = contactPerson;
    }

    public SeekerProfile(User user, String organizationName, String contactPerson, String contactNumber) {
        this.user = user;
        this.organizationName = organizationName;
        this.contactPerson = contactPerson;
        this.contactNumber = contactNumber;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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
