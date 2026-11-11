"use client";

import { AdminStatsOverview } from "./components/AdminStatsOverview";
import { AdminDashboardTabs } from "./components/AdminDashboardTabs";

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Platform-wide overview of users, problems, and activity.
          </p>
        </div>

        <AdminStatsOverview />
        <AdminDashboardTabs />
      </div>
    </div>
  );
}
