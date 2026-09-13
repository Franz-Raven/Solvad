"use client";

import type { ProblemResponse } from "@/types/problem";
import type { SolutionAttemptResponse } from "@/types/attempt";

interface SubtasksTabProps {
  problem: ProblemResponse;
  attempts: SolutionAttemptResponse[];
  canPropose: boolean;
  onPropose: (subtaskId: string) => void;
}

export function SubtasksTab({ problem, attempts, canPropose, onPropose }: SubtasksTabProps) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 p-8">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            AI-Decomposed Sub-problems
          </h2>
          {canPropose ? (
            <p className="text-sm text-slate-500 mt-2 font-medium">
              Pick a sub-problem you want to solve and submit a proposal.
            </p>
          ) : (
            <p className="text-sm text-amber-600 mt-2 font-medium flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Proposal submissions are currently locked.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-5">
        {problem.subtasks.map((subtask, index) => {
          // 🚀 FIX: Use the specific subtask's max concurrent limit instead of the global one.
          // Fallback to 3 only if the backend somehow sends undefined.
          const limit = (subtask as any).maxConcurrentSolvers ?? 3;

          const activeOnThisSubtask = attempts.filter(
            (a) => a.status === "ACTIVE" && a.targetSubtaskId === subtask.id
          ).length;
          
          const isFull = activeOnThisSubtask >= limit;

          return (
            <div 
              key={subtask.id} 
              className="bg-slate-50/50 hover:bg-white transition-colors duration-300 rounded-xl p-6 border border-slate-200 hover:border-emerald-500/30 hover:shadow-md group"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                
                {/* Left Content */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors">
                      {subtask.title}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-bold uppercase tracking-wider rounded-md">
                        {subtask.departmentFocus}
                      </span>
                      
                      <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border flex items-center gap-1.5 ${
                        isFull 
                          ? 'bg-rose-50 text-rose-700 border-rose-100' 
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isFull ? 'bg-rose-500' : 'bg-slate-400'}`} />
                        {activeOnThisSubtask} / {limit} Active Solvers
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                      {subtask.description}
                    </p>
                  </div>
                </div>

                {/* Right Action */}
                {canPropose && (
                  <div className="shrink-0 lg:pt-1 pl-12 lg:pl-0">
                    <button
                      onClick={() => onPropose(subtask.id)}
                      disabled={isFull}
                      className={`w-full lg:w-auto px-6 py-2.5 text-sm font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 ${
                        isFull 
                          ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed" 
                          : "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md active:scale-[0.98]"
                      }`}
                    >
                      {isFull ? "Capacity Reached" : "Submit Proposal →"}
                    </button>
                  </div>
                )}
                
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}