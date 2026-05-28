"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getMyProblems, getSeekerNotifications } from "@/lib/api/problem";
import type { ProblemResponse, SeekerNotification } from "@/types/problem";
import { SeekerOverview } from "@/components/seeker-dashboard/SeekerOverview";
import { SeekerRecentActivity } from "@/components/seeker-dashboard/SeekerRecentActivity";
import { SeekerPostedProblems } from "@/components/seeker-dashboard/SeekerPostedProblems";

export default function SeekerDashboardPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "home";
  
  const [problems, setProblems] = useState<ProblemResponse[]>([]);
  const [notifications, setNotifications] = useState<SeekerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProblems, setTotalProblems] = useState(0);

  useEffect(() => {
    Promise.all([
      getMyProblems().then(setProblems).catch(() => {}),
      getSeekerNotifications().then(setNotifications).catch(() => []),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 p-8">
      <div className="max-w-7xl mx-auto">
        {activeTab === "home" && (
          <SeekerPostedProblems onTotalChange={setTotalProblems} />
        )}
        
        {activeTab === "overview" && (
          <SeekerOverview
            problems={problems}
            loading={loading}
          />
        )}
        
        {activeTab === "activity" && (
          <SeekerRecentActivity notifications={notifications} />
        )}
      </div>
    </div>
  );
}
