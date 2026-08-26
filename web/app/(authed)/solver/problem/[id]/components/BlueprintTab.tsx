"use client";

import type { ProblemResponse } from "@/types/problem";

function parseList(raw: string): string[] {
  try {
    return JSON.parse(raw).map((s: string) => s.trim()).filter(Boolean);
  } catch {
    return [raw.trim()].filter(Boolean);
  }
}

export function BlueprintTab({ problem }: { problem: ProblemResponse }) {
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
                <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Constraints</h3>
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
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          Attachments
        </h2>
        
        {problem.problemDocumentUrl ? (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6zm2-8h5v2H8v-2zm0 4h8v2H8v-2z" />
              </svg>
              <div>
                <p className="font-medium text-gray-900">Problem Specification Document</p>
                <p className="text-sm text-gray-500">PDF</p>
              </div>
            </div>
            <a
              href={problem.problemDocumentUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download specification pdf document
            </a>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600 text-sm">No attachments uploaded</p>
          </div>
        )}
      </div>
    </div>
  );
}