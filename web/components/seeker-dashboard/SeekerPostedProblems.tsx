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
import { getSeekerProblemList } from "@/lib/api/problem";
import { getAllSDGs } from "@/lib/data/sdgs";
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

export function SeekerPostedProblems({ onTotalChange }: SeekerPostedProblemsProps) {
  const [searchQuery, setSearchQuery] = useState("");
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
    loadProblems();
  }, [searchQuery, currentPage, sdgFilter, dateSort]);

  const loadProblems = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getSeekerProblemList(
        searchQuery || undefined,
        sdgFilter !== "all" ? sdgFilter : undefined,
        dateSort,
        currentPage,
        ITEMS_PER_PAGE
      );
      setPaginatedData(result);
      onTotalChange?.(result.totalElements);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "IN_PROGRESS":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "SOLVED":
        return "bg-green-50 text-green-700 border-green-200";
      case "CLOSED":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Your Posted Problems</h2>
          <p className="text-sm text-gray-500">Manage and track the progress of your industry challenges.</p>
        </div>
        <Link
          href="/seeker/submit-problem"
          className="px-6 py-2.5 bg-secondary hover:bg-accent text-white text-sm font-medium rounded-lg transition-colors shadow-sm inline-flex items-center justify-center gap-2 whitespace-nowrap"
        >
          Post New Problem
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap items-center gap-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search titles or contexts..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-sm bg-white"
          />
        </div>
        
        <Select value={sdgFilter} onValueChange={(value) => { setSdgFilter(value); setCurrentPage(0); }}>
          <SelectTrigger className="w-[180px] px-3 py-2 bg-white rounded-lg border border-gray-300 text-sm shadow-sm">
            <SelectValue placeholder="All SDGs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All SDGs</SelectItem>
            {sdgs.map((sdg) => (
              <SelectItem key={sdg} value={sdg}>
                {sdg}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-[150px] px-3 py-2 bg-white rounded-lg border border-gray-300 text-sm shadow-sm">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="SOLVED">Solved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateSort} onValueChange={(value) => { setDateSort(value); setCurrentPage(0); }}>
          <SelectTrigger className="w-[140px] px-3 py-2 bg-white rounded-lg border border-gray-300 text-sm shadow-sm">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="1day">Last 24 hours</SelectItem>
            <SelectItem value="1week">Last week</SelectItem>
            <SelectItem value="1month">Last month</SelectItem>
          </SelectContent>
        </Select>

        {(searchQuery || sdgFilter !== "all" || dateSort !== "newest" || statusFilter !== "all") && (
          <button
            onClick={() => {
              setSearchQuery("");
              setSdgFilter("all");
              setDateSort("newest");
              setStatusFilter("all");
              setCurrentPage(0);
            }}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
            title="Clear all filters"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
            <FolderOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {searchQuery || sdgFilter !== "all" || statusFilter !== "all" ? "No matches found" : "No problems posted yet"}
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto text-sm">
            {searchQuery || sdgFilter !== "all" || statusFilter !== "all"
              ? "Try adjusting your filters or search query to find what you're looking for." 
              : "Get started by posting your first industry problem and connect with student solvers."}
          </p>
          {!(searchQuery || sdgFilter !== "all" || statusFilter !== "all") && (
            <Link
              href="/seeker/submit-problem"
              className="inline-flex px-6 py-2.5 bg-secondary hover:bg-accent text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              Post Your First Problem
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {filteredProblems.map((problem) => (
              <div
                key={problem.id}
                className="group flex flex-col md:flex-row items-start md:items-center gap-5 p-5 bg-white rounded-xl border border-gray-200 hover:border-accent/40 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center shrink-0 group-hover:bg-accent/5 transition-colors">
                  <FileText className="w-6 h-6 text-gray-400 group-hover:text-accent transition-colors" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h4 className="font-bold text-gray-900 text-base truncate group-hover:text-accent transition-colors">
                      {problem.title}
                    </h4>
                    <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md border uppercase tracking-wide ${getStatusBadge(problem.status)}`}>
                      {problem.status.replace("_", " ")}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      Posted {formatDate(problem.createdAt)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-gray-400" />
                      {problem.subtaskCount} Sub-task{problem.subtaskCount !== 1 && 's'}
                    </span>
                    <span className="flex items-center gap-1.5 truncate max-w-[200px]">
                      <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                      {problem.preferredProgram || "Any Program"}
                    </span>
                    {problem.sdgFocus && (
                      <span className="flex items-center gap-1.5 text-secondary">
                        <Globe className="w-3.5 h-3.5" />
                        {problem.sdgFocus}
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-full md:w-auto shrink-0 flex justify-end mt-4 md:mt-0">
                  <Link
                    href={`/seeker/problem/${problem.id}`}
                    className="w-full md:w-auto px-5 py-2.5 bg-white border border-gray-300 hover:border-accent hover:bg-gray-50 hover:text-accent text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {paginatedData && paginatedData.totalPages > 1 && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 0) handlePageChange(currentPage - 1);
                      }}
                      className={currentPage === 0 ? "pointer-events-none opacity-50" : ""}
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
  );
}