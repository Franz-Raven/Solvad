"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Activity, BellOff, Clock, ChevronRight } from "lucide-react";
import type { SeekerNotification } from "@/types/problem";
import { getSeekerNotifications } from "../api/dashboard";
import type { PaginatedNotificationsResponse } from "@/types/problem";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 5;

// 🚀 FIX: Added ATTEMPT_CLAIMED to match the actual database logs shown in your screenshot
const EVENT_TYPES = [
  "PROPOSAL_SUBMITTED",
  "PROPOSAL_APPROVED",
  "PROPOSAL_REJECTED",
  "ATTEMPT_CLAIMED", 
  "CAPACITY_REACHED",
  "STATUS_CHANGED"
];

const SkeletonNotification = () => (
  <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 mb-3">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0 space-y-2.5">
        <div className="h-4 bg-slate-200 rounded-md w-1/3 animate-pulse" />
        <div className="h-3 bg-slate-100 rounded-md w-3/4 animate-pulse" />
        <div className="flex gap-3 mt-3">
          <div className="h-5 bg-slate-200 rounded-md w-24 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded-md w-32 animate-pulse" />
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <div className="h-3 bg-slate-200 rounded-md w-16 animate-pulse" />
        <div className="h-4 w-4 bg-slate-200 rounded-md animate-pulse mt-1" />
      </div>
    </div>
  </div>
);

export function SeekerRecentActivity() {
  const [data, setData] = useState<PaginatedNotificationsResponse | any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    
    getSeekerNotifications(eventTypeFilter, currentPage, ITEMS_PER_PAGE)
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => {
        if (isMounted) console.error("Failed to fetch notifications", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [eventTypeFilter, currentPage]);

  const handleFilterChange = (value: string) => {
    setEventTypeFilter(value);
    setCurrentPage(0);
  };

  const formatNotificationTime = (dateString: string | undefined) => {
    if (!dateString) return "Just now";
    return new Date(dateString).toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
  };

  const getTimelineGroup = (dateString: string | undefined): string => {
    if (!dateString) return "Today"; 
    const diffDays = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return "Today"; 
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return "This Week";
    return "Earlier";
  };

  // 🚀 FIX: Added theme color mapping for ATTEMPT_CLAIMED
  const getEventBadge = (type: string) => {
    switch (type) {
      case "PROPOSAL_APPROVED": 
      case "ATTEMPT_CLAIMED": 
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "PROPOSAL_REJECTED": 
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "PROPOSAL_SUBMITTED": 
        return "bg-accent/10 text-accent border-accent/20";
      case "CAPACITY_REACHED": 
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "STATUS_CHANGED": 
        return "bg-slate-100 text-slate-700 border-slate-200";
      default: 
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const notifications: SeekerNotification[] = Array.isArray(data) 
    ? data 
    : (data?.notifications || data?.content || []);
    
  const totalPages = Array.isArray(data) ? 1 : (data?.totalPages || 0);

  const groupedNotifications = notifications.reduce((acc, notification) => {
    const timeValue = notification.timestamp || (notification as any).createdAt;
    const group = getTimelineGroup(timeValue);
    
    if (!acc[group]) acc[group] = [];
    acc[group].push(notification);
    return acc;
  }, {} as Record<string, SeekerNotification[]>);

  const orderedGroups = ["Today", "Yesterday", "This Week", "Earlier"].filter((g) => groupedNotifications[g]);

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 p-6 md:p-8 relative animate-in fade-in duration-300">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Activity className="w-6 h-6 text-accent" />
            Recent Activity
          </h2>
          <p className="text-sm text-slate-500">Updates when solvers claim your problems or statuses change.</p>
        </div>
        <Select value={eventTypeFilter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-full md:w-[220px] px-4 py-2.5 bg-white rounded-lg border border-slate-200 text-sm shadow-sm font-medium cursor-pointer">
            <SelectValue placeholder="Filter by event..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">All Events</SelectItem>
            {EVENT_TYPES.map((type) => (
              <SelectItem key={type} value={type} className="cursor-pointer">
                {type.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && notifications.length === 0 ? (
        <div className="space-y-8">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-100"></div>
              <span>Loading...</span>
              <div className="h-px flex-1 bg-slate-100"></div>
            </h3>
            {[...Array(ITEMS_PER_PAGE)].map((_, i) => <SkeletonNotification key={i} />)}
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 mt-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
            <BellOff className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No recent activity</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium">
            {eventTypeFilter !== "all" 
              ? "No activities match the selected filter." 
              : "Updates will appear here when solvers interact with your problems, submit proposals, or complete tasks."}
          </p>
          {eventTypeFilter !== "all" && (
            <button onClick={() => handleFilterChange("all")} className="mt-4 text-accent text-sm hover:underline font-bold cursor-pointer">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className={`transition-opacity duration-200 ${isLoading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
          <div className="space-y-8">
            {orderedGroups.map((group) => (
              <div key={group} className="relative">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-100"></div>
                  <span>{group}</span>
                  <div className="h-px flex-1 bg-slate-100"></div>
                </h3>
                <div className="space-y-3">
                  {groupedNotifications[group].map((n) => {
                    const timeValue = n.timestamp || (n as any).createdAt;
                    
                    return (
                      <Link 
                        key={n.id} 
                        href={`/seeker/problem/${n.problemId}`} 
                        className="group block p-4 bg-white rounded-xl border border-slate-200 hover:border-accent/40 hover:shadow-md hover:bg-slate-50 transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 group-hover:text-accent transition-colors truncate">{n.problemTitle}</p>
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2 font-medium">{n.message}</p>
                            <div className="flex flex-wrap items-center gap-3 mt-3">
                              <span className="text-xs font-semibold text-slate-700">{n.actorName}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border uppercase tracking-wide ${getEventBadge(n.eventType)}`}>
                                {n.eventType.replace(/_/g, " ")}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                              <Clock className="w-3.5 h-3.5" />
                              {formatNotificationTime(timeValue)}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-accent transition-colors mt-2" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

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
                            className="cursor-pointer font-medium"
                          >
                            {page + 1}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
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
  );
}