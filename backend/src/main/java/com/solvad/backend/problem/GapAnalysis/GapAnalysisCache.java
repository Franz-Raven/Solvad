package com.solvad.backend.problem.GapAnalysis;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "gap_analysis_cache")
public class GapAnalysisCache {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "analysis_id")
    private UUID analysisId;

    @Column(name = "source_problem_id", nullable = false)
    private UUID sourceProblemId;

    @Column(name = "matched_historical_problem_id", nullable = false)
    private UUID matchedHistoricalProblemId;

    @Column(name = "feature_differences", columnDefinition = "TEXT")
    private String featureDifferences;  // JSON array stored as text

    @Column(name = "technical_deviations", columnDefinition = "TEXT")
    private String technicalDeviations;  // JSON array stored as text

    @Column(name = "unique_contributions", columnDefinition = "TEXT")
    private String uniqueContributions;  // JSON array stored as text

    @CreationTimestamp
    @Column(name = "generated_at", updatable = false)
    private LocalDateTime generatedAt;

    @Column(columnDefinition = "TEXT")
    private String executiveSummary;

    @Column(columnDefinition = "TEXT")
    private String recommendation;

    public GapAnalysisCache() {}

    public GapAnalysisCache(UUID sourceProblemId, UUID matchedHistoricalProblemId,
                            String featureDifferences, String technicalDeviations,
                            String uniqueContributions) {
        this.sourceProblemId = sourceProblemId;
        this.matchedHistoricalProblemId = matchedHistoricalProblemId;
        this.featureDifferences = featureDifferences;
        this.technicalDeviations = technicalDeviations;
        this.uniqueContributions = uniqueContributions;
    }

    public GapAnalysisCache(UUID sourceProblemId, UUID matchedHistoricalProblemId,
                            String featureDifferences, String technicalDeviations,
                            String uniqueContributions,
                            String executiveSummary, String recommendation) {
        this(sourceProblemId, matchedHistoricalProblemId, featureDifferences,
                technicalDeviations, uniqueContributions);
        this.executiveSummary = executiveSummary;
        this.recommendation = recommendation;
    }

    public UUID getAnalysisId() { return analysisId; }
    public void setAnalysisId(UUID analysisId) { this.analysisId = analysisId; }

    public UUID getSourceProblemId() { return sourceProblemId; }
    public void setSourceProblemId(UUID sourceProblemId) { this.sourceProblemId = sourceProblemId; }

    public UUID getMatchedHistoricalProblemId() { return matchedHistoricalProblemId; }
    public void setMatchedHistoricalProblemId(UUID id) { this.matchedHistoricalProblemId = id; }

    public String getFeatureDifferences() { return featureDifferences; }
    public void setFeatureDifferences(String featureDifferences) {
        this.featureDifferences = featureDifferences;
    }

    public String getTechnicalDeviations() { return technicalDeviations; }
    public void setTechnicalDeviations(String technicalDeviations) {
        this.technicalDeviations = technicalDeviations;
    }

    public String getUniqueContributions() { return uniqueContributions; }
    public void setUniqueContributions(String uniqueContributions) {
        this.uniqueContributions = uniqueContributions;
    }

    public LocalDateTime getGeneratedAt() { return generatedAt; }

    public String getExecutiveSummary() { return executiveSummary; }

    public void setExecutiveSummary(String executiveSummary) { this.executiveSummary = executiveSummary; }

    public String getRecommendation() { return recommendation; }

    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }
}