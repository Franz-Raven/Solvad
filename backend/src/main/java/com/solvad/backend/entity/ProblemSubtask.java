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

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "department_focus")
    private String departmentFocus;

    @Column(name = "sdg_focus")
    private String sdgFocus;

    public ProblemSubtask() {
    }

    public ProblemSubtask(Problem problem, String title, String description, String departmentFocus, String sdgFocus) {
        this.problem = problem;
        this.title = title;
        this.description = description;
        this.departmentFocus = departmentFocus;
        this.sdgFocus = sdgFocus;
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

    public String getSdgFocus() {
        return sdgFocus;
    }

    public void setSdgFocus(String sdgFocus) {
        this.sdgFocus = sdgFocus;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }
}
