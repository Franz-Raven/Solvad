"use client";

import type { ProblemResponse } from "@/types/problem";

export function SettingsTab({ problem, onDelete }: { problem: ProblemResponse; onDelete: () => void }) {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 opacity-60">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Visibility Settings</h2>
          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">COMING SOON</span>
        </div>
        
        <p className="text-sm text-gray-600 mb-6">
          Control who can see this problem. Public problems are visible to all matching student streams,
          while hidden problems are only visible to you.
        </p>
        <div className="space-y-3 pointer-events-none">
          <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
            <input type="radio" name="visibility" value="public" checked disabled className="w-5 h-5" />
            <div>
              <div className="font-medium text-gray-900">Public</div>
              <div className="text-sm text-gray-600">Visible to all students in the required course</div>
            </div>
          </label>
          <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
            <input type="radio" name="visibility" value="hidden" disabled className="w-5 h-5" />
            <div>
              <div className="font-medium text-gray-900">Hidden / Draft</div>
              <div className="text-sm text-gray-600">Only visible to you (problem is not discoverable by students)</div>
            </div>
          </label>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Problem Data is Immutable</h3>
            <p className="text-sm text-blue-800">
              To preserve matching integrity and audit trail, problem details cannot be edited after
              validation. If significant changes are required, you must delete and re-submit the problem.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border-2 border-red-200 p-6">
        <h2 className="text-xl font-bold text-red-700 mb-2 flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Danger Zone
        </h2>
        <p className="text-sm text-gray-600 mb-6">Irreversible actions that will permanently affect this problem.</p>
        <div className="space-y-4">
          <div className="flex items-start justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Delete Problem</h3>
              <p className="text-sm text-gray-700">
                Permanently delete this problem and all associated data. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={onDelete}
              className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex-shrink-0"
            >
              Delete Problem
            </button>
          </div>
          <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Archive Problem</h3>
              <p className="text-sm text-gray-700">
                Move this problem to the archive. It will no longer be visible to students but can be restored later.
              </p>
            </div>
            <button disabled className="ml-4 px-4 py-2 bg-gray-300 text-gray-500 font-semibold rounded-lg cursor-not-allowed flex-shrink-0">
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}