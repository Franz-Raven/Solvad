"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Rocket, CheckCircle2, Hourglass, Inbox, Calendar, GitBranch, ChevronRight 
} from "lucide-react";
import { getWorkspaceAttempts } from "../api/dashboard";
import { PaginatedAttemptsResponse } from "@/types/attempt";

import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";

type WorkspaceTab = "ACTIVE" | "PENDING" | "HISTORY";
const ITEMS_PER_PAGE = 5;

// 🚀 Skeleton loader precisely matched to the Home list item layout
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
        <div className="h-3 bg-slate-100 rounded-md w-32 animate-pulse" />
      </div>
    </div>
    <div className="w-full md:w-32 h-10 bg-slate-200 rounded-lg animate-pulse shrink-0 mt-4 md:mt-0" />
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
        // Triggers skeleton loading immediately on tab OR page change
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
    <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 p-6 md:p-8 w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">My Workspace</h1>
        <p className="text-sm text-slate-500 mb-6 font-medium">
          Manage your active solutions, pending reviews, and past work.
        </p>

        {error && <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm font-medium">{error}</div>}

        {/* Custom Tab Navigation */}
        <div className="flex space-x-1 bg-slate-50 p-1 rounded-xl mb-6 w-fit overflow-x-auto border border-slate-100">
          {(["ACTIVE", "PENDING", "HISTORY"] as WorkspaceTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-5 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all capitalize whitespace-nowrap cursor-pointer ${
                activeTab === tab 
                  ? "bg-white text-accent shadow-sm border border-slate-200" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab.toLowerCase()}
            </button>
          ))}
        </div>

        {/* 🚀 Skeleton displays instantly when `loading` is true, keeping layout shifting minimal */}
        {loading ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            {[...Array(ITEMS_PER_PAGE)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : displayedAttempts.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200 mt-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-white border border-slate-100 shadow-sm rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No {activeTab.toLowerCase()} attempts</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6 font-medium">
              {activeTab === "ACTIVE" && "You don't have any active problems right now. Go find one!"}
              {activeTab === "PENDING" && "You have no proposals waiting for approval."}
              {activeTab === "HISTORY" && "You haven't completed or abandoned any problems yet."}
            </p>
            {activeTab === "ACTIVE" && (
              <Link href="/solver/dashboard" className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-white text-sm font-bold rounded-xl inline-block transition-all shadow-md cursor-pointer">
                Browse Open Problems
              </Link>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            <p className="text-[11px] text-slate-500 mb-4 font-bold uppercase tracking-wider">
              Showing {rangeStart}–{rangeEnd} of {totalElements} attempt{totalElements === 1 ? "" : "s"}
            </p>

            <div className="space-y-4">
              {displayedAttempts.map((attempt) => {
                const href = attempt.status === "ACTIVE" 
                  ? `/solver/workspace/${attempt.problemId}` 
                  : `/solver/problem/${attempt.problemId}`;

                return (
                  /* 🚀 Exactly matches the Home Link wrapper (compact, flex-row layout) */
                  <Link 
                    href={href}
                    key={attempt.id} 
                    className="group flex flex-col md:flex-row items-start md:items-center gap-5 p-5 bg-white rounded-xl border border-slate-200 hover:border-accent/40 hover:shadow-md transition-all cursor-pointer block"
                  >
                    
                    {/* Left Side: Status Icon Box (Styled like the numbered box) */}
                    <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:bg-accent/5 group-hover:border-accent/20 transition-colors">
                      {attempt.status === "ACTIVE" ? <Rocket className="w-5 h-5 text-accent" /> : attempt.status === "COMPLETED" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Hourglass className="w-5 h-5 text-amber-500" />}
                    </div>
                    
                    {/* Center Content: Title, Badges, Meta Data */}
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h4 className="font-bold text-slate-900 text-base group-hover:text-accent transition-colors truncate">
                          {attempt.problemTitle || "Untitled Problem"}
                        </h4>
                        
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-md font-bold border shrink-0 uppercase tracking-wide ${
                          attempt.status === "ACTIVE" ? "bg-accent/10 text-accent border-accent/20" :
                          attempt.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          attempt.status === "TERMINATED" || attempt.status === "ABANDONED" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {attempt.status.replace("_", " ")}
                        </span>
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-2 font-medium truncate">
                        {attempt.targetSubtaskTitle ? `Subtask: ${attempt.targetSubtaskTitle}` : "Full Problem"}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> 
                          Started {formatDate(attempt.claimedAt)}
                        </span>
                        {attempt.parentAttemptId && (
                          <span className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-bold">
                            <GitBranch className="w-3.5 h-3.5 text-slate-400" /> Forked
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Right Side: Visual Pseudo-Button */}
                    <div className="w-full md:w-auto shrink-0 flex justify-end mt-4 md:mt-0">
                      <span className="w-full md:w-auto px-5 py-2.5 bg-white border border-slate-300 group-hover:border-accent group-hover:bg-slate-50 group-hover:text-accent text-slate-700 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm">
                        {attempt.status === "ACTIVE" ? "Enter Workspace" : "View Details"}
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); if (currentPage > 0) setCurrentPage(currentPage - 1); }} 
                        className={currentPage === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i).map((page) => {
                      if (page === 0 || page === totalPages - 1 || (page >= currentPage - 1 && page <= currentPage + 1)) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink 
                              href="#" 
                              onClick={(e) => { e.preventDefault(); setCurrentPage(page); }} 
                              isActive={currentPage === page}
                              className="cursor-pointer font-bold"
                            >
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
                      <PaginationNext 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1); }} 
                        className={currentPage === totalPages - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                      />
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