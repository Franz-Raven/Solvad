"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { ProblemResponse, PaginatedProblemsResponse } from "@/types/problem";
import { searchMyProblems } from "@/lib/api/problem";
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
  problems: ProblemResponse[];
  loading: boolean;
  error: string | null;
}

export function SeekerPostedProblems({ problems, loading, error }: SeekerPostedProblemsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [paginatedData, setPaginatedData] = useState<PaginatedProblemsResponse | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sdgFilter, setSdgFilter] = useState<string>("all");
  const [dateSort, setDateSort] = useState<string>("newest");
  const sdgs = getAllSDGs();

  useEffect(() => {
    loadProblems();
  }, [searchQuery, currentPage, statusFilter, sdgFilter, dateSort]);

  const loadProblems = async () => {
    try {
      setSearchLoading(true);
      const result = await searchMyProblems(
        searchQuery || undefined,
        sdgFilter !== "all" ? sdgFilter : undefined,
        dateSort,
        currentPage,
        ITEMS_PER_PAGE
      );
      setPaginatedData(result);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setSearchLoading(false);
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
  const ITEMS_PER_PAGE = 10;

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

  const displayProblems = paginatedData?.problems || [];
  const isLoading = loading || searchLoading;
  const filteredProblems = statusFilter === "all" 
    ? displayProblems 
    : displayProblems.filter(p => p.status === statusFilter);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
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

      <div className="mb-6 flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search problems by title, statement, or context..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>
        <Select value={sdgFilter} onValueChange={(value) => { setSdgFilter(value); setCurrentPage(0); }}>
          <SelectTrigger className="w-[200px] px-4 py-2.5 !h-auto rounded-lg border border-gray-300 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="py-2.5">All SDGs</SelectItem>
            {sdgs.map((sdg) => (
              <SelectItem key={sdg} value={sdg} className="py-2.5">
                {sdg}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dateSort} onValueChange={(value) => { setDateSort(value); setCurrentPage(0); }}>
          <SelectTrigger className="w-[160px] px-4 py-2.5 !h-auto rounded-lg border border-gray-300 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest" className="py-2.5">Newest first</SelectItem>
            <SelectItem value="oldest" className="py-2.5">Oldest first</SelectItem>
            <SelectItem value="1day" className="py-2.5">1 day ago</SelectItem>
            <SelectItem value="1week" className="py-2.5">1 week ago</SelectItem>
            <SelectItem value="1month" className="py-2.5">1 month ago</SelectItem>
            <SelectItem value="1year" className="py-2.5">1 year ago</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(value) => { handleStatusFilter(value); }}>
          <SelectTrigger className="w-[160px] px-4 py-2.5 !h-auto rounded-lg border border-gray-300 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="py-2.5">All Statuses</SelectItem>
            <SelectItem value="OPEN" className="py-2.5">Open</SelectItem>
            <SelectItem value="IN_PROGRESS" className="py-2.5">In Progress</SelectItem>
            <SelectItem value="SOLVED" className="py-2.5">Solved</SelectItem>
            <SelectItem value="CLOSED" className="py-2.5">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {!isLoading && !error && filteredProblems.length === 0 && (
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
            {searchQuery ? "No problems found" : "No problems posted yet"}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery 
              ? "Try adjusting your search query" 
              : "Get started by posting your first industry problem"}
          </p>
          {!searchQuery && (
            <Link
              href="/seeker/submit-problem"
              className="inline-block px-6 py-3 bg-accent hover:bg-secondary text-white font-medium rounded-lg transition-colors"
            >
              Post Your First Problem
            </Link>
          )}
        </div>
      )}

      {!isLoading && !error && filteredProblems.length > 0 && (
        <>
          <div className="space-y-4">
            {filteredProblems.map((problem, index) => (
              <div
                key={problem.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-accent/20 transition-colors border border-gray-200"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-accent to-secondary rounded-lg flex items-center justify-center text-white font-bold">
                  {currentPage * ITEMS_PER_PAGE + index + 1}
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
                    sub-tasks • {problem.preferredProgram}
                    {problem.sdgFocus && (
                      <> • <span className="text-secondary font-medium">{problem.sdgFocus}</span></>
                    )}
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

          {paginatedData && paginatedData.totalPages > 1 && (
            <div className="mt-8">
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
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
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
