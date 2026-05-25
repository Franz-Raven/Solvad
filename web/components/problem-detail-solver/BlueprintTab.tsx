"use client";

import type { ProblemResponse } from "@/types/problem";

export function BlueprintTab({ problem }: { problem: ProblemResponse }) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Problem Blueprint
      </h2>
      <div className="space-y-6">
        {problem.backgroundContext && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Background Context</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-gray-800 leading-relaxed">{problem.backgroundContext}</p>
            </div>
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Primary Problem Statement</h3>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-gray-800 leading-relaxed font-medium">{problem.primaryStatement}</p>
          </div>
        </div>
        {problem.objectives && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Objectives</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-gray-800 leading-relaxed">{problem.objectives}</p>
            </div>
          </div>
        )}
        {problem.constraints && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Constraints</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-gray-800 leading-relaxed">{problem.constraints}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}