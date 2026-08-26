"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { 
  Target, 
  Activity, 
  CheckCircle2, 
  TrendingUp, 
  BarChart2 
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { SolutionAttemptResponse } from "@/types/attempt";

interface SolverOverviewProps {
  attempts: SolutionAttemptResponse[];
  loading?: boolean;
}

// Last 6 weeks (weekly attempts)
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
      <div className="h-6 bg-gray-200 rounded w-1/4 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-1/3 mb-8" />
      <div className="flex-1 flex items-end justify-between gap-4 pt-4 border-b border-l border-gray-100 pb-2 pl-2">
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

export function SolverOverview({ attempts, loading = false }: SolverOverviewProps) {
  const stats = useMemo(() => {
    const total = attempts.length;
    const active = attempts.filter((a) => a.status === "ACTIVE").length;
    const completed = attempts.filter((a) => a.status === "COMPLETED").length;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, active, completed, successRate };
  }, [attempts]);

  const timelineData = useMemo(() => buildWeeklyAttempts(attempts), [attempts]);
  const totalAttempts = timelineData.reduce((s, w) => s + w.count, 0);

  // 🚀 Premium Full-Page Skeleton State
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatSkeleton key={`stat-${i}`} />
          ))}
        </div>
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 🚀 New Top-Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Attempts" 
          value={stats.total} 
          icon={<Target className="w-5 h-5" />} 
          description="All problems you've claimed" 
        />
        <StatCard 
          title="Active Workspaces" 
          value={stats.active} 
          icon={<Activity className="w-5 h-5" />} 
          description="Currently in progress" 
        />
        <StatCard 
          title="Completed" 
          value={stats.completed} 
          icon={<CheckCircle2 className="w-5 h-5" />} 
          description="Successfully solved" 
        />
        <StatCard 
          title="Success Rate" 
          value={`${stats.successRate}%`} 
          icon={<TrendingUp className="w-5 h-5" />} 
          description="Ratio of solved problems" 
        />
      </div>

      {/* Attempts Timeline Chart */}
      <SectionCard 
        title="Attempts Over Time" 
        subtitle="Weekly breakdown • Last 6 weeks"
        badge={
          <span className="text-xs font-bold bg-accent/10 text-accent px-3 py-1 rounded-full uppercase tracking-wide border border-accent/20">
            {totalAttempts} Total
          </span>
        }
      >
        {totalAttempts > 0 ? (
          <div className="h-64 w-full mt-4">
            <ChartContainer config={timelineConfig} className="h-full w-full">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradAttempts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(99,102,241,0.08)" strokeDasharray="4 4" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#9ca3af", fontWeight: 500 }} dy={10} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#9ca3af", fontWeight: 500 }} allowDecimals={false} width={30} />
                <ChartTooltip cursor={{ stroke: "#6366f1", strokeWidth: 1, strokeDasharray: "4 4" }} content={<ChartTooltipContent indicator="line" />} />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  fill="url(#gradAttempts)" 
                  dot={{ r: 4, fill: "#fff", stroke: "#6366f1", strokeWidth: 2 }} 
                  activeDot={{ r: 6, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }} 
                />
              </AreaChart>
            </ChartContainer>
          </div>
        ) : (
          <EmptyChart message="No attempt history recorded yet." />
        )}
      </SectionCard>
    </div>
  );
}