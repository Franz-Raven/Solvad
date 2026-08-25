"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getMyActiveAttempts } from "@/lib/api/attempts";
import type { SolutionAttemptResponse } from "@/types/attempt";

type WorkspaceTab = "ACTIVE" | "PENDING" | "HISTORY";

export default function SolverWorkspacePage() {
  const [attempts, setAttempts] = useState<SolutionAttemptResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("ACTIVE");

  const loadAttempts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyActiveAttempts();
      setAttempts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAttempts();
  }, [loadAttempts]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Group attempts by status
  const activeAttempts = attempts.filter((a) => a.status === "ACTIVE");
  const pendingAttempts = attempts.filter((a) => a.status === "PENDING" || a.status === "APPROVED");
  const historyAttempts = attempts.filter((a) => a.status === "COMPLETED" || a.status === "TERMINATED" || a.status === "ABANDONED");

  const getDisplayedAttempts = () => {
    if (activeTab === "ACTIVE") return activeAttempts;
    if (activeTab === "PENDING") return pendingAttempts;
    return historyAttempts;
  };

  const displayedAttempts = getDisplayedAttempts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">My Workspace</h1>
          <p className="text-gray-600">Manage your active solutions, pending proposals, and past work.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Custom Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-8 w-fit">
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "ACTIVE"
                ? "bg-white text-secondary shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Active ({activeAttempts.length})
          </button>
          <button
            onClick={() => setActiveTab("PENDING")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "PENDING"
                ? "bg-white text-secondary shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Pending ({pendingAttempts.length})
          </button>
          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "HISTORY"
                ? "bg-white text-secondary shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            History ({historyAttempts.length})
          </button>
        </div>

        {/* Workspace Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayedAttempts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              📭
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No {activeTab.toLowerCase()} attempts</h3>
            <p className="text-gray-500 mb-6">
              {activeTab === "ACTIVE" && "You don't have any active problems right now. Go find one!"}
              {activeTab === "PENDING" && "You have no proposals waiting for approval."}
              {activeTab === "HISTORY" && "You haven't completed or abandoned any problems yet."}
            </p>
            {activeTab === "ACTIVE" && (
              <Link
                href="/solver/dashboard"
                className="px-6 py-2.5 bg-secondary hover:bg-accent text-white font-medium rounded-lg transition-colors inline-block"
              >
                Browse Open Problems
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayedAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row items-start md:items-center gap-6 hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-secondary/80 to-accent rounded-xl flex items-center justify-center text-white text-2xl shadow-sm shrink-0">
                  {attempt.status === "ACTIVE" ? "🚀" : attempt.status === "COMPLETED" ? "✅" : "⏳"}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-gray-900 truncate">
                      {attempt.problemTitle || "Untitled Problem"}
                    </h3>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                      attempt.status === "ACTIVE" ? "bg-blue-50 text-blue-700 border-blue-200" :
                      attempt.status === "COMPLETED" ? "bg-green-50 text-green-700 border-green-200" :
                      attempt.status === "TERMINATED" || attempt.status === "ABANDONED" ? "bg-red-50 text-red-700 border-red-200" :
                      "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {attempt.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-3">
                    {attempt.targetSubtaskTitle ? `Subtask: ${attempt.targetSubtaskTitle}` : "Full Problem"}
                  </p>

                  <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Started {formatDate(attempt.claimedAt)}
                    </span>
                    {attempt.parentAttemptId && (
                      <span className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7l-2 2m2-2l2 2m4 4v-4a2 2 0 00-2-2h-6" /></svg>
                        Forked Attempt
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-full md:w-auto shrink-0 flex justify-end">
                  {attempt.status === "ACTIVE" ? (
                    <Link
                      href={`/solver/problem/${attempt.problemId}/work`}
                      className="w-full md:w-auto px-6 py-2.5 bg-secondary hover:bg-accent text-white text-sm font-medium rounded-lg transition-colors text-center"
                    >
                      Enter Workspace →
                    </Link>
                  ) : (
                    <Link
                      href={`/solver/problem/${attempt.problemId}`}
                      className="w-full md:w-auto px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors border border-gray-200 text-center"
                    >
                      View Problem
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}