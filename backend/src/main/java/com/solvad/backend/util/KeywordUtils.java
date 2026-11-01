package com.solvad.backend.util;

import java.util.*;
import java.util.stream.Collectors;

public final class KeywordUtils {

    private KeywordUtils() {}

    public static Set<String> tokenize(String raw) {
        if (raw == null || raw.isBlank()) {
            return Collections.emptySet();
        }
        return Arrays.stream(raw.toLowerCase(Locale.ROOT).split("[^a-z0-9]+"))
                .map(String::trim)
                .filter(s -> s.length() > 2)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    public static Set<String> fromCommaList(String csv) {
        if (csv == null || csv.isBlank()) {
            return Collections.emptySet();
        }
        return Arrays.stream(csv.split(","))
                .map(s -> s.trim().toLowerCase(Locale.ROOT))
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    public static String toCommaList(Set<String> tokens) {
        return tokens.stream()
                .sorted()
                .collect(Collectors.joining(", "));
    }

    /** Jaccard similarity |A∩B| / |A∪B|, in [0, 1]. */
    public static double jaccard(Set<String> a, Set<String> b) {
        if (a.isEmpty() && b.isEmpty()) {
            return 0.0;
        }
        Set<String> union = new HashSet<>(a);
        union.addAll(b);
        if (union.isEmpty()) {
            return 0.0;
        }
        long intersection = a.stream().filter(b::contains).count();
        return (double) intersection / union.size();
    }

    public static boolean courseMatches(String solverCourse, String preferredProgram) {
        if (solverCourse == null || preferredProgram == null) {
            return false;
        }
        String a = solverCourse.trim().toLowerCase(Locale.ROOT);
        String b = preferredProgram.trim().toLowerCase(Locale.ROOT);
        if (a.isEmpty() || b.isEmpty()) {
            return false;
        }
        return a.equals(b) || a.contains(b) || b.contains(a);
    }

    /**
     * Course alignment in [0, 1]: exact/substring match scores 1.0; otherwise token overlap (Jaccard).
     */
    public static double programAlignment(String solverCourse, String preferredProgram) {
        if (courseMatches(solverCourse, preferredProgram)) {
            return 1.0;
        }
        Set<String> solverTokens = tokenize(solverCourse);
        Set<String> programTokens = tokenize(preferredProgram);
        return jaccard(solverTokens, programTokens);
    }

    /**
     * Fraction of solver skill phrases found in problem text, in [0, 1].
     * Multi-word skills match as phrases ("data science"); single-word skills match tokens
     * so "java" does not count as a hit inside "javascript".
     */
    public static double skillMatch(Set<String> skillPhrases, String haystack) {
        if (skillPhrases == null || skillPhrases.isEmpty()) {
            return 0.0;
        }
        if (haystack == null || haystack.isBlank()) {
            return 0.0;
        }
        String lower = haystack.toLowerCase(Locale.ROOT);
        Set<String> tokens = tokenize(haystack);
        long hits = 0;
        for (String skill : skillPhrases) {
            if (skill == null || skill.isBlank()) {
                continue;
            }
            String phrase = skill.trim().toLowerCase(Locale.ROOT);
            if (phrase.length() < 2) {
                continue;
            }
            boolean matched = phrase.contains(" ")
                    ? lower.contains(phrase)
                    : tokens.contains(phrase);
            if (matched) {
                hits++;
            }
        }
        return (double) hits / skillPhrases.size();
    }
}
