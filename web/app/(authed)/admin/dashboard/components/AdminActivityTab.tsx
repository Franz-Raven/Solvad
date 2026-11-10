"use client";

import { useState } from "react";
import { BellOff, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdminActivity } from "@/types/admin";
import { getAdminActivity } from "../api/dashboard";
import { useAdminPage } from "../hooks/use-admin-page";
import { formatDateTime, getEventBadge, getRoleBadge, getTimelineGroup, humanizeEnum, TIMELINE_GROUPS } from "../utils/format";
import { AdminPagination } from "./AdminPagination";
import { PanelEmptyState, PanelError } from "./AdminPanelStates";

const PAGE_SIZE = 8;

const EVENT_TYPES = [
  "PROBLEM_CREATED",
  "PROBLEM_UPDATED",
  "STATUS_CHANGED",
  "PROPOSAL_SUBMITTED",
  "PROPOSAL_APPROVED",
  "PROPOSAL_REJECTED",
  "ATTEMPT_CLAIMED",
  "ATTEMPT_FORKED",
  "SUBTASK_SUBMITTED",
  "ATTEMPT_COMPLETED",
  "ATTEMPT_ABANDONED",
  "FILE_UPLOADED",
  "CAPACITY_REACHED",
];

function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-5 bg-white rounded-xl border border-slate-100 shadow-sm animate-pulse">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2.5">
              <div className="h-4 bg-slate-200 rounded-md w-1/3" />
              <div className="h-3 bg-slate-100 rounded-md w-3/4" />
              <div className="flex gap-3 mt-3">
                <div className="h-5 bg-slate-200 rounded-md w-24" />
                <div className="h-5 bg-slate-200 rounded-md w-32" />
              </div>
            </div>
            <div className="h-3 bg-slate-200 rounded-md w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminActivityTab() {
  const [eventType, setEventType] = useState("all");
  const [page, setPage] = useState(0);

  const { data, isLoading, error, retry } = useAdminPage(
    () => getAdminActivity(eventType, page, PAGE_SIZE),
    [eventType, page]
  );

  const handleFilterChange = (value: string) => {
    setEventType(value);
    setPage(0);
  };

  const items = data?.content ?? [];
  const grouped = items.reduce<Record<string, AdminActivity[]>>((acc, item) => {
    const group = getTimelineGroup(item.timestamp);
    (acc[group] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p className="text-sm text-slate-500 font-medium">
          Everything happening across problems on the platform, newest first.
        </p>
        <Select value={eventType} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-full md:w-[240px] px-4 py-2.5 bg-white rounded-lg border border-slate-200 text-sm shadow-sm font-medium cursor-pointer transition-colors hover:border-slate-300 focus:ring-2 focus:ring-accent/20">
            <SelectValue placeholder="Filter by event..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer font-medium">All Events</SelectItem>
            {EVENT_TYPES.map((type) => (
              <SelectItem key={type} value={type} className="cursor-pointer font-medium">
                {humanizeEnum(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <PanelError message={error} onRetry={retry} />
      ) : isLoading ? (
        <ActivitySkeleton />
      ) : items.length === 0 ? (
        <PanelEmptyState
          icon={<BellOff className="w-8 h-8" />}
          title="No activity yet"
          message={
            eventType !== "all"
              ? "No events match the selected filter."
              : "Activity appears here as seekers post problems and solvers start working on them."
          }
          action={
            eventType !== "all" && (
              <button onClick={() => handleFilterChange("all")} className="text-accent text-sm hover:underline font-bold cursor-pointer">
                Clear filter
              </button>
            )
          }
        />
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          {TIMELINE_GROUPS.filter((group) => grouped[group]).map((group) => (
            <div key={group}>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-100" />
                <span>{group}</span>
                <div className="h-px flex-1 bg-slate-100" />
              </h3>
              <div className="space-y-3">
                {grouped[group].map((item) => (
                  <div key={item.id} className="p-5 bg-white rounded-xl border border-slate-200 hover:border-accent/40 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-slate-900 truncate">{item.problemTitle}</p>
                        {item.delta && <p className="text-sm text-slate-600 mt-1 line-clamp-2 font-medium">{item.delta}</p>}
                        <div className="flex flex-wrap items-center gap-2.5 mt-3">
                          <span className="text-xs font-semibold text-slate-700">{item.actorName}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getRoleBadge(item.actorRole)}`}>
                            {item.actorRole}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border uppercase tracking-wider ${getEventBadge(item.eventType)}`}>
                            {humanizeEnum(item.eventType)}
                          </span>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 shrink-0 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDateTime(item.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!error && !isLoading && data && (
        <AdminPagination
          currentPage={page}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
