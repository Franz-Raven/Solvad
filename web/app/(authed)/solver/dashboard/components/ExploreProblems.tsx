"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, ChevronRight, Hash, Calendar, Building2, GraduationCap, FolderOpen } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { getDiscoverableProblems } from "../api/dashboard";
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

// 🚀 FIX: Skeleton loader matching the exact layout of the list items
const SkeletonCard = () => (
  <div className="flex flex-col md:flex-row md:items-center gap-5 p-5 bg-slate-50/50 rounded-xl border border-slate-100">
    <div className="w-12 h-12 bg-slate-200 rounded-xl animate-pulse shrink-0" />
    <div className="flex-1 min-w-0 space-y-3 w-full">
      <div className="flex gap-3 items-center">
        <div className="h-5 bg-slate-200 rounded-md w-1/3 animate-pulse" />
        <div className="h-5 bg-slate-200 rounded-md w-16 animate-pulse hidden md:block" />
      </div>
      <div className="flex flex-wrap gap-4 mt-2">
        <div className="h-3 bg-slate-100 rounded-md w-24 animate-pulse" />
        <div className="h-3 bg-slate-100 rounded-md w-24 animate-pulse" />
        <div className="h-3 bg-slate-100 rounded-md w-32 animate-pulse" />
      </div>
    </div>
    <div className="w-full md:w-32 h-10 bg-slate-200 rounded-lg animate-pulse shrink-0 mt-4 md:mt-0" />
  </div>
);

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

  useEffect(() => {
    let isMounted = true;

    const loadPaginatedData = async () => {
      try {
        setLoading(true);
        const paginatedData = await getDiscoverableProblems(explorePage, EXPLORE_PAGE_SIZE);
        
        if (isMounted) {
          setPaginatedProblems(paginatedData.problems);
          setTotalPages(paginatedData.totalPages);
          setTotalElements(paginatedData.totalElements);
        }
      } catch (err) {
        if (isMounted) console.error("Failed to load paginated problems", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPaginatedData();

    return () => {
      isMounted = false;
    };
  }, [explorePage, debouncedSearch]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const exploreRangeStart = totalElements === 0 ? 0 : (explorePage * EXPLORE_PAGE_SIZE) + 1;
  const exploreRangeEnd = Math.min((explorePage + 1) * EXPLORE_PAGE_SIZE, totalElements);

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 p-6 md:p-8 animate-in fade-in duration-300">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Explore Open Problems</h2>

      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Live search by title, organization, or course..."
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-sm bg-white"
        />
      </div>

      <p className="text-xs text-slate-500 mb-6 font-medium">
        Problems matching your course are listed first.
      </p>

      {/* 🚀 FIX: Smooth Skeleton Loading State */}
      {loading && paginatedProblems.length === 0 ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : paginatedProblems.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
            <FolderOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No matches found</h3>
          <p className="text-slate-500 max-w-sm mx-auto text-sm font-medium">
            Try adjusting your search query to find what you're looking for.
          </p>
        </div>
      ) : (
        <div className={`transition-opacity duration-200 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
          <p className="text-xs text-slate-500 mb-4 font-bold uppercase tracking-wider">
            Showing {exploreRangeStart}–{exploreRangeEnd} of {totalElements} problem{totalElements === 1 ? "" : "s"}
          </p>
          
          <div className="space-y-4">
            {paginatedProblems.map((problem, index) => (
              /* 🚀 FIX: Made the entire box a clickable Link */
              <Link 
                href={`/solver/problem/${problem.id}`}
                key={problem.id} 
                className="group flex flex-col md:flex-row items-start md:items-center gap-5 p-5 bg-white rounded-xl border border-slate-200 hover:border-accent/40 hover:shadow-md transition-all cursor-pointer block"
              >
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold shrink-0 shadow-sm group-hover:bg-accent/5 group-hover:border-accent/20 group-hover:text-accent transition-colors">
                  {(explorePage * EXPLORE_PAGE_SIZE) + index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h4 className="font-bold text-slate-900 text-base group-hover:text-accent transition-colors">
                      {problem.title}
                    </h4>
                    
                    {/* 🚀 FIX: Themed status badges */}
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-md font-bold border shrink-0 uppercase tracking-wide ${
                      problem.status === "OPEN" ? "bg-accent/10 text-accent border-accent/20" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}>
                      {STATUS_LABELS[problem.status] ?? problem.status}
                    </span>
                    
                    {problem.courseMatch && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold uppercase tracking-wide">
                        Course Match
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-slate-400" /> {problem.organizationName}</span>
                    <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-slate-400" /> {problem.preferredProgram}</span>
                    <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-slate-400" /> {problem.subtasks.length} sub-tasks</span>
                    {problem.createdAt && (
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatDate(problem.createdAt)}</span>
                    )}
                  </div>
                </div>
                
                <div className="w-full md:w-auto shrink-0 flex justify-end mt-4 md:mt-0">
                  {/* 🚀 FIX: The button is now a span that reacts to the parent link hover */}
                  <span
                    className="w-full md:w-auto px-5 py-2.5 bg-white border border-slate-300 group-hover:border-accent group-hover:bg-slate-50 group-hover:text-accent text-slate-700 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    View Details
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* 🚀 FIX: Added cursor-pointer to all pagination buttons */}
          {totalPages > 1 && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); if (explorePage > 0) setExplorePage(explorePage - 1); }}
                      className={explorePage === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i).map((page) => {
                    if (page === 0 || page === totalPages - 1 || (page >= explorePage - 1 && page <= explorePage + 1)) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); setExplorePage(page); }} 
                            isActive={explorePage === page}
                            className="cursor-pointer"
                          >
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
                      className={explorePage === totalPages - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}
    </div>
  );
}