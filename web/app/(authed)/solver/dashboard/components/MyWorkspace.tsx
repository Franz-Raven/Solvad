"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Rocket, CheckCircle2, Hourglass, Inbox, Calendar, GitBranch, ArrowRight, Eye 
} from "lucide-react";
import { getWorkspaceAttempts } from "../api/dashboard";
import { PaginatedAttemptsResponse } from "@/types/attempt";

import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";

type WorkspaceTab = "ACTIVE" | "PENDING" | "HISTORY";
const ITEMS_PER_PAGE = 5;

// Skeleton loader component matching the exact layout of the list items
const SkeletonCard = () => (
  <div className="flex flex-col md:flex-row md:items-center gap-4 p-5 bg-gray-50/50 rounded-xl border border-gray-100">
    <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-xl animate-pulse shrink-0" />
    <div className="flex-1 min-w-0 space-y-3 w-full">
      <div className="flex gap-2 items-center">
        <div className="h-5 bg-gray-200 rounded-md w-2/3 md:w-1/3 animate-pulse" />
        <div className="h-5 bg-gray-200 rounded-md w-16 animate-pulse hidden md:block" />
      </div>
      <div className="h-4 bg-gray-100 rounded-md w-3/4 md:w-1/2 animate-pulse" />
      <div className="flex gap-4">
        <div className="h-3 bg-gray-100 rounded-md w-20 animate-pulse" />
        <div className="h-3 bg-gray-100 rounded-md w-24 animate-pulse" />
      </div>
    </div>
    <div className="w-full md:w-36 h-10 bg-gray-200 rounded-lg animate-pulse shrink-0" />
  </div>
);

export function MyWorkspace() {
  const [paginatedData, setPaginatedData] = useState<PaginatedAttemptsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("ACTIVE");
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadAttempts = async () => {
      try {
        setLoading(true);
        const data = await getWorkspaceAttempts(activeTab, currentPage, ITEMS_PER_PAGE);
        
        if (isMounted) {
          setPaginatedData(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to load workspace");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAttempts();

    return () => {
      isMounted = false;
    };
  }, [activeTab, currentPage]);

  const handleTabChange = (tab: WorkspaceTab) => {
    if (activeTab === tab) return;
    setActiveTab(tab);
    setCurrentPage(0);
    setPaginatedData(null); // Instantly trigger skeleton loaders when switching tabs
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const displayedAttempts = paginatedData?.attempts || [];
  const totalElements = paginatedData?.totalElements || 0;
  const totalPages = paginatedData?.totalPages || 0;
  
  const rangeStart = totalElements === 0 ? 0 : (currentPage * ITEMS_PER_PAGE) + 1;
  const rangeEnd = Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalElements);

  // 🚀 FIX: Max-w-7xl correctly applied, syntax error removed.
  return (
    <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 md:p-8 w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">My Workspace</h1>
        <p className="text-sm text-gray-500 mb-6">
          Manage your active solutions, pending reviews, and past work.
        </p>

        {error && <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>}

        {/* Custom Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit overflow-x-auto">
          {(["ACTIVE", "PENDING", "HISTORY"] as WorkspaceTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-5 md:px-6 py-2 rounded-lg text-sm font-semibold transition-all capitalize whitespace-nowrap ${
                activeTab === tab 
                  ? "bg-white text-secondary shadow-sm" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              }`}
            >
              {tab.toLowerCase()}
            </button>
          ))}
        </div>

        {loading && displayedAttempts.length === 0 ? (
          <div className="space-y-4">
             {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : displayedAttempts.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200 mt-4">
            <div className="w-16 h-16 bg-white border border-gray-100 shadow-sm rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No {activeTab.toLowerCase()} attempts</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
              {activeTab === "ACTIVE" && "You don't have any active problems right now. Go find one!"}
              {activeTab === "PENDING" && "You have no proposals waiting for approval."}
              {activeTab === "HISTORY" && "You haven't completed or abandoned any problems yet."}
            </p>
            {activeTab === "ACTIVE" && (
              <Link href="/solver/dashboard" className="px-6 py-2.5 bg-secondary hover:bg-accent text-white text-sm font-bold rounded-lg inline-block transition-colors shadow-sm">
                Browse Open Problems
              </Link>
            )}
          </div>
        ) : (
          <div className={`transition-opacity duration-200 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
            <p className="text-xs text-gray-500 mb-4 font-medium">
              Showing {rangeStart}–{rangeEnd} of {totalElements} attempt{totalElements === 1 ? "" : "s"}
            </p>

            <div className="space-y-4">
              {displayedAttempts.map((attempt) => (
                <div key={attempt.id} className="flex flex-col md:flex-row md:items-center gap-4 p-5 bg-gray-50 rounded-xl hover:bg-accent/5 transition-colors border border-gray-200 hover:border-accent/30 group">
                  
                  <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-colors group-hover:border-accent/30 group-hover:text-accent">
                    {attempt.status === "ACTIVE" ? <Rocket className="w-6 h-6 text-accent" /> : attempt.status === "COMPLETED" ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <Hourglass className="w-6 h-6 text-amber-500" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h4 className="font-semibold text-gray-900 text-base group-hover:text-accent transition-colors truncate max-w-full">
                        {attempt.problemTitle || "Untitled Problem"}
                      </h4>
                      
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-md font-bold border shrink-0 ${
                        attempt.status === "ACTIVE" ? "bg-accent/10 text-accent border-accent/20" :
                        attempt.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        attempt.status === "TERMINATED" || attempt.status === "ABANDONED" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {attempt.status.replace("_", " ")}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2 font-medium truncate max-w-full">
                      {attempt.targetSubtaskTitle ? `Subtask: ${attempt.targetSubtaskTitle}` : "Full Problem"}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5 font-medium"><Calendar className="w-3.5 h-3.5" /> Started {formatDate(attempt.claimedAt)}</span>
                      {attempt.parentAttemptId && (
                        <span className="flex items-center gap-1.5 text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-semibold">
                          <GitBranch className="w-3.5 h-3.5" /> Forked Attempt
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full md:w-auto shrink-0 flex justify-end mt-2 md:mt-0">
                    {attempt.status === "ACTIVE" ? (
                      <Link href={`/solver/workspace/${attempt.problemId}`} className="w-full md:w-auto px-5 py-2.5 bg-white border border-gray-300 hover:border-accent hover:text-accent text-gray-700 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                        Enter Workspace <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <Link href={`/solver/problem/${attempt.problemId}`} className="w-full md:w-auto px-5 py-2.5 bg-white border border-gray-300 hover:border-accent hover:text-accent text-gray-700 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm">
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
          </div>
        )}
      </div>
    </div>
  );
}