"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getSeekerNotifications } from "@/lib/api/problem";
import type { SeekerNotification } from "@/types/problem";
import { SeekerOverview } from "@/components/seeker-dashboard/SeekerOverview";
import { SeekerRecentActivity } from "@/components/seeker-dashboard/SeekerRecentActivity";
import { SeekerPostedProblems } from "@/components/seeker-dashboard/SeekerPostedProblems";

export default function SeekerDashboardPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "home";
  
  const [notifications, setNotifications] = useState<SeekerNotification[]>([]);
  const [totalProblems, setTotalProblems] = useState(0);

  useEffect(() => {
    getSeekerNotifications().then(setNotifications).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 p-8">
      <div className="max-w-7xl mx-auto">
        {activeTab === "home" && (
          <SeekerPostedProblems onTotalChange={setTotalProblems} />
        )}
        
        {activeTab === "overview" && (
          <SeekerOverview
            totalProblems={totalProblems}
            inProgress={0}
            solved={0}
          />
        )}
        
        {activeTab === "activity" && (
          <SeekerRecentActivity notifications={notifications} />
        )}
      </div>
    </div>
  );
}
