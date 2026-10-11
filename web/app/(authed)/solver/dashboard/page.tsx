"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { 
  getDiscoveryDashboard, 
  getMyActiveAttemptsCount, 
  getMyActiveAttempts 
} from "./api/dashboard";
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

  // Shared Data
  const [recommended, setRecommended] = useState<ProblemResponse[]>([]);
  const [solverCourse, setSolverCourse] = useState("");
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(true);

  // 🚀 Home Tab Data (Lightweight Integer Fetch)
  const [activeCount, setActiveCount] = useState<number>(0);
  const [isCountLoading, setIsCountLoading] = useState(true);

  // 🚀 Overview Tab Data (Heavy Payload Fetch)
  const [myAttempts, setMyAttempts] = useState<SolutionAttemptResponse[]>([]);
  const [isAttemptsLoading, setIsAttemptsLoading] = useState(true);

  // 1. Always load recommendations for the Home tab
  useEffect(() => {
    setIsRecommendationsLoading(true);
    getDiscoveryDashboard()
      .then((discovery) => {
        setRecommended(discovery.recommended);
        setSolverCourse(discovery.solverCourse);
      })
      .catch((err) => console.error("Failed to load recommendations", err))
      .finally(() => setIsRecommendationsLoading(false));
  }, []);

  // 2. Fetch the fast lightweight count ONLY for the Home tab banner
  useEffect(() => {
    if (activeTab === "home") {
      setIsCountLoading(true);
      getMyActiveAttemptsCount()
        .then(setActiveCount)
        .catch(() => setActiveCount(0))
        .finally(() => setIsCountLoading(false));
    }
  }, [activeTab]);

  // 3. LAZY-LOAD the massive JSON attempt history ONLY if they click the Overview tab
  useEffect(() => {
    if (activeTab === "overview" && myAttempts.length === 0) {
      setIsAttemptsLoading(true);
      getMyActiveAttempts()
        .then(setMyAttempts)
        .catch(() => setMyAttempts([]))
        .finally(() => setIsAttemptsLoading(false));
    }
  }, [activeTab, myAttempts.length]);

  return (
    <div className="min-h-screen bg-linear-to-br from-accent/20 via-background to-accent/10 p-8">
      <div className="max-w-7xl mx-auto">
        {activeTab === "home" && (
          <div className="animate-in fade-in duration-300">
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
              isLoading={isCountLoading}
              activeCount={activeCount}
            />

            <RecommendationsList
              isLoading={isRecommendationsLoading}
              recommendations={recommended}
            />

            <ExploreProblems />
          </div>
        )}

        {activeTab === "overview" && (
          <div className="animate-in fade-in duration-300">
            <SolverOverview attempts={myAttempts} loading={isAttemptsLoading} />
          </div>
        )}

        {activeTab === "workspace" && (
          <div className="animate-in fade-in duration-300">
            <MyWorkspace />
          </div>
        )}
      </div>
    </div>
  );
}