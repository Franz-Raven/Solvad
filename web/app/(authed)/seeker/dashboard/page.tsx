"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getMyProblems, getSeekerNotifications } from "@/lib/api/problem";
import type { ProblemResponse, SeekerNotification } from "@/types/problem";
import { SeekerOverview } from "@/components/seeker-dashboard/SeekerOverview";
import { SeekerRecentActivity } from "@/components/seeker-dashboard/SeekerRecentActivity";
import { SeekerPostedProblems } from "@/components/seeker-dashboard/SeekerPostedProblems";
import AIInsightsTab from "@/components/problem-detail-seeker/AIInsightsTab";

export default function SeekerDashboardPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "home";

  const [problems, setProblems] = useState<ProblemResponse[]>([]);
  const [notifications, setNotifications] = useState<SeekerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const [problemsData, notificationsData] = await Promise.all([
        getMyProblems(),
        getSeekerNotifications().catch(() => []),
      ]);
      setProblems(problemsData);
      setNotifications(notificationsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load problems");
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: problems.length,
    inProgress: problems.filter((p) => p.status === "IN_PROGRESS").length,
    solved: problems.filter(
      (p) =>
        p.status === "SOLVED_OPEN_FOR_IMPROVEMENT" || p.status === "COMPLETED",
    ).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 p-8">
      <div className="max-w-7xl mx-auto">
        {activeTab === "home" && (
          <SeekerPostedProblems
            problems={problems}
            loading={loading}
            error={error}
          />
        )}

        {activeTab === "overview" && (
          <SeekerOverview
            totalProblems={stats.total}
            inProgress={stats.inProgress}
            solved={stats.solved}
          />
        )}

        {activeTab === "activity" && (
          <SeekerRecentActivity notifications={notifications} />
        )}
      </div>
    </div>
  );
}
