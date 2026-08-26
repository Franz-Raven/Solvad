"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, ChevronRight, Hash, Calendar, Building2, GraduationCap } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { getDiscoverableProblems } from "@/lib/api/problem";
import type { ProblemResponse } from "@/types/problem";
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

export function ExploreProblems() {
  const [paginatedProblems, setPaginatedProblems] = useState<ProblemResponse[]>([]);
  const [explorePage, setExplorePage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  // Reset page when search changes
  useEffect(() => {
    setExplorePage(0);
  }, [debouncedSearch]);

  const loadPaginatedData = useCallback(async () => {
    try {
      setLoading(true);
      const paginatedData = await getDiscoverableProblems(explorePage, EXPLORE_PAGE_SIZE);
      setPaginatedProblems(paginatedData.problems);
      setTotalPages(paginatedData.totalPages);
      setTotalElements(paginatedData.totalElements);
    } catch (err) {
      console.error("Failed to load paginated problems", err);
    } finally {
      setLoading(false);
    }
  }, [explorePage, debouncedSearch]);

  useEffect(() => {
    loadPaginatedData();
  }, [loadPaginatedData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const exploreRangeStart = totalElements === 0 ? 0 : (explorePage * EXPLORE_PAGE_SIZE) + 1;
  const exploreRangeEnd = Math.min((explorePage + 1) * EXPLORE_PAGE_SIZE, totalElements);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Explore Open Problems</h2>

      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Live search by title, organization, or course..."
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-secondary transition-all shadow-sm"
        />
      </div>

      <p className="text-xs text-gray-500 mb-6">
        Problems matching your course are listed first.
      </p>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : paginatedProblems.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No problems match your criteria.</p>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-4 font-medium">
            Showing {exploreRangeStart}–{exploreRangeEnd} of {totalElements} problem{totalElements === 1 ? "" : "s"}
          </p>
          
          <div className="space-y-4">
            {paginatedProblems.map((problem, index) => (
              <div key={problem.id} className="flex flex-col md:flex-row md:items-center gap-4 p-5 bg-gray-50 rounded-xl hover:bg-accent/5 transition-colors border border-gray-200 hover:border-accent/30 group">
                <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 font-bold shrink-0 shadow-sm">
                  {(explorePage * EXPLORE_PAGE_SIZE) + index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {/* 🚀 FIX: Removed 'truncate' from here */}
                    <h4 className="font-semibold text-gray-900 text-base group-hover:text-accent transition-colors">
                      {problem.title}
                    </h4>
                    <span className={`text-[11px] px-2 py-0.5 rounded-md font-semibold border ${
                      problem.status === "OPEN" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-green-50 text-green-700 border-green-200"
                    }`}>
                      {STATUS_LABELS[problem.status] ?? problem.status}
                    </span>
                    {problem.courseMatch && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                        Course Match
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {problem.organizationName}</span>
                    <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> {problem.preferredProgram}</span>
                    <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> {problem.subtasks.length} sub-tasks</span>
                    {problem.createdAt && (
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(problem.createdAt)}</span>
                    )}
                  </div>
                </div>
                
                <Link
                  href={`/solver/problem/${problem.id}`}
                  className="px-5 py-2.5 bg-white border border-gray-300 hover:border-accent hover:text-accent text-gray-700 text-sm font-medium rounded-lg transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  View Details
                  <ChevronRight className="w-4 h-4" />
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
                      onClick={(e) => { e.preventDefault(); if (explorePage > 0) setExplorePage(explorePage - 1); }}
                      className={explorePage === 0 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i).map((page) => {
                    if (page === 0 || page === totalPages - 1 || (page >= explorePage - 1 && page <= explorePage + 1)) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setExplorePage(page); }} isActive={explorePage === page}>
                            {page + 1}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    if (page === explorePage - 2 || page === explorePage + 2) {
                      return <PaginationItem key={page}><PaginationEllipsis /></PaginationItem>;
                    }
                    return null;
                  })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); if (explorePage < totalPages - 1) setExplorePage(explorePage + 1); }}
                      className={explorePage === totalPages - 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
}