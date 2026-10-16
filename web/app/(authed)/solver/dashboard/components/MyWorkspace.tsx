"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Inbox, Calendar, ChevronRight, Building2 
} from "lucide-react";
import { getWorkspaceAttempts, getPendingClaims } from "../api/dashboard";
import type { PaginatedAttemptsResponse, PaginatedClaimsResponse } from "@/types/attempt";
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";

type WorkspaceTab = "ACTIVE" | "PENDING" | "HISTORY";
const ITEMS_PER_PAGE = 5;

const SkeletonCard = () => (
  <div className="flex flex-col md:flex-row md:items-center gap-5 p-5 bg-slate-50/50 rounded-xl border border-slate-100">
    <div className="w-12 h-12 bg-slate-200 rounded-xl animate-pulse shrink-0" />
    <div className="flex-1 min-w-0 space-y-3 w-full">
      <div className="flex gap-3 items-center"><div className="h-5 bg-slate-200 rounded-md w-1/3 animate-pulse" /></div>
      <div className="flex flex-wrap gap-4 mt-2"><div className="h-3 bg-slate-100 rounded-md w-24 animate-pulse" /></div>
    </div>
    <div className="w-full md:w-32 h-10 bg-slate-200 rounded-lg animate-pulse shrink-0 mt-4 md:mt-0" />
  </div>
);

