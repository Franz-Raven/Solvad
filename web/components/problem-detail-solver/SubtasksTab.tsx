"use client";

import type { ProblemResponse } from "@/types/problem";

interface SubtasksTabProps {
  problem: ProblemResponse;
  canPropose: boolean;
  onPropose: (subtaskId: string) => void;
}

export function SubtasksTab({ problem, canPropose, onPropose }: SubtasksTabProps) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        AI-Decomposed Sub-problems
      </h2>
      {canPropose && (
        <p className="text-sm text-gray-500 mb-6">
          Pick a sub-problem you want to solve and submit a proposal.
        </p>
      )}
      {!canPropose && <div className="mb-6" />}
      <div className="grid gap-4">
        {problem.subtasks.map((subtask, index) => (
          <div key={subtask.id} className="bg-gradient-to-r from-accent/5 to-secondary/5 rounded-lg p-5 border border-gray-200">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-gray-900">{subtask.title}</h3>
                    <span className="px-2 py-1 bg-secondary/10 text-secondary text-xs font-medium rounded-full">
                      {subtask.departmentFocus}
                    </span>
                  </div>
                  {canPropose && (
                    <button
                      onClick={() => onPropose(subtask.id)}
                      className="flex-shrink-0 px-4 py-1.5 bg-secondary hover:bg-accent text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                    >
                      Submit Proposal →
                    </button>
                  )}
                </div>
                <p className="text-gray-700 leading-relaxed">{subtask.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}