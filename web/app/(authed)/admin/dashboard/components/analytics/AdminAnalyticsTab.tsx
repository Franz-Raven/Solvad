"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart as SdgBarChart } from "@/components/charts/BarChart";
import { DonutChart } from "@/components/charts/DonutChart";
import type { AdminAnalytics } from "@/types/admin";
import { getAdminAnalytics } from "../../api/dashboard";
import { PanelError } from "../AdminPanelStates";
import { ChartCardSkeleton } from "./AnalyticsCard";
import { AttemptOutcomesChart } from "./AttemptOutcomesChart";
import { PlatformActivityChart } from "./PlatformActivityChart";
import { ProgramDemandChart } from "./ProgramDemandChart";
import { TopPartnersChart } from "./TopPartnersChart";
import { UserGrowthChart } from "./UserGrowthChart";

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-slate-50/70 rounded-xl border border-slate-100 px-5 py-4">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">{value}</p>
      <p className="text-xs font-medium text-slate-500 mt-0.5">{hint}</p>
    </div>
  );
}

function percent(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—";
}

export default function AdminAnalyticsTab() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let isActive = true;
    getAdminAnalytics()
      .then((data) => {
        if (isActive) setAnalytics(data);
      })
      .catch((err) => {
        if (isActive) setError(err instanceof Error ? err.message : "Failed to load analytics");
      });
    return () => {
      isActive = false;
    };
  }, [reloadCount]);

  const retry = useCallback(() => {
    setError(null);
    setReloadCount((count) => count + 1);
  }, []);

  const kpis = useMemo(() => {
    if (!analytics) return null;
    const s = analytics.problemStatus;
    const totalProblems = s.open + s.active + s.solvedNeedsImprovement + s.completed + s.closed;
    const solved = s.solvedNeedsImprovement + s.completed;
    const totalAttempts = analytics.attemptOutcomes.reduce((sum, o) => sum + o.count, 0);
    const completedAttempts = analytics.attemptOutcomes.find((o) => o.status === "COMPLETED")?.count ?? 0;
    return {
      solveRate: percent(solved, totalProblems - s.closed),
      solved,
      attemptsPerProblem: totalProblems > 0 ? (totalAttempts / totalProblems).toFixed(1) : "—",
      totalAttempts,
      completionRate: percent(completedAttempts, totalAttempts),
      completedAttempts,
    };
  }, [analytics]);

  if (error) return <PanelError message={error} onRetry={retry} />;

  if (!analytics || !kpis) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <div key={i} className="h-[98px] bg-slate-50 rounded-xl border border-slate-100 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[0, 1, 2, 3].map((i) => <ChartCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi label="Problem solve rate" value={kpis.solveRate} hint={`${kpis.solved.toLocaleString()} solved, excluding closed`} />
        <Kpi label="Attempts per problem" value={kpis.attemptsPerProblem} hint={`${kpis.totalAttempts.toLocaleString()} attempts in total`} />
        <Kpi label="Attempt completion rate" value={kpis.completionRate} hint={`${kpis.completedAttempts.toLocaleString()} attempts completed`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserGrowthChart data={analytics.userGrowth} />
        <PlatformActivityChart data={analytics.platformActivity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart statusData={analytics.problemStatus} title="Problem Status Distribution" />
        <SdgBarChart sdgData={analytics.sdgDistribution} title="Problems by SDG Focus" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttemptOutcomesChart data={analytics.attemptOutcomes} />
        <TopPartnersChart data={analytics.topPartners} />
      </div>

      <ProgramDemandChart data={analytics.programDemand} />
    </div>
  );
}
