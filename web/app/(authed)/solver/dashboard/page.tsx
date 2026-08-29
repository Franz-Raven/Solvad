"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getDiscoveryDashboard } from "./api/dashboard";
import { getMyActiveAttempts } from "./api/dashboard";
import type { ProblemResponse } from "@/types/problem";
import type { SolutionAttemptResponse } from "@/types/attempt";

// Extracted Components
import { SolverOverview } from "./components/SolverOverview";
import { WorkspaceBanner } from "./components/WorkspaceBanner";
import { RecommendationsList } from "./components/RecommendationsList";
import { ExploreProblems } from "./components/ExploreProblems";
import { MyWorkspace } from "./components/MyWorkspace";

export default function SolverDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-linear-to-br from-accent/20 via-background to-accent/10 p-8" />}>
      <SolverDashboardContent />
    </Suspense>
  );
}

function SolverDashboardContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "home";

  const [recommended, setRecommended] = useState<ProblemResponse[]>([]);
  const [solverCourse, setSolverCourse] = useState("");
  const [myAttempts, setMyAttempts] = useState<SolutionAttemptResponse[]>([]);

  const [isAttemptsLoading, setIsAttemptsLoading] = useState(true);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(true);

  const loadAttempts = useCallback(async () => {
    try {
      setIsAttemptsLoading(true);
      const attemptsData = await getMyActiveAttempts().catch(() => []);
      setMyAttempts(attemptsData);
    } catch (err) {
      console.error("Failed to load attempts", err);
    } finally {
      setIsAttemptsLoading(false);
    }
  }, []);

  const loadRecommendations = useCallback(async () => {
    try {
      setIsRecommendationsLoading(true);
      const discovery = await getDiscoveryDashboard();
      setRecommended(discovery.recommended);
      setSolverCourse(discovery.solverCourse);
    } catch (err) {
      console.error("Failed to load recommendations", err);
    } finally {
      setIsRecommendationsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAttempts();
    loadRecommendations();
  }, [loadAttempts, loadRecommendations]);

  const activeAttempts = myAttempts.filter((a) => a.status === "ACTIVE");

  return (
    <div className="min-h-screen bg-linear-to-br from-accent/20 via-background to-accent/10 p-8">
      <div className="max-w-7xl mx-auto">
        {activeTab === "home" && (
          <>
            <div className="mb-10 text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Find Problems
              </h1>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                Discover industry challenges matched to your course
                {solverCourse ? <span className="font-medium text-secondary"> ({solverCourse})</span> : null} and skills.
              </p>
            </div>

            <WorkspaceBanner
              isLoading={isAttemptsLoading}
              activeCount={activeAttempts.length}
            />

            <RecommendationsList
              isLoading={isRecommendationsLoading}
              recommendations={recommended}
            />

            <ExploreProblems />
          </>
        )}

        {activeTab === "overview" && (
          <SolverOverview attempts={myAttempts} loading={isAttemptsLoading} />
        )}

        {activeTab === "workspace" && (
          <MyWorkspace />
        )}
      </div>
    </div>
  );
}