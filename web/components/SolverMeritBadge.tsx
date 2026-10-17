"use client";

import { Shield, ShieldHalf, ShieldCheck, Award, Clock, Activity } from "lucide-react";
import type { SolverMetrics } from "@/types/attempt";

interface SolverMeritBadgeProps {
  metrics?: SolverMetrics;
}

export function SolverMeritBadge({ metrics }: SolverMeritBadgeProps) {
  // Fallback for new users or missing data
  const safeMetrics = metrics || { solutionsCompleted: 0, completionRate: 0, avgTurnaroundDays: null };
  const { solutionsCompleted, completionRate, avgTurnaroundDays } = safeMetrics;

  // 🚀 Tier Logic based on gamification rules
  const getTierDetails = (completed: number) => {
    if (completed >= 10) {
      return {
        name: "Elite Solver",
        icon: <Award className="w-3.5 h-3.5" fill="currentColor" />,
        color: "bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm",
      };
    }
    if (completed >= 5) {
      return {
        name: "Proven Solver",
        icon: <ShieldCheck className="w-3.5 h-3.5" fill="currentColor" />,
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    }
    if (completed >= 1) {
      return {
        name: "Contributor",
        icon: <ShieldHalf className="w-3.5 h-3.5" />,
        color: "bg-slate-50 text-emerald-600 border-slate-200",
      };
    }
    return {
      name: "Initiate",
      icon: <Shield className="w-3.5 h-3.5" />,
      color: "bg-slate-50 text-slate-500 border-slate-200",
    };
  };

  const tier = getTierDetails(solutionsCompleted);

  return (
    <div className="relative group inline-flex items-center">
      {/* ── Visual Gamification Badge ── */}
      <div 
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider transition-all cursor-help ${tier.color}`}
      >
        {tier.icon}
        {tier.name}
      </div>

      {/* ── Hover Tooltip (Reliability Metrics) ── */}
      <div className="absolute left-0 top-full mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
        <div className="bg-slate-900 rounded-xl shadow-xl border border-slate-800 p-4 text-left overflow-hidden">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Reliability Metrics</p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-medium">Completed</span>
              </div>
              <span className="text-xs font-bold text-white">{solutionsCompleted}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <Activity className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-medium">Completion Rate</span>
              </div>
              <span className={`text-xs font-bold ${completionRate >= 80 ? "text-emerald-400" : completionRate >= 50 ? "text-amber-400" : "text-rose-400"}`}>
                {solutionsCompleted === 0 ? "N/A" : `${Math.round(completionRate)}%`}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-medium">Avg. Turnaround</span>
              </div>
              <span className="text-xs font-bold text-white">
                {avgTurnaroundDays ? `${Math.round(avgTurnaroundDays)} days` : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}