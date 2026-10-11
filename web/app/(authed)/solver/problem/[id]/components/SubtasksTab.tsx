"use client";

import { ClipboardList, Lock, ArrowRight } from "lucide-react";
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
    <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-6 md:p-8 animate-in fade-in duration-500">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
              <ClipboardList className="w-5 h-5" />
            </div>
            AI-Decomposed Sub-problems
          </h2>
          {canPropose ? (
            <p className="text-sm text-slate-500 mt-3 font-medium">
              Pick a sub-problem you want to solve and submit a proposal.
            </p>
          ) : (
            <p className="text-sm text-amber-600 mt-3 font-bold flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg w-fit">
              <Lock className="w-4 h-4" />
              Proposal submissions are currently locked.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-5">
        {problem.subtasks.map((subtask, index) => {
          // Fallback to 3 only if the backend somehow sends undefined.
          const limit = (subtask as any).maxConcurrentSolvers ?? 3;

          const activeOnThisSubtask = attempts.filter(
            (a) => a.status === "ACTIVE" && a.targetSubtaskId === subtask.id
          ).length;
          
          const isFull = activeOnThisSubtask >= limit;
          const isInteractive = canPropose && !isFull;

          return (
            <div 
              key={subtask.id} 
              // 🚀 Make the entire box clickable if available
              onClick={() => {
                if (isInteractive) onPropose(subtask.id);
              }}
              className={`bg-slate-50/50 transition-all duration-300 rounded-2xl p-5 md:p-6 border border-slate-100 group ${
                isInteractive 
                  ? "hover:bg-white hover:border-emerald-500/30 hover:shadow-md cursor-pointer" 
                  : "opacity-95"
              }`}
            >
              {/* 🚀 Changed lg:items-start to lg:items-center to middle-align the right button */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                
                {/* Left Content */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  
                  {/* Styled Index Box identical to Home/Explore */}
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center shrink-0 text-emerald-600 font-bold text-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-sm">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-3 pt-0.5">
                    <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors">
                      {subtask.title}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider rounded-md">
                        {subtask.departmentFocus}
                      </span>
                      
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border flex items-center gap-1.5 ${
                        isFull 
                          ? 'bg-rose-50 text-rose-700 border-rose-200' 
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isFull ? 'bg-rose-500' : 'bg-slate-400'}`} />
                        {activeOnThisSubtask} / {limit} Active Solvers
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed font-medium max-w-3xl">
                      {subtask.description}
                    </p>
                  </div>
                </div>

                {/* Right Action */}
                {canPropose && (
                  <div className="shrink-0 w-full lg:w-auto mt-4 lg:mt-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevents double-firing the onClick from the parent box
                        if (!isFull) onPropose(subtask.id);
                      }}
                      disabled={isFull}
                      className={`w-full lg:w-auto px-6 py-3 text-sm font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 ${
                        isFull 
                          ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed" 
                          // 🚀 Added group-hover:scale-[1.02] so the button slightly pops when hovering the box
                          : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer group-hover:shadow-md group-hover:scale-[1.02]"
                      }`}
                    >
                      {isFull ? "Capacity Reached" : (
                        <>
                          Submit Proposal <ArrowRight className="w-4 h-4" />
                        </>
                      )}
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