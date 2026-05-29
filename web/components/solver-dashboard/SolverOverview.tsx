"use client";

import { useMemo, useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { SolutionAttemptResponse } from "@/types/attempt";
import { getMyActiveAttemptsPaginated } from "@/lib/api/attempts";

const PAGE_SIZE = 5;

interface SolverOverviewProps {
  loading?: boolean;
}

// last 6 weeks (weekly attempts)
function buildWeeklyAttempts(attempts: SolutionAttemptResponse[]) {
  const weeks = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (5 - i) * 7);
    const label = `${d.toLocaleDateString("en-US", { month: "short" })} ${d.getDate()}`;
    return { week: label, count: 0 };
  });
  attempts.forEach((a) => {
    const date = new Date(a.claimedAt);
    const weekIndex = Math.floor((Date.now() - date.getTime()) / (7 * 86400000));
    if (weekIndex >= 0 && weekIndex < 6) weeks[5 - weekIndex].count++;
  });
  return weeks;
}

const timelineConfig: ChartConfig = { attempts: { label: "Attempts", color: "#6366f1" } };

function StatCard({ label, value, sub, accentClass }: { label: string; value: string | number; sub: string; accentClass: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <span className="text-xs font-semibold text-gray-400 uppercase">{label}</span>
      <p className={`text-4xl font-bold leading-none ${accentClass}`}>{value}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function SolverOverview({ loading = false }: SolverOverviewProps) {
  const [attempts, setAttempts] = useState<SolutionAttemptResponse[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAttempts();
  }, [currentPage]);

  const loadAttempts = async () => {
    try {
      setPageLoading(true);
      setError(null);
      const result = await getMyActiveAttemptsPaginated(currentPage, PAGE_SIZE);
      setAttempts(result.attempts);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load attempts");
      setAttempts([]);
    } finally {
      setPageLoading(false);
    }
  };
  const stats = useMemo(() => {
    const total = attempts.length;
    const active = attempts.filter((a) => a.status === "ACTIVE").length;
    const completed = attempts.filter((a) => a.status === "COMPLETED").length;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, active, completed, successRate };
  }, [attempts]);

  const timelineData = useMemo(() => buildWeeklyAttempts(attempts), [attempts]);
  const totalAttempts = timelineData.reduce((s, w) => s + w.count, 0);

  if (loading || pageLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-36" />
          ))}
        </div>
        <div className="animate-pulse bg-gray-100 rounded-2xl h-72" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Attempts" value={stats.total} sub="All problems claimed" accentClass="text-gray-900" />
        <StatCard label="Active Workspaces" value={stats.active} sub="Currently working on" accentClass="text-indigo-600" />
        <StatCard label="Completed" value={stats.completed} sub="Successfully solved" accentClass="text-emerald-600" />
      </div>

      <SectionCard title="Attempts Over Time" subtitle="Weekly · last 6 weeks">
        {totalAttempts > 0 ? (
          <div className="h-52 w-full">
            <ChartContainer config={timelineConfig} className="h-full w-full">
              <AreaChart data={timelineData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#6b7280" }} dy={6} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7280" }} width={28} />
                <ChartTooltip cursor={{ stroke: "#6366f1", strokeWidth: 1 }} content={<ChartTooltipContent indicator="line" />} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} fill="rgba(99,102,241,0.1)" />
              </AreaChart>
            </ChartContainer>
          </div>
        ) : (
          <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No attempt history</div>
        )}
      </SectionCard>
    </div>
  );
}