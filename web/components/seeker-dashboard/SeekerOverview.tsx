"use client";

import { useEffect, useRef, useMemo } from "react";
import type { ProblemResponse } from "@/types/problem";

interface SeekerOverviewProps {
  problems: ProblemResponse[];
  loading?: boolean;
}

/** Group problems by the week they were created */
function groupByWeek(problems: ProblemResponse[]): Record<string, number> {
  const map: Record<string, number> = {};
  problems.forEach((p) => {
    const d = new Date(p.createdAt);
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(
      ((d.getTime() - jan1.getTime()) / 86_400_000 + jan1.getDay() + 1) / 7
    );
    const key = `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
    map[key] = (map[key] ?? 0) + 1;
  });
  return map;
}

/** by department / prefferedProgram, then count how many are COMPLETED. */
function completedByDepartment(
  problems: ProblemResponse[]
): { labels: string[]; values: number[] } {
  const map: Record<string, number> = {};
  problems.forEach((p) => {
    if (p.status === "COMPLETED" || p.status === "SOLVED_OPEN_FOR_IMPROVEMENT") {
      const dept = p.preferredProgram || "Other";
      map[dept] = (map[dept] ?? 0) + 1;
    }
  });
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
  return {
    labels: sorted.map(([k]) => k),
    values: sorted.map(([, v]) => v),
  };
}

function LineChart({
  labels,
  values,
}: {
  labels: string[];
  values: number[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<unknown>(null);

  useEffect(() => {
    if (!canvasRef.current || typeof window === "undefined") return;

    // Dynamically import Chart.js to stay SSR-safe
    import("chart.js/auto").then(({ default: Chart }) => {
      if (chartRef.current) {
        (chartRef.current as { destroy(): void }).destroy();
      }
      chartRef.current = new Chart(canvasRef.current!, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Problems Posted",
              data: values,
              borderColor: "#6366f1",
              backgroundColor: "rgba(99,102,241,0.12)",
              borderWidth: 2.5,
              pointRadius: 4,
              pointBackgroundColor: "#6366f1",
              tension: 0.45,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#1e1b4b",
              titleColor: "#c7d2fe",
              bodyColor: "#e0e7ff",
              padding: 10,
              cornerRadius: 8,
            },
          },
          scales: {
            x: {
              grid: { color: "rgba(99,102,241,0.07)" },
              ticks: { color: "#6b7280", font: { size: 11 } },
            },
            y: {
              beginAtZero: true,
              grid: { color: "rgba(99,102,241,0.07)" },
              ticks: {
                color: "#6b7280",
                font: { size: 11 },
                stepSize: 1,
                precision: 0,
              },
            },
          },
        },
      });
    });

    return () => {
      if (chartRef.current) {
        (chartRef.current as { destroy(): void }).destroy();
      }
    };
  }, [labels, values]);

  return <canvas ref={canvasRef} />;
}

function BarChart({
  labels,
  values,
}: {
  labels: string[];
  values: number[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<unknown>(null);

  const PALETTE = [
    "#6366f1",
    "#8b5cf6",
    "#a78bfa",
    "#c4b5fd",
    "#818cf8",
    "#4f46e5",
  ];

  useEffect(() => {
    if (!canvasRef.current || typeof window === "undefined") return;

    import("chart.js/auto").then(({ default: Chart }) => {
      if (chartRef.current) {
        (chartRef.current as { destroy(): void }).destroy();
      }
      chartRef.current = new Chart(canvasRef.current!, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Completed",
              data: values,
              backgroundColor: labels.map(
                (_, i) =>
                  PALETTE[i % PALETTE.length] + "cc" // slight transparency
              ),
              borderColor: labels.map(
                (_, i) => PALETTE[i % PALETTE.length]
              ),
              borderWidth: 1.5,
              borderRadius: 6,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#1e1b4b",
              titleColor: "#c7d2fe",
              bodyColor: "#e0e7ff",
              padding: 10,
              cornerRadius: 8,
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: "#6b7280", font: { size: 11 } },
            },
            y: {
              beginAtZero: true,
              grid: { color: "rgba(99,102,241,0.07)" },
              ticks: {
                color: "#6b7280",
                font: { size: 11 },
                stepSize: 1,
                precision: 0,
              },
            },
          },
        },
      });
    });

    return () => {
      if (chartRef.current) {
        (chartRef.current as { destroy(): void }).destroy();
      }
    };
  }, [labels, values]);

  return <canvas ref={canvasRef} />;
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub: string;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500 tracking-wide uppercase">
          {label}
        </span>
      </div>
      <p className={`text-4xl font-bold ${accent} leading-none`}>{value}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-100 rounded-xl ${className ?? ""}`}
    />
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

    // Success rate = completed / (total - closed abandoned)
    const eligible = total - closed;
    const successRate =
      eligible > 0 ? Math.round((completed / eligible) * 100) : 0;

    return { total, open, inProgress, completed, successRate };
  }, [problems]);

  const timelineData = useMemo(() => {
    const grouped = groupByWeek(problems);
    const keys = Object.keys(grouped).sort();
    // Show last 8 weeks
    const last8 = keys.slice(-8);
    return { labels: last8, values: last8.map((k) => grouped[k]) };
  }, [problems]);

  const deptData = useMemo(() => completedByDepartment(problems), [problems]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Posted"
          value={stats.total}
          sub="All problems you have submitted"
          accent="text-gray-900"
        />
        <StatCard
          label="Open / Active"
          value={stats.open + stats.inProgress}
          sub={`${stats.open} open · ${stats.inProgress} in progress`}
          accent="text-indigo-600"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          sub="Successfully solved problems"
          accent="text-emerald-600"
        />
        <StatCard
          label="Success Rate"
          value={`${stats.successRate}%`}
          sub="Completed vs. total eligible"
          accent={
            stats.successRate >= 70
              ? "text-emerald-600"
              : stats.successRate >= 40
              ? "text-amber-500"
              : "text-rose-500"
          }
        />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Problems Posted Over Time</h3>
            <p className="text-xs text-gray-400 mt-0.5">Weekly — last 8 weeks</p>
          </div>
          <div className="h-52">
            {timelineData.labels.length > 0 ? (
              <LineChart
                labels={timelineData.labels}
                values={timelineData.values}
              />
            ) : (
              <EmptyChart message="No posting history yet" />
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Completed by Department</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Problems solved grouped by target course
            </p>
          </div>
          <div className="h-52">
            {deptData.labels.length > 0 ? (
              <BarChart labels={deptData.labels} values={deptData.values} />
            ) : (
              <EmptyChart message="No completed problems yet" />
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Problem Status Breakdown</h3>
        <div className="space-y-3">
          {(
            [
              { label: "Open", count: stats.open, color: "bg-sky-500" },
              { label: "In Progress / Claimed", count: stats.inProgress, color: "bg-indigo-500" },
              { label: "Completed / Solved", count: stats.completed, color: "bg-emerald-500" },
              {
                label: "Closed",
                count: problems.filter((p) => p.status === "CLOSED").length,
                color: "bg-gray-400",
              },
            ] as const
          ).map(({ label, count, color }) => {
            const pct =
              stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            return (
              <div key={label} className="flex items-center gap-3">
                <span className="w-36 text-sm text-gray-600 shrink-0">
                  {label}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`${color} h-2 rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-8 text-right">
                  {count}
                </span>
                <span className="text-xs text-gray-400 w-8">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Empty state for charts
function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-300">
      <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  );
}