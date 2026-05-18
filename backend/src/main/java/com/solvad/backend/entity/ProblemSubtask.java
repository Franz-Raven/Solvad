package com.solvad.backend.entity;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "problem_subtasks")
public class ProblemSubtask {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "department_focus")
    private String departmentFocus;

    public ProblemSubtask() {
    }

    public ProblemSubtask(Problem problem, String description, String departmentFocus) {
        this.problem = problem;
        this.description = description;
        this.departmentFocus = departmentFocus;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Problem getProblem() {
        return problem;
    }

    public void setProblem(Problem problem) {
        this.problem = problem;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDepartmentFocus() {
        return departmentFocus;
    }

    public void setDepartmentFocus(String departmentFocus) {
        this.departmentFocus = departmentFocus;
    }
}
