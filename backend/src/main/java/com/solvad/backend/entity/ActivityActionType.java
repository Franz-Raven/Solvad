package com.solvad.backend.entity;

public enum ActivityActionType {
    // Already existed
    STATUS_CHANGE,
    FILE_UPLOAD,
    CLAIMED,
    SOLUTION_SUBMITTED,

    // New additions for Module 3
    PROBLEM_CREATED,
    SUBTASK_UPDATED,
    DOCUMENT_DELETED
}