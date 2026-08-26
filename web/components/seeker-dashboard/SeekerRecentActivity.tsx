"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, BellOff, Clock, Loader2, ChevronRight } from "lucide-react";
import type { SeekerNotification } from "@/types/problem";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface SeekerRecentActivityProps {
  notifications: SeekerNotification[];
  isLoading?: boolean; // 🚀 Added isLoading prop
}

const ITEMS_PER_PAGE = 10;

export function SeekerRecentActivity({ notifications, isLoading = false }: SeekerRecentActivityProps) {
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);

  const formatNotificationTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getTimelineGroup = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return "This Week";
    return "Earlier";
  };

  const getUniqueEventTypes = () => {
    const types = new Set(notifications.map((n) => n.eventType));
    return Array.from(types);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (eventTypeFilter === "all") return true;
    return n.eventType === eventTypeFilter;
  });

  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

  const groupedNotifications = paginatedNotifications.reduce((acc, notification) => {
    const group = getTimelineGroup(notification.timestamp);
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(notification);
    return acc;
  }, {} as Record<string, SeekerNotification[]>);

  const timelineOrder = ["Today", "Yesterday", "This Week", "Earlier"];
  const orderedGroups = timelineOrder.filter((group) => groupedNotifications[group]);
  const eventTypes = getUniqueEventTypes();

  // 🚀 Clean Loading State
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[400px] flex flex-col">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
          <p className="text-sm text-gray-500 mt-1">
            Loading your latest updates...
          </p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-12">
          <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
          <p className="text-gray-500 font-medium text-sm animate-pulse">Syncing timeline...</p>
        </div>
      </div>
    );
  }

  // 🚀 Clean Empty State
  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[400px]">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200 mt-6">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
            <BellOff className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            No recent activity
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Updates will appear here when solvers interact with your problems, submit proposals, or complete tasks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Activity className="w-6 h-6 text-accent" />
            Recent Activity
          </h2>
          <p className="text-sm text-gray-500">
            Updates when solvers claim your problems or statuses change.
          </p>
        </div>
        <Select
          value={eventTypeFilter}
          onValueChange={(value) => {
            setEventTypeFilter(value);
            setCurrentPage(0);
          }}
        >
          <SelectTrigger className="w-full md:w-[220px] px-4 py-2.5 bg-white rounded-lg border border-gray-300 text-sm shadow-sm">
            <SelectValue placeholder="Filter by event..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {eventTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredNotifications.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-sm text-gray-500 font-medium">No activities match the selected filter.</p>
          <button 
            onClick={() => setEventTypeFilter("all")}
            className="mt-3 text-accent text-sm hover:underline font-medium"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Timeline Content */}
      {orderedGroups.length > 0 && (
        <>
          <div className="space-y-8">
            {orderedGroups.map((group) => (
              <div key={group} className="relative">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-100"></div>
                  <span>{group}</span>
                  <div className="h-px flex-1 bg-gray-100"></div>
                </h3>
                <div className="space-y-3">
                  {groupedNotifications[group].map((n) => (
                    <Link
                      key={n.id}
                      href={`/seeker/problem/${n.problemId}`}
                      className="group block p-4 bg-white rounded-xl border border-gray-100 hover:border-accent/40 hover:shadow-md hover:bg-accent/5 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 group-hover:text-accent transition-colors truncate">
                            {n.problemTitle}
                          </p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {n.message}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-3">
                            <span className="text-xs font-medium text-gray-700">
                              {n.actorName}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 bg-secondary/10 text-secondary border border-secondary/20 rounded-md uppercase tracking-wide">
                              {n.eventType.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                            <Clock className="w-3.5 h-3.5" />
                            {formatNotificationTime(n.timestamp)}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-accent transition-colors mt-2" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 🚀 Refactored Pagination using UI Components */}
          {totalPages > 1 && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 0) setCurrentPage(currentPage - 1);
                      }}
                      className={currentPage === 0 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i).map((page) => {
                    if (
                      page === 0 ||
                      page === totalPages - 1 ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
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
                        if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
                      }}
                      className={currentPage === totalPages - 1 ? "pointer-events-none opacity-50" : ""}
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