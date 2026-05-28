"use client";

import type { ProblemResponse } from "@/types/problem";

function parseList(raw: string): string[] {
  try { return JSON.parse(raw).map((s: string) => s.trim()).filter(Boolean); }
  catch { return [raw.trim()].filter(Boolean); }
}

export function ProblemTab({ problem }: { problem: ProblemResponse }) {
  return (
    <div className="space-y-6">
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
          {problem.objectives && (() => {
            const items = parseList(problem.objectives);
            return items.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Objectives</h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <ul className="list-disc list-inside space-y-1 text-gray-800 leading-relaxed">
                    {items.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              </div>
            );
          })()}
          {problem.constraints && (() => {
            const items = parseList(problem.constraints);
            return items.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Technical Constraints</h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <ul className="list-disc list-inside space-y-1 text-gray-800 leading-relaxed">
                    {items.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
           </svg>
          AI-Decomposed Sub-problems
        </h2>
        <div className="grid gap-4">
          {problem.subtasks.map((subtask, index) => (
            <div key={subtask.id} className="bg-gradient-to-r from-accent/5 to-secondary/5 rounded-lg p-5 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{subtask.title}</h3>
                    <span className="px-2 py-1 bg-secondary/10 text-secondary text-xs font-medium rounded-full">
                      {subtask.departmentFocus}
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{subtask.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          Attachments
        </h2>
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-600 text-sm">No attachments uploaded</p>
          <p className="text-gray-500 text-xs mt-1">File upload feature coming soon</p>
        </div>
      </div>
    </div>
  );
}