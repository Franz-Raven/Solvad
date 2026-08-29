"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getMyProblems } from "./api/dashboard";
import { getSeekerNotifications } from "./api/dashboard";
import type { ProblemResponse, SeekerNotification } from "@/types/problem";
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
  const [notifications, setNotifications] = useState<SeekerNotification[]>([]);
  const [totalProblems, setTotalProblems] = useState(0);
  const [isFetchingNotifications, setIsFetchingNotifications] = useState(true);

  useEffect(() => {
    setIsFetchingNotifications(true);

    Promise.all([
      getMyProblems().then(setProblems).catch(() => {}),
      getSeekerNotifications().then(setNotifications).catch(() => []),
    ]).finally(() => {
      setIsFetchingNotifications(false);
    });
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
          <SeekerRecentActivity
            notifications={notifications}
            isLoading={isFetchingNotifications}
          />
        )}
      </div>
    </div>
  );
}
