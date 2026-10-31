"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ExploreProblems } from "./components/ExploreProblems";
import { MyWorkspace } from "./components/MyWorkspace";
import { SolverOverview } from "./components/SolverOverview";
import { getSolverOverviewStats} from "./api/dashboard";
import { Loader2 } from "lucide-react";

import type { SolverOverviewStats } from "@/types/attempt";
function SolverDashboardContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "home";

  // 🚀 State to hold the new lightweight, pre-calculated stats
  const [stats, setStats] = useState<SolverOverviewStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // 🚀 Only fetch the stats from the backend when the user actually opens the Overview tab
  useEffect(() => {
    if (activeTab === "overview" && !stats) {
      setLoadingStats(true);
      getSolverOverviewStats()
        .then(setStats)
        .catch((error) => console.error("Failed to fetch overview stats:", error))
        .finally(() => setLoadingStats(false));
    }
  }, [activeTab, stats]);

  return (
    <div className="min-h-screen bg-slate-50/50 pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        
        {activeTab === "home" && (
          <div className="animate-in fade-in duration-300">
            <ExploreProblems />
          </div>
        )}
        
        {activeTab === "workspace" && (
          <div className="animate-in fade-in duration-300">
            <MyWorkspace />
          </div>
        )}
        
        {activeTab === "overview" && (
          <div className="animate-in fade-in duration-300">
            {/* 🚀 FIXED: Pass 'stats' and 'loading' instead of 'attempts' */}
            <SolverOverview stats={stats} loading={loadingStats} />
          </div>
        )}

      </div>
    </div>
  );
}

export default function SolverDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50/50">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Loading Dashboard...</p>
      </div>
    }>
      <SolverDashboardContent />
    </Suspense>
  );
}