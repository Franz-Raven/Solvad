"use client";

import { useState, useEffect } from "react";
import { fetchSimilarityInsights } from "@/lib/api/similarity";
import type { SimilarityMatch } from "@/types/similarity";
import SimilarityWarningCard from "./SimilarityWarningCard";

interface AIInsightsTabProps {
  problemId: string;
}

export default function AIInsightsTab({ problemId }: AIInsightsTabProps) {
  const [loading, setLoading] = useState(true);
  const [hasDuplicates, setHasDuplicates] = useState(false);
  const [similarProjects, setSimilarProjects] = useState<SimilarityMatch[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSimilarity();
  }, [problemId]);

  const fetchSimilarity = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSimilarityInsights(problemId);
      setHasDuplicates(data.hasDuplicates);
      setSimilarProjects(data.similarProjects || []);
    } catch (err) {
      setError(
        "AI Similarity Insights temporarily unavailable. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-accent rounded-full animate-spin" />
        <p className="mt-4 text-gray-600">
          Analyzing against historical capstones...
        </p>
        <p className="text-sm text-gray-400 mt-1">
          This may take a few moments
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <svg
          className="w-12 h-12 text-red-500 mx-auto mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-red-700">{error}</p>
        <button
          onClick={fetchSimilarity}
          className="mt-4 px-4 py-2 bg-accent text-white rounded-lg hover:bg-secondary transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!hasDuplicates || similarProjects.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Verified Unique
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          No highly similar problems found in the repository. This appears to be
          an original problem statement.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h3 className="font-semibold text-gray-900">
              Similar Problems Detected
            </h3>
            <p className="text-sm text-gray-700">
              Found {similarProjects.length} project
              {similarProjects.length > 1 ? "s" : ""} with ≥85% semantic
              similarity. Review these before proceeding to ensure your problem
              is unique.
            </p>
          </div>
        </div>
      </div>

      {similarProjects.map((project) => (
        <SimilarityWarningCard
          key={project.HistoricalProblemId}
          HistoricalProblemId={project.HistoricalProblemId}
          HistoricalTitle={project.HistoricalTitle}
          SimilarityPercentage={project.SimilarityPercentage}
        />
      ))}
    </div>
  );
}
