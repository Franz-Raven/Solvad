"use client";

import { useMemo, useEffect, useState } from "react";
import { AreaChart, Area, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { 
  FolderOpen, 
  Layers, 
  CheckCircle2, 
  TrendingUp, 
  BarChart2, 
  Clock 
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { ProblemResponse } from "@/types/problem";
import type { ProblemStatusGroupDto, SdgDistributionDto } from "@/types/dashboard.types";
import { BarChart as SdgBarChart } from "@/components/charts/BarChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { apiRequest } from "@/lib/api";

interface SeekerOverviewProps {
  problems: ProblemResponse[];
  loading?: boolean;
}

// 6 monthly buckets
function buildMonthlyTimeline(problems: ProblemResponse[]): { month: string; posted: number }[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    const posted = problems.filter((p) => {
      const pd = new Date(p.createdAt);
      return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth();
    }).length;
    return { month: label, posted };
  });
}

/** by preferredProgram, count how many are COMPLETED. */
function buildDeptData(problems: ProblemResponse[]): { dept: string; completed: number }[] {
  const map: Record<string, number> = {};
  problems.forEach((p) => {
    if (p.status === "COMPLETED" || p.status === "SOLVED_OPEN_FOR_IMPROVEMENT") {
      const dept = p.preferredProgram ?? "Other";
      map[dept] = (map[dept] ?? 0) + 1;
    }
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([dept, completed]) => ({ dept, completed }));
}

const timelineConfig: ChartConfig = { posted: { label: "Problems posted", color: "#6366f1" } };
const deptConfig: ChartConfig = { completed: { label: "Completed", color: "#6366f1" } };

// --- UI Components ---

function StatCard({ title, value, icon, description }: { title: string; value: string | number; icon: React.ReactNode; description?: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-colors" />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-sm font-semibold text-gray-500 tracking-wide">{title}</h3>
        <div className="p-2.5 bg-gray-50 rounded-xl text-accent border border-gray-100 group-hover:bg-accent group-hover:text-white transition-colors">
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <h4 className="text-3xl font-bold text-gray-900">{value}</h4>
        {description && <p className="text-xs font-medium text-gray-400 mt-1">{description}</p>}
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, badge, children }: { title: string; subtitle?: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full hover:border-accent/20 transition-colors">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
          {subtitle && <p className="text-sm font-medium text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {badge}
      </div>
      <div className="flex-1 flex flex-col justify-end">
        {children}
      </div>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="h-10 w-10 bg-gray-100 rounded-xl" />
      </div>
      <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-32" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full flex flex-col animate-pulse min-h-[320px]">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-1/4 mb-8" />
      <div className="flex-1 flex items-end justify-between gap-3 pt-4 border-b border-l border-gray-100 pb-2 pl-2">
        {[40, 70, 45, 90, 65, 30].map((h, i) => (
          <div key={i} className="w-full bg-gray-200 rounded-t-md opacity-50" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 p-6 min-h-[200px]">
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
        <BarChart2 className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-500">{message}</p>
    </div>
  );
}

// --- Main Component ---

export function SeekerOverview({ problems, loading = false }: SeekerOverviewProps) {
  // Local state for dashboard charts (status + SDG)
  const [statusData, setStatusData] = useState<ProblemStatusGroupDto | null>(null);
  const [sdgData, setSdgData] = useState<SdgDistributionDto[] | null>(null);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const [status, sdg] = await Promise.all([
          apiRequest<ProblemStatusGroupDto>("/dashboard/status-distribution"),
          apiRequest<SdgDistributionDto[]>("/dashboard/sdg-distribution"),
        ]);
        setStatusData(status);
        setSdgData(sdg);
      } catch (err) {
        console.error("Failed to fetch chart data:", err);
      } finally {
        setChartLoading(false);
      }
    };
    fetchChartData();
  }, []);

  // Stats mapped for the top cards
  const stats = useMemo(() => {
    const total = problems.length;
    const open = problems.filter((p) => p.status === "OPEN").length;
    const inProgress = problems.filter((p) => p.status === "IN_PROGRESS" || p.status === "CLAIMED").length;
    const completed = problems.filter((p) => p.status === "COMPLETED" || p.status === "SOLVED_OPEN_FOR_IMPROVEMENT").length;
    const closed = problems.filter((p) => p.status === "CLOSED").length;
    
    const eligible = total - closed;
    const successRate = eligible > 0 ? Math.round((completed / eligible) * 100) : 0;
    
    return { total, open, inProgress, completed, successRate };
  }, [problems]);

  const timelineData = useMemo(() => buildMonthlyTimeline(problems), [problems]);
  const deptData = useMemo(() => buildDeptData(problems), [problems]);
  const totalPosted = timelineData.reduce((a, d) => a + d.posted, 0);

  // 🚀 Premium Full-Page Skeleton State
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={`stat-${i}`} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 🚀 New Top-Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Problems" 
          value={stats.total} 
          icon={<FolderOpen className="w-5 h-5" />} 
          description="Lifetime posted challenges" 
        />
        <StatCard 
          title="Seeking Solvers" 
          value={stats.open} 
          icon={<Layers className="w-5 h-5" />} 
          description="Currently accepting proposals" 
        />
        <StatCard 
          title="In Progress" 
          value={stats.inProgress} 
          icon={<Clock className="w-5 h-5" />} 
          description="Actively being worked on" 
        />
        <StatCard 
          title="Success Rate" 
          value={`${stats.successRate}%`} 
          icon={<TrendingUp className="w-5 h-5" />} 
          description={`${stats.completed} successfully solved`} 
        />
      </div>

      {/* SDG Bar Chart + Status Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartLoading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full hover:border-accent/20 transition-colors">
              <SdgBarChart sdgData={sdgData} title="Problems by SDG Focus" />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full hover:border-accent/20 transition-colors">
              <DonutChart statusData={statusData} title="Problem Status Distribution" />
            </div>
          </>
        )}
      </div>

      {/* Timeline + Program charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Problems posted over time */}
        <SectionCard 
          title="Posting Velocity" 
          subtitle="Monthly breakdown • Last 6 months" 
          badge={<span className="text-xs font-bold bg-accent/10 text-accent px-3 py-1 rounded-full uppercase tracking-wide border border-accent/20">{totalPosted} Total</span>}
        >
          {totalPosted > 0 ? (
            <ChartContainer config={timelineConfig} className="h-64 w-full mt-4">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradPosted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(99,102,241,0.08)" strokeDasharray="4 4" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#9ca3af", fontWeight: 500 }} dy={10} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#9ca3af", fontWeight: 500 }} allowDecimals={false} width={30} />
                <ChartTooltip cursor={{ stroke: "#6366f1", strokeWidth: 1, strokeDasharray: "4 4" }} content={<ChartTooltipContent indicator="line" labelKey="month" />} />
                <Area type="monotone" dataKey="posted" stroke="#6366f1" strokeWidth={3} fill="url(#gradPosted)" dot={{ r: 4, fill: "#fff", stroke: "#6366f1", strokeWidth: 2 }} activeDot={{ r: 6, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ChartContainer>
          ) : (
            <EmptyChart message="No posting history yet" />
          )}
        </SectionCard>

        {/* Completed by Program */}
        <SectionCard 
          title="Solutions by Program" 
          subtitle="Completed problems • Grouped by course"
          badge={
            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-100 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Solved</span>
            </div>
          }
        >
          {deptData.length > 0 ? (
            <ChartContainer config={deptConfig} className="h-64 w-full mt-4">
              <ReBarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
                <CartesianGrid vertical={false} stroke="rgba(99,102,241,0.08)" strokeDasharray="4 4" />
                <XAxis dataKey="dept" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#9ca3af", fontWeight: 500 }} dy={10} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#9ca3af", fontWeight: 500 }} allowDecimals={false} width={30} />
                <ChartTooltip cursor={{ fill: "rgba(99,102,241,0.05)" }} content={<ChartTooltipContent indicator="dot" />} />
                <Bar dataKey="completed" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </ReBarChart>
            </ChartContainer>
          ) : (
            <EmptyChart message="No completed problems yet" />
          )}
        </SectionCard>
      </div>
    </div>
  );
}