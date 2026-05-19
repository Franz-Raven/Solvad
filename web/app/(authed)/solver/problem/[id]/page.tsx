"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getOpenProblems } from "@/lib/api/problem";
import type { ProblemResponse } from "@/types/problem";

export default function SolverDashboardPage() {
  const [problems, setProblems] = useState<ProblemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOpenProblems();
      setProblems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load problems");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 p-8">
      <div className="max-w-7xl mx-auto">

        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            Bridging the Gap Between Industry Problems and Academic Solutions.
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-4xl mx-auto">
            Empowering student solvers to tackle real-world cross-industry
            challenges while building a verifiable portfolio.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Available Problems
            </h3>
            <p className="text-3xl font-bold text-accent">
              {loading ? "—" : problems.length}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Open challenges ready to claim
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Active Projects
            </h3>
            <p className="text-3xl font-bold text-secondary">—</p>
            <p className="text-sm text-gray-600 mt-2">Currently working on</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Completed
            </h3>
            <p className="text-3xl font-bold text-primary-foreground">—</p>
            <p className="text-sm text-gray-600 mt-2">Successfully solved</p>
          </div>
        </div>

        {/* Open Problems List */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Open Problems
            </h2>
            <span className="text-sm text-gray-500">
              {!loading && `${problems.length} available`}
            </span>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && problems.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No open problems yet
              </h3>
              <p className="text-gray-600">
                Check back soon — industry partners are posting new challenges.
              </p>
            </div>
          )}

          {!loading && !error && problems.length > 0 && (
            <div className="space-y-4">
              {problems.map((problem, index) => (
                <div
                  key={problem.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-accent/20 transition-colors border border-gray-200"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-accent to-secondary rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm truncate">
                      {problem.title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {problem.organizationName} • Posted{" "}
                      {formatDate(problem.createdAt)} •{" "}
                      {problem.requiredCourse} •{" "}
                      {problem.subtasks.length} sub-tasks
                    </p>
                  </div>
                  <Link
                    href={`/solver/problem/${problem.id}`}
                    className="px-4 py-2 bg-accent hover:bg-secondary text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
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