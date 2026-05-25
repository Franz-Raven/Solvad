package com.solvad.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.solvad.backend.dto.GapAnalysisResponse;
import com.solvad.backend.entity.GapAnalysisCache;
import com.solvad.backend.entity.Problem;
import com.solvad.backend.repository.GapAnalysisRepository;
import com.solvad.backend.repository.ProblemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class GapAnalysisService {

    @Autowired
    private GapAnalysisRepository gapAnalysisRepository;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private ObjectMapper objectMapper;  // For JSON serialization/deserialization

    public GapAnalysisResponse generateGapAnalysis(UUID newProblemId, UUID historicalProblemId) {
        // Check cache
        if (gapAnalysisRepository.existsBySourceProblemIdAndMatchedHistoricalProblemId(
                newProblemId, historicalProblemId)) {
            return getCachedGapAnalysis(newProblemId, historicalProblemId);
        }

        Problem newProblem = problemRepository.findById(newProblemId)
                .orElseThrow(() -> new RuntimeException("New problem not found: " + newProblemId));

        Problem historicalProblem = problemRepository.findById(historicalProblemId)
                .orElseThrow(() -> new RuntimeException("Historical problem not found: " + historicalProblemId));

        // call Gemini API
        GapAnalysisResponse response = performGapAnalysis(newProblem, historicalProblem);

        cacheGapAnalysis(newProblemId, historicalProblemId, response);

        return response;
    }

     // Retrieve cached gap analysis
    private GapAnalysisResponse getCachedGapAnalysis(UUID newProblemId, UUID historicalProblemId) {
        GapAnalysisCache cache = gapAnalysisRepository
                .findBySourceProblemIdAndMatchedHistoricalProblemId(newProblemId, historicalProblemId)
                .orElseThrow(() -> new RuntimeException("Cache not found"));

        if (cache.getExecutiveSummary() == null || cache.getRecommendation() == null) {
            gapAnalysisRepository.delete(cache);
            // Re-fetch from Gemini
            Problem newProblem = problemRepository.findById(newProblemId).orElseThrow();
            Problem historicalProblem = problemRepository.findById(historicalProblemId).orElseThrow();
            GapAnalysisResponse freshResponse = performGapAnalysis(newProblem, historicalProblem);
            cacheGapAnalysis(newProblemId, historicalProblemId, freshResponse);
            return freshResponse;
        }
        try {
            // Deserialize JSON arrays from TEXT columns
            List<String> features = objectMapper.readValue(
                    cache.getFeatureDifferences(),
                    new TypeReference<>() {
                    }
            );
            List<String> technical = objectMapper.readValue(
                    cache.getTechnicalDeviations(),
                    new TypeReference<>() {
                    }
            );
            List<String> unique = objectMapper.readValue(
                    cache.getUniqueContributions(),
                    new TypeReference<>() {
                    }
            );

            return new GapAnalysisResponse(
                    cache.getExecutiveSummary(),
                    features,
                    technical,
                    unique,
                    cache.getRecommendation()
            );

        } catch (Exception e) {
            throw new RuntimeException("Failed to deserialize cached gap analysis", e);
        }
    }

    private GapAnalysisResponse performGapAnalysis(Problem newProblem, Problem historicalProblem) {
        try {
            // Call Gemini service
            String prompt = buildGapAnalysisPrompt(newProblem, historicalProblem);
            String geminiResponse = geminiService.callGeminiAPI(prompt);

            return parseGapAnalysisResponse(geminiResponse);

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate gap analysis: " + e.getMessage(), e);
        }
    }

     // comparison prompt for Gemini
    private String buildGapAnalysisPrompt(Problem newProblem, Problem historicalProblem) {
        String newDescription = newProblem.getBackgroundContext() + "\n" + newProblem.getPrimaryStatement();
        String historicalDescription = historicalProblem.getBackgroundContext() + "\n" + historicalProblem.getPrimaryStatement();

        return """
            You are an expert technical analyst comparing two problem specifications.
            
            Generate a comprehensive Gap Analysis Report with the following structure:
            
            1. EXECUTIVE_SUMMARY: A 2-3 sentence overview of key differences
            2. FEATURE_DIFFERENCES: List of functional features present in one but not the other
            3. TECHNICAL_DEVIATIONS: List of technology stack and architecture differences
            4. UNIQUE_CONTRIBUTIONS: List of novel aspects in the NEW problem
            5. RECOMMENDATION: Whether the new problem is sufficiently unique (YES/NO with brief justification)
            
            NEW PROBLEM:
            Title: %s
            Description: %s
            Objectives: %s
            Target Course: %s
            
            HISTORICAL PROBLEM:
            Title: %s
            Description: %s
            Objectives: %s
            Target Course: %s
            
            Return ONLY valid JSON in this exact format:
            {
              "executiveSummary": "...",
              "featureDifferences": ["...", "..."],
              "technicalDeviations": ["...", "..."],
              "uniqueContributions": ["...", "..."],
              "recommendation": "..."
            }
            """.formatted(
                newProblem.getTitle(),
                newDescription,
                newProblem.getObjectives() != null ? newProblem.getObjectives() : "N/A",
                newProblem.getPreferredProgram(),
                historicalProblem.getTitle(),
                historicalDescription,
                historicalProblem.getObjectives() != null ? historicalProblem.getObjectives() : "N/A",
                historicalProblem.getPreferredProgram()
        );
    }

     // Parse Gemini API response into structured DTO
    private GapAnalysisResponse parseGapAnalysisResponse(String geminiResponse) {
        try {
            // Remove Markdown code fences if present
            String cleaned = geminiResponse
                    .replaceAll("```json", "")
                    .replaceAll("```", "")
                    .trim();

            // Parse JSON response
            return objectMapper.readValue(cleaned, GapAnalysisResponse.class);

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse gap analysis response: " + e.getMessage(), e);
        }
    }

     // Cache gap analysis result to database
    private void cacheGapAnalysis(UUID newProblemId, UUID historicalProblemId,
                                  GapAnalysisResponse response) {
        try {
            // Serialize lists to JSON strings
            String features = objectMapper.writeValueAsString(response.featureDifferences());
            String technical = objectMapper.writeValueAsString(response.technicalDeviations());
            String unique = objectMapper.writeValueAsString(response.uniqueContributions());

            GapAnalysisCache cache = new GapAnalysisCache(
                    newProblemId,
                    historicalProblemId,
                    features,
                    technical,
                    unique,
                    response.executiveSummary(),
                    response.recommendation()
            );

            gapAnalysisRepository.save(cache);

        } catch (Exception e) {
            System.err.println("Failed to cache gap analysis: " + e.getMessage());
        }
    }
}