export function MyWorkspace() {
  const [paginatedAttempts, setPaginatedAttempts] = useState<PaginatedAttemptsResponse | null>(null);
  const [paginatedClaims, setPaginatedClaims] = useState<PaginatedClaimsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("ACTIVE");
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        if (activeTab === "PENDING") {
          const data = await getPendingClaims(currentPage, ITEMS_PER_PAGE);
          if (isMounted) { setPaginatedClaims(data); setPaginatedAttempts(null); setError(null); }
        } else {
          const data = await getWorkspaceAttempts(activeTab, currentPage, ITEMS_PER_PAGE);
          if (isMounted) { setPaginatedAttempts(data); setPaginatedClaims(null); setError(null); }
        }
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to load workspace");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [activeTab, currentPage]);

  const handleTabChange = (tab: WorkspaceTab) => {
    if (activeTab === tab) return;
    setActiveTab(tab);
    setCurrentPage(0);
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  // 🚀 DYNAMIC STATUS COLORS
  const getStatusStyles = (status: string) => {
    switch (status.toUpperCase()) {
      case "ABANDONED":
      case "REJECTED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "COMPLETED":
      case "APPROVED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "PENDING":
      case "PENDING_REVIEW":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "ACTIVE":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  // 🚀 ROBUST SEEKER EXTRACTION
  const extractSeekerInfo = (item: any) => ({
    name: item.seekerName || item.seeker?.organizationName || "Industry Partner",
    url: item.seekerProfileUrl || item.seeker?.profileUrl || item.seeker?.user?.profileUrl || null,
  });

  const normalizedItems = activeTab === "PENDING" 
    ? (paginatedClaims?.claims || []).map(c => {
        const seeker = extractSeekerInfo(c);
        return {
          id: c.id,
          title: c.problemTitle,
          status: c.status,
          subtask: c.targetSubtaskTitle,
          date: c.submittedAt,
          dateLabel: "Applied",
          href: `/solver/proposal/${c.id}`,
          badgeClass: getStatusStyles(c.status),
          btnText: "View Proposal",
          seekerName: seeker.name,
          seekerProfileUrl: seeker.url
        };
      })
    : (paginatedAttempts?.attempts || []).map(a => {
        const seeker = extractSeekerInfo(a);
        return {
          id: a.id,
          title: a.problemTitle,
          status: a.status,
          subtask: a.targetSubtaskTitle,
          date: activeTab === "HISTORY" ? (a.completedAt || a.updatedAt) : a.claimedAt,
          dateLabel: activeTab === "HISTORY" ? "Concluded" : "Started",
          href: activeTab === "HISTORY" ? `/solver/history/${a.id}` : `/solver/workspace/${a.problemId}`,
          badgeClass: getStatusStyles(a.status),
          btnText: activeTab === "HISTORY" ? "View Record" : "Enter Workspace",
          seekerName: seeker.name,
          seekerProfileUrl: seeker.url
        };
      });

  const totalElements = activeTab === "PENDING" ? (paginatedClaims?.totalElements || 0) : (paginatedAttempts?.totalElements || 0);
  const totalPages = activeTab === "PENDING" ? (paginatedClaims?.totalPages || 0) : (paginatedAttempts?.totalPages || 0);
  const rangeStart = totalElements === 0 ? 0 : (currentPage * ITEMS_PER_PAGE) + 1;
  const rangeEnd = Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalElements);

  return (
    <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 p-6 md:p-8 w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">My Workspace</h1>
        <p className="text-sm text-slate-500 mb-6 font-medium">Manage your active solutions, pending applications, and past work.</p>

        {error && <div className="mb-6 bg-rose-50 border border-rose-200 rounded-lg p-4 text-rose-700 text-sm font-medium">{error}</div>}

        <div className="flex space-x-1 bg-slate-50 p-1 rounded-xl mb-6 w-fit overflow-x-auto border border-slate-100">
          {(["ACTIVE", "PENDING", "HISTORY"] as WorkspaceTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-5 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all capitalize whitespace-nowrap cursor-pointer active:scale-[0.98] outline-none ${
                activeTab === tab 
                  ? "bg-white text-emerald-700 shadow-sm border border-slate-200" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
              }`}
            >
              {tab.toLowerCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            {[...Array(ITEMS_PER_PAGE)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : normalizedItems.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200 mt-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-white border border-slate-100 shadow-sm rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No {activeTab.toLowerCase()} records</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6 font-medium">
              {activeTab === "ACTIVE" && "You don't have any active problems right now. Go find one!"}
              {activeTab === "PENDING" && "You have no proposals currently awaiting Seeker approval."}
              {activeTab === "HISTORY" && "You haven't completed or abandoned any problems yet."}
            </p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            <p className="text-[11px] text-slate-500 mb-4 font-bold uppercase tracking-wider">
              Showing {rangeStart}–{rangeEnd} of {totalElements} record{totalElements === 1 ? "" : "s"}
            </p>

            <div className="space-y-4">
              {normalizedItems.map((item) => (
                <Link 
                  href={item.href}
                  key={item.id} 
                  className="group flex flex-col md:flex-row items-start md:items-center gap-5 p-5 bg-white rounded-xl border border-slate-200 hover:border-emerald-500/40 hover:shadow-md transition-all cursor-pointer block"
                >
                  <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden group-hover:border-emerald-500/40 transition-colors">
                    {item.seekerProfileUrl ? (
                      <img 
                        src={item.seekerProfileUrl} 
                        alt={item.seekerName} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <h4 className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition-colors truncate">
                        {item.title || "Untitled Problem"}
                      </h4>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold border shrink-0 uppercase tracking-wider ${item.badgeClass}`}>
                        {item.status.replace("_", " ")}
                      </span>
                    </div>
                    
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 truncate">
                      {item.seekerName}
                    </p>
                    
                    <p className="text-sm text-slate-600 mb-2 font-medium truncate">
                      {item.subtask ? `Subtask: ${item.subtask}` : "Full Problem"}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> 
                        {item.dateLabel} {formatDate(item.date)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-auto shrink-0 flex justify-end mt-4 md:mt-0">
                    <span className="w-full md:w-auto px-5 py-2.5 bg-white border border-slate-300 group-hover:border-emerald-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 text-slate-700 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm">
                      {item.btnText}
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>

             {totalPages > 1 && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (currentPage > 0) setCurrentPage(currentPage - 1); }} className={currentPage === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i).map((page) => {
                      if (page === 0 || page === totalPages - 1 || (page >= currentPage - 1 && page <= currentPage + 1)) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(page); }} isActive={currentPage === page} className="cursor-pointer font-bold">
                              {page + 1}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      if (page === currentPage - 2 || page === currentPage + 2) return <PaginationItem key={page}><PaginationEllipsis /></PaginationItem>;
                      return null;
                    })}
                    <PaginationItem>
                      <PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1); }} className={currentPage === totalPages - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
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