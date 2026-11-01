package com.solvad.backend.util;

import org.junit.jupiter.api.Test;

import java.util.LinkedHashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class KeywordUtilsTest {

    @Test
    void skillMatchScoresPhraseHitsAgainstProblemText() {
        Set<String> skills = new LinkedHashSet<>();
        skills.add("react");
        skills.add("data science");
        skills.add("agile");

        String libraryProblem = "Development of an Integrated Library Management System for digital borrowing";
        String dataProblem = "Build a data science dashboard in React for workforce analytics";

        assertEquals(0.0, KeywordUtils.skillMatch(skills, libraryProblem));
        assertEquals(2.0 / 3.0, KeywordUtils.skillMatch(skills, dataProblem), 0.001);
    }

    @Test
    void skillMatchDoesNotTreatJavaAsJavascript() {
        Set<String> skills = Set.of("java");
        assertEquals(0.0, KeywordUtils.skillMatch(skills, "Modernize a javascript frontend"));
        assertEquals(1.0, KeywordUtils.skillMatch(skills, "Rewrite the payroll service in Java"));
    }

    @Test
    void jaccardDilutesWhenProblemTagsAreLong() {
        Set<String> solver = Set.of("computer", "science");
        Set<String> bloatedTags = Set.of(
                "computer", "science", "library", "management", "system", "digital",
                "borrowing", "catalog", "students", "records", "inventory", "reports"
        );
        assertTrue(KeywordUtils.jaccard(solver, bloatedTags) < 0.2);
    }
}
