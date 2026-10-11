"use client";

import { FileText, Target, ShieldAlert, AlignLeft, CheckCircle2 } from "lucide-react";
import type { ProblemResponse } from "@/types/problem";

export function ProblemBlueprintTab({ problem }: { problem: ProblemResponse }) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-6 md:p-8 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
        <div className="p-2.5 bg-accent/10 rounded-xl text-accent border border-accent/20">
          <FileText className="w-5 h-5" />
        </div>
        Problem Blueprint
      </h2>
      
      <div className="space-y-6">
        {/* Background Context */}
        {problem.backgroundContext && (
          <div className="group">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlignLeft className="w-4 h-4 text-slate-300" /> Background Context
            </h3>
            <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 group-hover:bg-slate-50 group-hover:border-slate-200 transition-colors">
              <p className="text-slate-700 leading-relaxed text-sm font-medium">
                {problem.backgroundContext}
              </p>
            </div>
          </div>
        )}
        
        {/* Primary Statement */}
        <div className="group">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-slate-300" /> Primary Problem Statement
          </h3>
          <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 group-hover:bg-slate-50 group-hover:border-slate-200 transition-colors border-l-4 border-l-accent">
            <p className="text-slate-900 leading-relaxed text-base font-bold">
              {problem.primaryStatement}
            </p>
          </div>
        </div>
        
        {/* Objectives */}
        {problem.objectives && (
          <div className="group">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-300" /> Objectives
            </h3>
            <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 group-hover:bg-slate-50 group-hover:border-slate-200 transition-colors">
              <p className="text-slate-700 leading-relaxed text-sm font-medium whitespace-pre-wrap">
                {problem.objectives}
              </p>
            </div>
          </div>
        )}
        
        {/* Constraints */}
        {problem.constraints && (
          <div className="group">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-300" /> Constraints
            </h3>
            <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 group-hover:bg-slate-50 group-hover:border-slate-200 transition-colors">
              <p className="text-slate-700 leading-relaxed text-sm font-medium whitespace-pre-wrap">
                {problem.constraints}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}