"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Rocket, CheckCircle2, Hourglass, Inbox, Calendar, GitBranch, ArrowRight, Eye 
} from "lucide-react";
import { getWorkspaceAttempts, type PaginatedAttemptsResponse } from "@/lib/api/attempts";
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";

type WorkspaceTab = "ACTIVE" | "PENDING" | "HISTORY";
const ITEMS_PER_PAGE = 5;

export default function SolverWorkspacePage() {
  const [paginatedData, setPaginatedData] = useState<PaginatedAttemptsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("ACTIVE");
  const [currentPage, setCurrentPage] = useState(0);

  const loadAttempts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getWorkspaceAttempts(activeTab, currentPage, ITEMS_PER_PAGE);
      setPaginatedData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage]);

  useEffect(() => {
    loadAttempts();
  }, [loadAttempts]);

  const handleTabChange = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    setCurrentPage(0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const displayedAttempts = paginatedData?.attempts || [];
  const totalElements = paginatedData?.totalElements || 0;
  const totalPages = paginatedData?.totalPages || 0;
  
  const rangeStart = totalElements === 0 ? 0 : (currentPage * ITEMS_PER_PAGE) + 1;
  const rangeEnd = Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalElements);

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">My Workspace</h1>
          <p className="text-gray-600">Manage your active solutions, pending reviews, and past work.</p>
        </div>

        {error && <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>}

        {/* Custom Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-8 w-fit">
          {(["ACTIVE", "PENDING", "HISTORY"] as WorkspaceTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all capitalize ${
                activeTab === tab ? "bg-white text-secondary shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.toLowerCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayedAttempts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No {activeTab.toLowerCase()} attempts</h3>
            <p className="text-gray-500 mb-6">
              {activeTab === "ACTIVE" && "You don't have any active problems right now. Go find one!"}
              {/* 🚀 FIX: Updated empty state text for Pending Tab */}
              {activeTab === "PENDING" && "You have no sub-tasks waiting for Seeker review."}
              {activeTab === "HISTORY" && "You haven't completed or abandoned any problems yet."}
            </p>
            {activeTab === "ACTIVE" && (
              <Link href="/solver/dashboard" className="px-6 py-2.5 bg-secondary hover:bg-accent text-white font-medium rounded-lg inline-block transition-colors">
                Browse Open Problems
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-4 font-medium">
              Showing {rangeStart}–{rangeEnd} of {totalElements} attempt{totalElements === 1 ? "" : "s"}
            </p>

            <div className="space-y-4">
              {displayedAttempts.map((attempt) => (
                <div key={attempt.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col md:flex-row items-start md:items-center gap-6 hover:border-accent/30 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-gradient-to-br from-secondary/80 to-accent rounded-xl flex items-center justify-center text-white shrink-0">
                    {/* 🚀 FIX: Clean Lucide icons */}
                    {attempt.status === "ACTIVE" ? <Rocket className="w-6 h-6" /> : attempt.status === "COMPLETED" ? <CheckCircle2 className="w-6 h-6" /> : <Hourglass className="w-6 h-6" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-1.5">
                      <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-accent transition-colors">
                        {attempt.problemTitle || "Untitled Problem"}
                      </h3>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-md font-bold border ${
                        attempt.status === "ACTIVE" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        attempt.status === "COMPLETED" ? "bg-green-50 text-green-700 border-green-200" :
                        attempt.status === "TERMINATED" || attempt.status === "ABANDONED" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {/* 🚀 FIX: Format PENDING_REVIEW text so it looks nice */}
                        {attempt.status.replace("_", " ")}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 font-medium">
                      {attempt.targetSubtaskTitle ? `Subtask: ${attempt.targetSubtaskTitle}` : "Full Problem"}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" /> Started {formatDate(attempt.claimedAt)}</span>
                      {attempt.parentAttemptId && (
                        <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          <GitBranch className="w-3.5 h-3.5" /> Forked Attempt
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full md:w-auto shrink-0 flex justify-end">
                    {attempt.status === "ACTIVE" ? (
                      <Link href={`/solver/problem/${attempt.problemId}/work`} className="w-full md:w-auto px-5 py-2.5 bg-secondary hover:bg-accent text-white text-sm font-medium rounded-lg text-center flex items-center justify-center gap-2 transition-colors">
                        Enter Workspace <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <Link href={`/solver/problem/${attempt.problemId}`} className="w-full md:w-auto px-5 py-2.5 bg-white hover:bg-gray-50 hover:text-accent border border-gray-300 text-sm font-medium rounded-lg text-center flex items-center justify-center gap-2 transition-colors">
                        <Eye className="w-4 h-4" /> View Problem
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (currentPage > 0) setCurrentPage(currentPage - 1); }} className={currentPage === 0 ? "pointer-events-none opacity-50" : ""} />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i).map((page) => {
                      if (page === 0 || page === totalPages - 1 || (page >= currentPage - 1 && page <= currentPage + 1)) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(page); }} isActive={currentPage === page}>
                              {page + 1}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return <PaginationItem key={page}><PaginationEllipsis /></PaginationItem>;
                      }
                      return null;
                    })}

                    <PaginationItem>
                      <PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1); }} className={currentPage === totalPages - 1 ? "pointer-events-none opacity-50" : ""} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}