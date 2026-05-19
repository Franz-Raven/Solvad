"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getOpenProblems } from "@/lib/api/problem";
import { getMyActiveAttempts } from "@/lib/api/attempts";
import type { ProblemResponse } from "@/types/problem";
import type { SolutionAttemptResponse } from "@/types/attempt";

export default function SolverDashboardPage() {
  const [openProblems, setOpenProblems] = useState<ProblemResponse[]>([]);
  const [myAttempts, setMyAttempts] = useState<SolutionAttemptResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Run both API calls in parallel
      const [problemsData, attemptsData] = await Promise.all([
        getOpenProblems(),
        getMyActiveAttempts().catch(() => []), // Fallback to empty array if endpoint isn't ready
      ]);
      setOpenProblems(problemsData);
      setMyAttempts(attemptsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const activeAttempts = myAttempts.filter((a) => a.status === "ACTIVE");
  const completedAttempts = myAttempts.filter((a) => a.status === "COMPLETED");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const diffDays = Math.ceil(Math.abs(Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            Bridging the Gap Between Industry Problems and Academic Solutions.
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-4xl mx-auto">
            Empowering student solvers to tackle real-world cross-industry challenges while building a verifiable portfolio.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Available Problems</h3>
            <p className="text-3xl font-bold text-accent">{loading ? "—" : openProblems.length}</p>
            <p className="text-sm text-gray-600 mt-2">Open challenges ready to claim</p>
          </div>
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Projects</h3>
            <p className="text-3xl font-bold text-secondary">{loading ? "—" : activeAttempts.length}</p>
            <p className="text-sm text-gray-600 mt-2">Currently working on</p>
          </div>
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Completed</h3>
            <p className="text-3xl font-bold text-primary-foreground">{loading ? "—" : completedAttempts.length}</p>
            <p className="text-sm text-gray-600 mt-2">Successfully solved</p>
          </div>
        </div>

        {/* Your Active Work Section */}
        {activeAttempts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Workspace</h2>
            <div className="space-y-4">
              {activeAttempts.map((attempt) => (
                <div key={attempt.id} className="flex items-center gap-4 p-4 bg-secondary/5 rounded-lg border border-secondary/20">
                  <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center text-white font-bold">
                    🚀
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm">{attempt.problemTitle}</h4>
                    <p className="text-xs text-gray-600 mt-0.5">Claimed {formatDate(attempt.claimedAt)}</p>
                  </div>
                  <Link
                    href={`/solver/problem/${attempt.problemId}/work`}
                    className="px-4 py-2 bg-secondary hover:bg-accent text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
                  >
                    Continue Working
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Open Problems List */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Explore Open Problems</h2>
          {!loading && openProblems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No open problems right now. Check back later!</p>
          ) : (
            <div className="space-y-4">
              {openProblems.map((problem, index) => (
                <div key={problem.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-accent/10 transition-colors border border-gray-200">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm truncate">{problem.title}</h4>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {problem.organizationName} • {problem.requiredCourse} • {problem.subtasks.length} sub-tasks
                    </p>
                  </div>
                  <Link
                    href={`/solver/problem/${problem.id}`}
                    className="px-4 py-2 border border-gray-300 hover:border-accent hover:text-accent text-sm font-medium rounded-lg transition-colors flex-shrink-0"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}