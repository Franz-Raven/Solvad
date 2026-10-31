"use client";

import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { 
  Target, 
  Activity, 
  CheckCircle2, 
  TrendingUp, 
  BarChart2,
  Shield, 
  ShieldCheck, 
  Circle,
  Info,
  X
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { SolverOverviewStats } from "@/types/attempt";
import Portal from "@/components/portal"; // 🚀 Imported Portal to fix the fixed positioning bug

interface SolverOverviewProps {
  stats: SolverOverviewStats | null; 
  loading?: boolean;
}

// --- Rank Details specific to the large Banner ---
const getBannerTierDetails = (completed: number) => {
  if (completed >= 10) return { 
    name: "Elite Solver", 
    min: 10,
    icon: <Shield className="w-10 h-10 text-white" fill="currentColor" />, 
    iconBg: "bg-emerald-600",
  };
  
  if (completed >= 5) return { 
    name: "Proven Solver", 
    min: 5,
    icon: <ShieldCheck className="w-10 h-10 text-emerald-700" />, 
    iconBg: "bg-emerald-100",
  };
  
  if (completed >= 1) return { 
    name: "Contributor", 
    min: 1,
    icon: <Shield className="w-10 h-10 text-emerald-600" />, 
    iconBg: "bg-emerald-50",
  };
  
  return { 
    name: "Initiate", 
    min: 0,
    icon: <Circle className="w-10 h-10 text-slate-400" />, 
    iconBg: "bg-slate-100",
  };
};

const getNextRank = (completed: number) => {
  const thresholds = [10, 5, 1, 0];
  const names = ["Elite Solver", "Proven Solver", "Contributor", "Initiate"];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (thresholds[i] > completed) {
      return { name: names[i], min: thresholds[i] };
    }
  }
  return null;
};

const timelineConfig: ChartConfig = { attempts: { label: "Attempts", color: "#10b981" } };

