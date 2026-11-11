"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Users, GraduationCap, Building2, FolderOpen } from "lucide-react";
import type { AdminDashboardStats } from "@/types/admin";
import { getAdminStats } from "../api/dashboard";
import { PanelError } from "./AdminPanelStates";

function StatCard({ title, value, icon, description }: { title: string; value: number; icon: ReactNode; description: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-accent/5 rounded-full blur-2xl" />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-sm font-semibold text-gray-500 tracking-wide">{title}</h3>
        <div className="p-2.5 bg-gray-50 rounded-xl text-accent border border-gray-100">{icon}</div>
      </div>
      <div className="relative z-10">
        <h4 className="text-3xl font-bold text-gray-900 tabular-nums">{value.toLocaleString()}</h4>
        <p className="text-xs font-medium text-gray-400 mt-1">{description}</p>
      </div>
    </div>
  );
}

function PulseMetric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "warn" }) {
  return (
    <div className="px-5 py-4 first:pl-0 sm:border-l sm:first:border-l-0 border-slate-100">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-bold tabular-nums mt-1 ${tone === "warn" && value > 0 ? "text-amber-600" : "text-slate-900"}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
            <div className="flex justify-between mb-4">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-10 w-10 bg-gray-100 rounded-xl" />
            </div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-32" />
          </div>
        ))}
      </div>
      <div className="h-[88px] bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse" />
    </div>
  );
}

export function AdminStatsOverview() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let isActive = true;
    getAdminStats()
      .then((data) => {
        if (isActive) setStats(data);
      })
      .catch((err) => {
        if (isActive) setError(err instanceof Error ? err.message : "Failed to load stats");
      });
    return () => {
      isActive = false;
    };
  }, [reloadCount]);

  const retry = useCallback(() => {
    setError(null);
    setReloadCount((count) => count + 1);
  }, []);

  if (error) return <PanelError message={error} onRetry={retry} />;
  if (!stats) return <StatsSkeleton />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<Users className="w-5 h-5" />}
          description={`+${stats.newUsersThisWeek.toLocaleString()} joined in the last 7 days`}
        />
        <StatCard title="Solvers" value={stats.solvers} icon={<GraduationCap className="w-5 h-5" />} description="Student solvers" />
        <StatCard title="Industry Partners" value={stats.seekers} icon={<Building2 className="w-5 h-5" />} description="Registered organizations" />
        <StatCard
          title="Problems"
          value={stats.totalProblems}
          icon={<FolderOpen className="w-5 h-5" />}
          description={`${stats.openProblems.toLocaleString()} open for solvers`}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <PulseMetric label="Problems in progress" value={stats.activeProblems} />
          <PulseMetric label="Problems solved" value={stats.solvedProblems} />
          <PulseMetric label="Active attempts" value={stats.activeAttempts} />
          <PulseMetric label="Awaiting review" value={stats.pendingReviews} tone="warn" />
          <PulseMetric label="Unverified accounts" value={stats.unverifiedUsers} tone="warn" />
        </div>
      </div>
    </div>
  );
}
