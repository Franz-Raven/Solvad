"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getMyProblems } from "@/lib/api/problem";
import type { ProblemResponse } from "@/types/problem";

export default function SeekerDashboardPage() {
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
      const data = await getMyProblems();
      setProblems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load problems");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-100 text-blue-700";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-700";
      case "SOLVED":
        return "bg-green-100 text-green-700";
      case "CLOSED":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
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

  const stats = {
    total: problems.length,
    inProgress: problems.filter((p) => p.status === "IN_PROGRESS").length,
    solved: problems.filter((p) => p.status === "SOLVED").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Posted Problems
            </h3>
            <p className="text-3xl font-bold text-accent">{stats.total}</p>
            <p className="text-sm text-gray-600 mt-2">Total problems posted</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              In Progress
            </h3>
            <p className="text-3xl font-bold text-secondary">{stats.inProgress}</p>
            <p className="text-sm text-gray-600 mt-2">Being worked on</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Solved
            </h3>
            <p className="text-3xl font-bold text-primary-foreground">{stats.solved}</p>
            <p className="text-sm text-gray-600 mt-2">Successfully completed</p>
          </div>
        </div>

        {/* Posted Problems */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Your Posted Problems
            </h2>
            <Link
              href="/seeker/submit-problem"
              className="px-6 py-3 bg-accent hover:bg-secondary text-white font-medium rounded-lg transition-colors"
            >
              Post New Problem
            </Link>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
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
                No problems posted yet
              </h3>
              <p className="text-gray-600 mb-4">
                Get started by posting your first industry problem
              </p>
              <Link
                href="/seeker/submit-problem"
                className="inline-block px-6 py-3 bg-accent hover:bg-secondary text-white font-medium rounded-lg transition-colors"
              >
                Post Your First Problem
              </Link>
            </div>
          )}

          {!loading && !error && problems.length > 0 && (
            <div className="space-y-4">
              {problems.map((problem, index) => (
                <div
                  key={problem.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-accent/20 transition-colors border border-gray-200"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-accent to-secondary rounded-lg flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {problem.title}
                      </h4>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                          problem.status
                        )}`}
                      >
                        {problem.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Posted {formatDate(problem.createdAt)} • {problem.subtasks.length}{" "}
                      sub-tasks • {problem.requiredCourse}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/seeker/problem/${problem.id}`}
                      className="px-4 py-2 bg-accent hover:bg-secondary text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
