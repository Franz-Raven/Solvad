"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getDiscoveryDashboard } from "@/lib/api/problem";
import { getMyActiveAttempts } from "@/lib/api/attempts";
import type { ProblemResponse } from "@/types/problem";
import type { SolutionAttemptResponse } from "@/types/attempt";

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  SOLVED_OPEN_FOR_IMPROVEMENT: "Open for Improvement",
};

export default function SolverDashboardPage() {
  const [recommended, setRecommended] = useState<ProblemResponse[]>([]);
  const [problems, setProblems] = useState<ProblemResponse[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [solverCourse, setSolverCourse] = useState("");
  const [myAttempts, setMyAttempts] = useState<SolutionAttemptResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [discovery, attemptsData] = await Promise.all([
        getDiscoveryDashboard({
          search: search.trim() || undefined,
          tags: selectedTag || undefined,
          sort,
        }),
        getMyActiveAttempts().catch(() => []),
      ]);
      setRecommended(discovery.recommended);
      setProblems(discovery.problems);
      setAvailableTags(discovery.availableTags);
      setSolverCourse(discovery.solverCourse);
      setMyAttempts(attemptsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [search, selectedTag, sort]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDashboardData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Find Problems
          </h1>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Discover industry challenges matched to your course
            {solverCourse ? (
              <span className="font-medium text-secondary"> ({solverCourse})</span>
            ) : null}{" "}
            and skills.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Available Problems</h3>
            <p className="text-3xl font-bold text-accent">{loading ? "—" : problems.length}</p>
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

        {/* Active workspace */}
        {activeAttempts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Workspace</h2>
            <div className="space-y-4">
              {activeAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center gap-4 p-4 bg-secondary/5 rounded-lg border border-secondary/20"
                >
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

        {/* Recommended for You — Module 2.1 */}
        {!loading && recommended.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-secondary/30 p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
              <span className="text-xs text-gray-500">Top matches via skill similarity</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommended.map((problem) => (
                <Link
                  key={problem.id}
                  href={`/solver/problem/${problem.id}`}
                  className="block p-4 rounded-xl border border-secondary/20 bg-secondary/5 hover:border-secondary hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">{problem.title}</h4>
                    {problem.matchScore != null && (
                      <span className="text-xs font-bold text-secondary whitespace-nowrap">
                        {Math.round(problem.matchScore * 100)}% match
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {problem.organizationName} • {problem.preferredProgram}
                  </p>
                  {problem.courseMatch && (
                    <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      Your course
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Search & filters */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Explore Open Problems</h2>

          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 mb-4">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, organization, course, or tag..."
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm bg-white"
            >
              <option value="">All tags</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
              className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm bg-white"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
            <button
              type="submit"
              className="px-6 py-2.5 bg-secondary hover:bg-accent text-white text-sm font-medium rounded-lg transition-colors"
            >
              Apply
            </button>
          </form>

          <p className="text-xs text-gray-500 mb-4">
            Problems matching your course are listed first. Use search and tag filters to narrow results.
          </p>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : problems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No problems match your filters. Try adjusting search or tags.</p>
          ) : (
            <div className="space-y-4">
              {problems.map((problem, index) => (
                <div
                  key={problem.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-accent/10 transition-colors border border-gray-200"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 text-sm truncate">{problem.title}</h4>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          problem.status === "OPEN"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {STATUS_LABELS[problem.status] ?? problem.status}
                      </span>
                      {problem.courseMatch && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Course match
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {problem.organizationName} • {problem.preferredProgram} • {problem.subtasks.length} sub-tasks
                      {problem.createdAt ? ` • ${formatDate(problem.createdAt)}` : ""}
                    </p>
                    {problem.tags && problem.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {problem.tags.slice(0, 5).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
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
