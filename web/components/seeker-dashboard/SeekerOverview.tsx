"use client";

import { useMemo } from "react";
import {AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,} from "@/components/ui/chart";
import type { ProblemResponse } from "@/types/problem";

interface SeekerOverviewProps {
  problems: ProblemResponse[];
  loading?: boolean;
}

// 6 monthly buckets
function buildMonthlyTimeline(
  problems: ProblemResponse[]
): { month: string; posted: number }[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    }); // e.g. "Jan '26"
    const posted = problems.filter((p) => {
      const pd = new Date(p.createdAt);
      return (
        pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth()
      );
    }).length;
    return { month: label, posted };
  });
}

/** by department / prefferedProgram, then count how many are COMPLETED. */
function buildDeptData(
  problems: ProblemResponse[]
): { dept: string; completed: number }[] {
  const map: Record<string, number> = {};
  problems.forEach((p) => {
    if (
      p.status === "COMPLETED" ||
      p.status === "SOLVED_OPEN_FOR_IMPROVEMENT"
    ) {
      const dept = p.preferredProgram ?? "Other";
      map[dept] = (map[dept] ?? 0) + 1;
    }
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([dept, completed]) => ({ dept, completed }));
}

const timelineConfig: ChartConfig = {
  posted: { label: "Problems posted", color: "#6366f1" },
};
 
const deptConfig: ChartConfig = {
  completed: { label: "Completed", color: "#6366f1" },
};

function StatCard({
  label,
  value,
  sub,
  accentClass,
}: {
  label: string;
  value: string | number;
  sub: string;
  accentClass: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          {label}
        </span>
      </div>
      <p className={`text-4xl font-bold leading-none ${accentClass}`}>
        {value}
      </p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}
 
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-100 rounded-2xl ${className ?? ""}`}
    />
  );
}
 
// empty state for charts
function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2">
      <svg
        className="w-9 h-9 text-gray-200"
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
        />
      </svg>
      <p className="text-sm text-gray-300">{message}</p>
    </div>
  );
}

// Main Component
export function SeekerOverview({
  problems,
  loading = false,
}: SeekerOverviewProps) {
  // Derived stats
  const stats = useMemo(() => {
    const total = problems.length;
    const open = problems.filter((p) => p.status === "OPEN").length;
    const inProgress = problems.filter(
      (p) => p.status === "IN_PROGRESS" || p.status === "CLAIMED"
    ).length;
    const completed = problems.filter(
      (p) =>
        p.status === "COMPLETED" ||
        p.status === "SOLVED_OPEN_FOR_IMPROVEMENT"
    ).length;
    const closed = problems.filter((p) => p.status === "CLOSED").length;

    // Success rate = completed / (total - closed or abandoned)
    const eligible = total - closed;
    const successRate =
      eligible > 0 ? Math.round((completed / eligible) * 100) : 0;

    return { total, open, inProgress, completed, successRate };
  }, [problems]);

  const timelineData = useMemo(
    () => buildMonthlyTimeline(problems),
    [problems]
  );

  const deptData = useMemo(() => buildDeptData(problems), [problems]);
  
  const totalPosted = timelineData.reduce((a, d) => a + d.posted, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Posted"
          value={stats.total}
          sub="All problems you have submitted"
          accentClass="text-gray-900"
        />

        <StatCard
          label="Open / Active"
          value={stats.open + stats.inProgress}
          sub={`${stats.open} open · ${stats.inProgress} in progress`}
          accentClass="text-indigo-600"
        />

        <StatCard
          label="Completed"
          value={stats.completed}
          sub="Successfully solved"
          accentClass="text-emerald-600"
        />

        <StatCard
          label="Success Rate"
          value={`${stats.successRate}%`}
          sub="Completed ÷ eligible problems"
          accentClass={
            stats.successRate >= 70
              ? "text-emerald-600"
              : stats.successRate >= 40
              ? "text-amber-500"
              : "text-rose-500"
          }
        />
      </div>
 
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 
        <SectionCard
          title="Problems Posted Over Time"
          subtitle="Monthly · last 6 months"
          badge={
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full">
              {totalPosted} total
            </span>
          }
        >
          {totalPosted > 0 ? (
            <ChartContainer config={timelineConfig} className="h-52 w-full">
              <AreaChart
                data={timelineData}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gradPosted" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="#6366f1"
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor="#6366f1"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
 
                <CartesianGrid
                  vertical={false}
                  stroke="rgba(99,102,241,0.08)"
                />
 
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  dy={6}
                />
 
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  allowDecimals={false}
                  width={28}
                />
 
                <ChartTooltip
                  cursor={{
                    stroke: "#6366f1",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      labelKey="month"
                    />
                  }
                />
 
                <Area
                  type="monotone"
                  dataKey="posted"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#gradPosted)"
                  dot={{
                    r: 4,
                    fill: "#fff",
                    stroke: "#6366f1",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                    fill: "#6366f1",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="h-52">
              <EmptyChart message="No posting history yet" />
            </div>
          )}
        </SectionCard>
 
        {/* Bar chart */}
        <SectionCard
          title="Completed by Department"
          subtitle="Problems solved · grouped by target course"
        >
          {deptData.length > 0 ? (
            <ChartContainer config={deptConfig} className="h-52 w-full">
              <BarChart
                data={deptData}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                barSize={28}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="rgba(99,102,241,0.08)"
                />
 
                <XAxis
                  dataKey="dept"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  dy={6}
                />
 
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  allowDecimals={false}
                  width={28}
                />
 
                <ChartTooltip
                  cursor={{ fill: "rgba(99,102,241,0.05)" }}
                  content={<ChartTooltipContent indicator="dot" />}
                />
 
                <Bar
                  dataKey="completed"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-52">
              <EmptyChart message="No completed problems yet" />
            </div>
          )}
        </SectionCard>
      </div>
 
      {/* Status breakdown */}
      <SectionCard title="Problem Status Breakdown">
        <div className="space-y-3">
          {(
            [
              { label: "Total",                  count: stats.total,       color: "bg-sky-400" },
              { label: "In Progress / Claimed", count: stats.inProgress, color: "bg-indigo-500" },
              { label: "Completed",    count: stats.completed,  color: "bg-emerald-500" },
              { label: "Open",                count: stats.open,     color: "bg-gray-400" },
            ] as const
          ).map(({ label, count, color }) => {
            const pct =
              stats.total > 0
                ? Math.round((count / stats.total) * 100)
                : 0;
            return (
              <div key={label} className="flex items-center gap-3">
                <span className="w-44 text-sm text-gray-500 shrink-0">
                  {label}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`${color} h-2 rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700 w-6 text-right tabular-nums">
                  {count}
                </span>
                <span className="text-xs text-gray-300 w-9 tabular-nums">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}