// --- UI Components ---
function StatCard({ title, value, icon, description }: { title: string; value: string | number; icon: React.ReactNode; description?: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden transition-colors">
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="text-sm font-bold text-slate-600 tracking-wide">{title}</h3>
        <div className="p-2 bg-emerald-50/50 rounded-full text-emerald-500 border border-emerald-100/50">
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <h4 className="text-3xl font-bold text-slate-900">{value}</h4>
        {description && <p className="text-xs font-medium text-slate-500 mt-2">{description}</p>}
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, badge, children }: { title: string; subtitle?: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col h-full transition-all">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
          {subtitle && <p className="text-sm font-medium text-slate-500 mt-0.5">{subtitle}</p>}
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
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="h-4 bg-slate-200 rounded w-24" />
        <div className="h-10 w-10 bg-slate-100 rounded-full" />
      </div>
      <div className="h-8 bg-slate-200 rounded w-16 mb-2" />
      <div className="h-3 bg-slate-100 rounded w-32" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-full flex flex-col animate-pulse min-h-[320px]">
      <div className="h-6 bg-slate-200 rounded w-1/4 mb-2" />
      <div className="h-4 bg-slate-100 rounded w-1/3 mb-8" />
      <div className="flex-1 flex items-end justify-between gap-4 pt-4 border-b border-l border-slate-100 pb-2 pl-2">
        {[40, 70, 45, 90, 65, 30].map((h, i) => (
          <div key={i} className="w-full bg-slate-200 rounded-t-md opacity-50" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 p-6 min-h-[200px]">
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
        <BarChart2 className="w-6 h-6 text-slate-300" />
      </div>
      <p className="text-sm font-bold text-slate-500">{message}</p>
    </div>
  );
}

// --- Main Component ---
export function SolverOverview({ stats, loading = false }: SolverOverviewProps) {
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);

  // If loading or if stats failed to load, show skeleton
  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm h-32 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatSkeleton key={`stat-${i}`} />
          ))}
        </div>
        <ChartSkeleton />
      </div>
    );
  }

  // Read directly from the backend DTO
  const tier = getBannerTierDetails(stats.completedSolutions);
  const nextRank = getNextRank(stats.completedSolutions);
  const totalRecentAttempts = stats.timelineData.reduce((s, w) => s + w.count, 0);

  return (
    // 🚀 FIXED: Removed pb-16 to prevent double-padding which exacerbates layout gaps
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* --- Rank Modal --- */}
      {isRankModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsRankModalOpen(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Solver Tiers & Ranking</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">Learn how to level up your profile.</p>
                </div>
                <button onClick={() => setIsRankModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                 
                 <div className="flex items-start gap-4">
                   <div className="w-12 h-12 rounded-[14px] bg-emerald-600 shrink-0 flex items-center justify-center shadow-sm">
                     <Shield className="w-6 h-6 text-white" fill="currentColor" />
                   </div>
                   <div>
                     <h4 className="font-bold text-slate-900 flex items-center gap-2">Elite Solver <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">10+ Solutions</span></h4>
                     <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">The highest tier. Represents deep expertise, proven reliability, and consistent delivery of top-tier industry solutions.</p>
                   </div>
                 </div>
                 
                 <div className="flex items-start gap-4">
                   <div className="w-12 h-12 rounded-[14px] bg-emerald-100 shrink-0 flex items-center justify-center border border-emerald-200/50">
                     <ShieldCheck className="w-6 h-6 text-emerald-700" />
                   </div>
                   <div>
                     <h4 className="font-bold text-slate-900 flex items-center gap-2">Proven Solver <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">5+ Solutions</span></h4>
                     <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">Demonstrated reliability across multiple successful project completions. A trusted problem solver.</p>
                   </div>
                 </div>
                 
                 <div className="flex items-start gap-4">
                   <div className="w-12 h-12 rounded-[14px] bg-emerald-50 shrink-0 flex items-center justify-center border border-emerald-200/50">
                     <Shield className="w-6 h-6 text-emerald-600" />
                   </div>
                   <div>
                     <h4 className="font-bold text-slate-900 flex items-center gap-2">Contributor <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">1+ Solutions</span></h4>
                     <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">Successfully finalized at least one industry problem and started building a track record.</p>
                   </div>
                 </div>
                 
                 <div className="flex items-start gap-4">
                   <div className="w-12 h-12 rounded-[14px] bg-slate-50 shrink-0 flex items-center justify-center border border-slate-200">
                     <Circle className="w-6 h-6 text-slate-400" />
                   </div>
                   <div>
                     <h4 className="font-bold text-slate-900 flex items-center gap-2">Initiate <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">0 Solutions</span></h4>
                     <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">New to the platform. Ready to claim a problem and make an impact.</p>
                   </div>
                 </div>

              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <button onClick={() => setIsRankModalOpen(false)} className="px-5 py-2.5 font-bold text-sm bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors shadow-sm active:scale-95 cursor-pointer">
                  Close
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* --- Rank & Reliability Banner --- */}
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6 justify-between transition-colors">
        
        <div className="flex items-center gap-6 w-full md:w-auto">
           <div className={`w-20 h-20 rounded-[20px] ${tier.iconBg} shrink-0 flex items-center justify-center`}>
             {tier.icon}
           </div>
           <div>
             <div className="flex items-center gap-3 mb-2">
               <h2 className="text-2xl font-bold text-slate-900">{tier.name}</h2>
               <button 
                 onClick={() => setIsRankModalOpen(true)}
                 className="p-1.5 rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                 title="View Rank Details"
               >
                 <Info className="w-5 h-5" />
               </button>
             </div>
             <div className="flex items-center gap-3">
               <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/50">
                 {stats.completedSolutions} Solutions Completed
               </span>
             </div>
           </div>
        </div>

        {nextRank ? (
          <div className="w-full md:w-80 bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="font-bold text-slate-700">Next Tier: {nextRank.name}</span>
              <span className="font-bold text-emerald-600">{stats.completedSolutions} / {nextRank.min}</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${Math.min(100, (stats.completedSolutions / nextRank.min) * 100)}%` }} 
              />
            </div>
          </div>
        ) : (
          <div className="w-full md:w-80 bg-emerald-50/50 px-8 py-5 rounded-2xl flex flex-col items-center md:items-start justify-center border border-emerald-100/50">
            <span className="font-bold text-emerald-700 text-lg tracking-tight mb-1">Top Tier Achieved!</span>
            <span className="text-sm font-medium text-emerald-600/80">You are an Elite Solver.</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Attempts" 
          value={stats.totalAttempts} 
          icon={<Target className="w-4 h-4" />} 
          description="All problems you've claimed" 
        />
        <StatCard 
          title="Active Workspaces" 
          value={stats.activeWorkspaces} 
          icon={<Activity className="w-4 h-4" />} 
          description="Currently in progress" 
        />
        <StatCard 
          title="Completed" 
          value={stats.completedSolutions} 
          icon={<CheckCircle2 className="w-4 h-4" />} 
          description="Successfully solved" 
        />
        <StatCard 
          title="Success Rate" 
          value={`${stats.successRate}%`} 
          icon={<TrendingUp className="w-4 h-4" />} 
          description="Ratio of solved problems" 
        />
      </div>

      <SectionCard 
        title="Attempts Over Time" 
        subtitle="Weekly breakdown • Last 6 weeks"
        badge={
          <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-md uppercase tracking-wider border border-emerald-100/50 shadow-sm">
            {totalRecentAttempts} Total
          </span>
        }
      >
        {totalRecentAttempts > 0 ? (
          <div className="h-64 w-full mt-4">
            <ChartContainer config={timelineConfig} className="h-full w-full">
              <AreaChart data={stats.timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradAttempts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(16, 185, 129, 0.08)" strokeDasharray="4 4" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 700 }} dy={10} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 700 }} allowDecimals={false} width={30} />
                <ChartTooltip cursor={{ stroke: "#10b981", strokeWidth: 1, strokeDasharray: "4 4" }} content={<ChartTooltipContent indicator="line" />} />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  fill="url(#gradAttempts)" 
                  dot={{ r: 4, fill: "#fff", stroke: "#10b981", strokeWidth: 2 }} 
                  activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }} 
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