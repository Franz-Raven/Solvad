"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getMyProblems } from "./api/dashboard";
import type { ProblemResponse } from "@/types/problem";
import { SeekerOverview } from "./components/SeekerOverview";
import { SeekerRecentActivity } from "./components/SeekerRecentActivity";
import { SeekerPostedProblems } from "./components/SeekerPostedProblems";

export default function SeekerDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 p-8" />}>
      <SeekerDashboardContent />
    </Suspense>
  );
}

function SeekerDashboardContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "home";

  const [problems, setProblems] = useState<ProblemResponse[]>([]);
  const [, setTotalProblems] = useState(0);

  useEffect(() => {
    // 🚀 FIX: We only fetch the problems here now. 
    // SeekerRecentActivity autonomously manages its own paginated notifications.
    getMyProblems()
      .then(setProblems)
      .catch((err) => console.error("Failed to load problems:", err));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 p-8">
      <div className="max-w-7xl mx-auto">
        {activeTab === "home" && (
          <SeekerPostedProblems onTotalChange={setTotalProblems} />
        )}

        {activeTab === "overview" && (
          <SeekerOverview problems={problems} loading={false} />
        )}

        {activeTab === "activity" && (
          // 🚀 FIX: Removed the conflicting props. The component fetches its own data now.
          <SeekerRecentActivity />
        )}
      </div>
    </div>
  );
}