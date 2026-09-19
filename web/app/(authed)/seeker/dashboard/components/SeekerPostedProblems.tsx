"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  Calendar, 
  Layers, 
  GraduationCap, 
  Globe, 
  FolderOpen, 
  FileText, 
  X,
  ArrowRight
} from "lucide-react";
import type { ProblemSummaryResponse, SeekerProblemListResponse } from "@/types/problem";
import { getSeekerProblemList } from "../api/dashboard";
import { getAllSDGs } from "@/lib/data/sdgs";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SeekerPostedProblemsProps {
  onTotalChange?: (total: number) => void;
}

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

export function SeekerPostedProblems({ onTotalChange }: SeekerPostedProblemsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [paginatedData, setPaginatedData] = useState<SeekerProblemListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sdgFilter, setSdgFilter] = useState<string>("all");
  const [dateSort, setDateSort] = useState<string>("newest");
  const sdgs = getAllSDGs();

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedSearch, sdgFilter, dateSort, statusFilter]);

  useEffect(() => {
    let isMounted = true;

    const loadProblems = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getSeekerProblemList(
          debouncedSearch || undefined,
          sdgFilter !== "all" ? sdgFilter : undefined,
          dateSort,
          currentPage,
          ITEMS_PER_PAGE
        );
        
        if (isMounted) {
          setPaginatedData(result);
          onTotalChange?.(result.totalElements);
        }
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProblems();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, currentPage, sdgFilter, dateSort, onTotalChange]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
  };

  // 🚀 FIX: Display formatter to handle the long SOLVED_OPEN_FOR_IMPROVEMENT enum
  const formatStatusName = (status: string) => {
    if (status === "SOLVED_OPEN_FOR_IMPROVEMENT") return "OPEN FOR IMPROVEMENT";
    return status.replace(/_/g, " ");
  };

  // 🚀 FIX: Perfectly matched to the 6 actual backend enums
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-accent/10 text-accent border-accent/20";
      case "CLAIMED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "SOLVED_OPEN_FOR_IMPROVEMENT":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "COMPLETED":
        return "bg-green-50 text-green-700 border-green-200";
      case "CLOSED":
        return "bg-slate-50 text-slate-700 border-slate-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
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
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const displayProblems = paginatedData?.problems || [];
  const filteredProblems = statusFilter === "all" 
    ? displayProblems 
    : displayProblems.filter(p => p.status === statusFilter);

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 p-6 md:p-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Your Posted Problems</h2>
          <p className="text-sm text-slate-500">Manage and track the progress of your industry challenges.</p>
        </div>
        <Link
          href="/seeker/submit-problem"
          className="px-6 py-2.5 bg-secondary hover:bg-accent text-white text-sm font-bold rounded-lg transition-colors shadow-sm inline-flex items-center justify-center gap-2 whitespace-nowrap active:scale-[0.98]"
        >
          Post New Problem
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap items-center gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search titles or contexts..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-sm bg-white"
          />
        </div>
        
        <Select value={sdgFilter} onValueChange={(value) => setSdgFilter(value)}>
          <SelectTrigger className="w-[180px] px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm shadow-sm font-medium cursor-pointer">
            <SelectValue placeholder="All SDGs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">All SDGs</SelectItem>
            {sdgs.map((sdg) => (
              <SelectItem key={sdg} value={sdg} className="cursor-pointer">
                {sdg}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 🚀 FIX: Dropdown specifically matches backend ProblemStatus Enums */}
        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-[180px] px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm shadow-sm font-medium cursor-pointer">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">All Statuses</SelectItem>
            <SelectItem value="OPEN" className="cursor-pointer">Open</SelectItem>
            <SelectItem value="CLAIMED" className="cursor-pointer">Claimed</SelectItem>
           
            <SelectItem value="SOLVED_OPEN_FOR_IMPROVEMENT" className="cursor-pointer">Open for Improvement</SelectItem>
            <SelectItem value="COMPLETED" className="cursor-pointer">Completed</SelectItem>
            <SelectItem value="CLOSED" className="cursor-pointer">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateSort} onValueChange={(value) => setDateSort(value)}>
          <SelectTrigger className="w-[140px] px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm shadow-sm font-medium cursor-pointer">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest" className="cursor-pointer">Newest first</SelectItem>
            <SelectItem value="oldest" className="cursor-pointer">Oldest first</SelectItem>
            <SelectItem value="1day" className="cursor-pointer">Last 24 hours</SelectItem>
            <SelectItem value="1week" className="cursor-pointer">Last week</SelectItem>
            <SelectItem value="1month" className="cursor-pointer">Last month</SelectItem>
          </SelectContent>
        </Select>

        {(searchQuery || sdgFilter !== "all" || dateSort !== "newest" || statusFilter !== "all") && (
          <button
            onClick={() => {
              setSearchQuery("");
              setSdgFilter("all");
              setDateSort("newest");
              setStatusFilter("all");
            }}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
            title="Clear all filters"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content Area */}
      {error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm font-medium">
          {error}
        </div>
      ) : loading && displayProblems.length === 0 ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
            <FolderOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            {searchQuery || sdgFilter !== "all" || statusFilter !== "all" ? "No matches found" : "No problems posted yet"}
          </h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto text-sm font-medium">
            {searchQuery || sdgFilter !== "all" || statusFilter !== "all"
              ? "Try adjusting your filters or search query to find what you're looking for." 
              : "Get started by posting your first industry problem and connect with student solvers."}
          </p>
          {!(searchQuery || sdgFilter !== "all" || statusFilter !== "all") && (
            <Link
              href="/seeker/submit-problem"
              className="inline-flex px-6 py-2.5 bg-secondary hover:bg-accent text-white text-sm font-bold rounded-lg transition-colors shadow-sm active:scale-[0.98]"
            >
              Post Your First Problem
            </Link>
          )}
        </div>
      ) : (
        <div className={`transition-opacity duration-200 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
          <div className="space-y-4">
            {filteredProblems.map((problem) => (
              <Link
                key={problem.id}
                href={`/seeker/problem/${problem.id}`}
                className="group flex flex-col md:flex-row items-start md:items-center gap-5 p-5 bg-white rounded-xl border border-slate-200 hover:border-accent/40 hover:shadow-md transition-all cursor-pointer block"
              >
                <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-accent/5 group-hover:border-accent/20 transition-colors">
                  <FileText className="w-6 h-6 text-slate-400 group-hover:text-accent transition-colors" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h4 className="font-bold text-slate-900 text-base group-hover:text-accent transition-colors">
                      {problem.title}
                    </h4>
                    {/* 🚀 FIX: Passed status to new formatStatusName helper */}
                    <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md border uppercase tracking-wide shrink-0 ${getStatusBadge(problem.status)}`}>
                      {formatStatusName(problem.status)}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Posted {formatDate(problem.createdAt)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      {problem.subtaskCount} Sub-task{problem.subtaskCount !== 1 && 's'}
                    </span>
                    <span className="flex items-center gap-1.5 truncate max-w-[200px]">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      {problem.preferredProgram || "Any Program"}
                    </span>
                    {problem.sdgFocus && (
                      <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        <Globe className="w-3 h-3" />
                        {problem.sdgFocus}
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-full md:w-auto shrink-0 flex justify-end mt-4 md:mt-0">
                  <span
                    className="w-full md:w-auto px-5 py-2.5 bg-white border border-slate-300 group-hover:border-accent group-hover:bg-slate-50 group-hover:text-accent text-slate-700 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    View Details
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination Controls */}
          {paginatedData && paginatedData.totalPages > 1 && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 0) handlePageChange(currentPage - 1);
                      }}
                      className={currentPage === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: paginatedData.totalPages }, (_, i) => i).map((page) => {
                    if (
                      page === 0 ||
                      page === paginatedData.totalPages - 1 ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(page);
                            }}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page + 1}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
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
                        if (currentPage < paginatedData.totalPages - 1) {
                          handlePageChange(currentPage + 1);
                        }
                      }}
                      className={
                        currentPage === paginatedData.totalPages - 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
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