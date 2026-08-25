"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getDiscoveryDashboard, getDiscoverableProblems } from "@/lib/api/problem";
import { getMyActiveAttempts } from "@/lib/api/attempts";
import type { ProblemResponse } from "@/types/problem";
import type { SolutionAttemptResponse } from "@/types/attempt";
import { SolverOverview } from "@/components/solver-dashboard/SolverOverview";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const EXPLORE_PAGE_SIZE = 5;

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  SOLVED_OPEN_FOR_IMPROVEMENT: "Open for Improvement",
};

export default function SolverDashboardPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "home";

  // Static Data States (Loaded once)
  const [recommended, setRecommended] = useState<ProblemResponse[]>([]);
  const [solverCourse, setSolverCourse] = useState("");
  const [myAttempts, setMyAttempts] = useState<SolutionAttemptResponse[]>([]);
  
  // Paginated Data States (Loaded on page change)
  const [paginatedProblems, setPaginatedProblems] = useState<ProblemResponse[]>([]);
  const [explorePage, setExplorePage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch data that doesn't change when you change pages
  const loadInitialData = useCallback(async () => {
    try {
      const [discovery, attemptsData] = await Promise.all([
        getDiscoveryDashboard({ search: appliedSearch || undefined }),
        getMyActiveAttempts().catch(() => []),
      ]);
      setRecommended(discovery.recommended);
      setSolverCourse(discovery.solverCourse);
      setMyAttempts(attemptsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    }
  }, [appliedSearch]);

  // 2. Fetch the paginated data directly from the server
  const loadPaginatedData = useCallback(async () => {
    try {
      setLoading(true);
      // Note: We will wire up the appliedSearch parameter to the backend in the next step!
      const paginatedData = await getDiscoverableProblems(explorePage, EXPLORE_PAGE_SIZE);
      setPaginatedProblems(paginatedData.problems);
      setTotalPages(paginatedData.totalPages);
      setTotalElements(paginatedData.totalElements);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load paginated problems");
    } finally {
      setLoading(false);
    }
  }, [explorePage, appliedSearch]);

  // Trigger fetches
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    loadPaginatedData();
  }, [loadPaginatedData]);

  const activeAttempts = myAttempts.filter((a) => a.status === "ACTIVE");
  
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
    setExplorePage(0); // Reset to page 0 when searching
    setAppliedSearch(search.trim());
  };

  const handleExplorePageChange = (page: number) => {
    setExplorePage(page);
  };

  // Math for the "Showing X - Y of Z problems" text
  const exploreRangeStart = totalElements === 0 ? 0 : (explorePage * EXPLORE_PAGE_SIZE) + 1;
  const exploreRangeEnd = Math.min((explorePage + 1) * EXPLORE_PAGE_SIZE, totalElements);

  return (
    <div className="min-h-screen bg-linear-to-br from-accent/20 via-background to-accent/10 p-8">
      <div className="max-w-7xl mx-auto">

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {activeTab === "home" && (
          <>
            {/* Page header */}
            <div className="mb-10 text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Find Problems
              </h1>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                Discover industry challenges matched to your course
                {solverCourse ? (
                  <span className="font-medium text-secondary">
                    {" "}({solverCourse})
                  </span>
                ) : null}{" "}
                and skills.
              </p>
            </div>

            {/* Active workspace */}
            {activeAttempts.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Your Workspace
                </h2>
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
                        <h4 className="font-medium text-gray-900 text-sm">
                          {attempt.problemTitle}
                        </h4>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Claimed {formatDate(attempt.claimedAt)}
                        </p>
                      </div>
                      <Link
                        href={`/solver/problem/${attempt.problemId}/work`}
                        className="px-4 py-2 bg-secondary hover:bg-accent text-white text-sm font-medium rounded-lg transition-colors shrink-0"
                      >
                        Continue Working
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended for You */}
            {!loading && recommended.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-secondary/30 p-8 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Recommended for You
                  </h2>
                  <span className="text-xs text-gray-500">
                    Top 3 matches from your skills &amp; course
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommended.slice(0, 3).map((problem, rank) => (
                    <Link
                      key={problem.id}
                      href={`/solver/problem/${problem.id}`}
                      className="block p-4 rounded-xl border border-secondary/20 bg-secondary/5 hover:border-secondary hover:shadow-md transition-all relative"
                    >
                      <span className="absolute top-3 left-3 w-6 h-6 rounded-full bg-secondary text-white text-xs font-bold flex items-center justify-center">
                        {rank + 1}
                      </span>
                      <div className="flex items-start justify-between gap-2 mb-2 pl-8">
                        <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">
                          {problem.title}
                        </h4>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Explore Open Problems
              </h2>

              <form
                onSubmit={handleSearchSubmit}
                className="flex flex-col md:flex-row gap-3 mb-4"
              >
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, organization, or course..."
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-secondary hover:bg-accent text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Apply
                </button>
              </form>

              <p className="text-xs text-gray-500 mb-4">
                Problems matching your course are listed first. Use search to narrow results.
              </p>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : paginatedProblems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No problems match your criteria.
                </p>
              ) : (
                <>
                <p className="text-xs text-gray-500 mb-4">
                  Showing {exploreRangeStart}–{exploreRangeEnd} of{" "}
                  {totalElements} problem{totalElements === 1 ? "" : "s"}
                  {totalPages > 1
                    ? ` • Page ${explorePage + 1} of ${totalPages}`
                    : ""}
                </p>
                <div className="space-y-4">
                  {paginatedProblems.map((problem, index) => (
                    <div
                      key={problem.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-accent/10 transition-colors border border-gray-200"
                    >
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 font-bold shrink-0">
                        {(explorePage * EXPLORE_PAGE_SIZE) + index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 text-sm truncate">
                            {problem.title}
                          </h4>
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
                          {problem.organizationName} •{" "}
                          {problem.preferredProgram} •{" "}
                          {problem.subtasks.length} sub-tasks
                          {problem.createdAt
                            ? ` • ${formatDate(problem.createdAt)}`
                            : ""}
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
                        className="px-4 py-2 border border-gray-300 hover:border-accent hover:text-accent text-sm font-medium rounded-lg transition-colors shrink-0"
                      >
                        View Details
                      </Link>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (explorePage > 0) {
                                handleExplorePageChange(explorePage - 1);
                              }
                            }}
                            className={
                              explorePage === 0
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>

                        {Array.from(
                          { length: totalPages },
                          (_, i) => i
                        ).map((page) => {
                          if (
                            page === 0 ||
                            page === totalPages - 1 ||
                            (page >= explorePage - 1 &&
                              page <= explorePage + 1)
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleExplorePageChange(page);
                                  }}
                                  isActive={explorePage === page}
                                >
                                  {page + 1}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                          if (
                            page === explorePage - 2 ||
                            page === explorePage + 2
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return null;
                        })}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (explorePage < totalPages - 1) {
                                handleExplorePageChange(explorePage + 1);
                              }
                            }}
                            className={
                              explorePage === totalPages - 1
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
                </>
              )}
            </div>
          </>
        )}

        {activeTab === "overview" && (
          <SolverOverview attempts={myAttempts} loading={loading} />
        )}

      </div>
    </div>
  );
}