"use client";

import { useState, useEffect } from "react";
import { getAuditLog } from "@/lib/api/attempts";
import type { AuditLogEntry, AuditEventType } from "@/types/attempt";

// ─── Audit event config ───────────────────────────────────────────────────────
const AUDIT_EVENT_CONFIG: Record<
  AuditEventType,
  { label: string; icon: React.ReactNode; color: string; dotColor: string }
> = {
  PROBLEM_CREATED: {
    label: "Problem Created",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: "bg-accent/10 text-accent border-accent/20",
    dotColor: "bg-accent",
  },
  STATUS_CHANGED: {
    label: "Status Changed",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    dotColor: "bg-yellow-400",
  },
  ATTEMPT_CLAIMED: {
    label: "Problem Claimed",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    color: "bg-purple-50 text-purple-700 border-purple-200",
    dotColor: "bg-purple-500",
  },
  ATTEMPT_FORKED: {
    label: "Attempt Forked",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 7v8a2 2 0 002 2h6M8 7l-2 2m2-2l2 2m4 4v-4a2 2 0 00-2-2h-6" />
      </svg>
    ),
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dotColor: "bg-blue-500",
  },
  SUBTASK_SUBMITTED: {
    label: "Subtask Submitted",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    color: "bg-green-50 text-green-700 border-green-200",
    dotColor: "bg-green-500",
  },
  SUBTASK_DRAFT_SAVED: {
    label: "Draft Saved",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
      </svg>
    ),
    color: "bg-gray-50 text-gray-600 border-gray-200",
    dotColor: "bg-gray-400",
  },
  ATTEMPT_ABANDONED: {
    label: "Attempt Abandoned",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    color: "bg-red-50 text-red-700 border-red-200",
    dotColor: "bg-red-400",
  },
  ATTEMPT_COMPLETED: {
    label: "Attempt Completed",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "bg-green-50 text-green-700 border-green-200",
    dotColor: "bg-green-600",
  },
  FILE_UPLOADED: {
    label: "File Uploaded",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
    ),
    color: "bg-orange-50 text-orange-700 border-orange-200",
    dotColor: "bg-orange-400",
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────
type SortOrder = "newest-first" | "oldest-first";
type RoleFilter = "ALL" | "SEEKER" | "SOLVER" | "SYSTEM";

// ─── Helper: get today's date label ──────────────────────────────────────────
function getTodayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

// ─── Collapsible day group ────────────────────────────────────────────────────
function DayGroup({
  dateLabel,
  entries,
  defaultOpen,
  sortOrder,
}: {
  dateLabel: string;
  entries: AuditLogEntry[];
  defaultOpen: boolean;
  sortOrder: SortOrder;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isToday = dateLabel === getTodayLabel();

  const sortedEntries = sortOrder === "newest-first"
    ? [...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    : [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="overflow-visible">
      {/* ── Day header (clickable) ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center gap-3 mb-2 mt-6 first:mt-0 w-full text-left group overflow-visible"
      >
        {/* Node on the spine */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0  relative z-0 ring-2 ring-white ring-offset-0 shadow-md bg-white group-hover:shadow-lg transition-all">
          <div className={`w-2.5 h-2.5 rounded-full transition-colors ${isToday ? "bg-accent" : "bg-gray-300"}`} />
        </div>

        <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border transition-colors ${
          isToday
            ? "bg-accent/10 text-accent border-accent/20"
            : "bg-gray-50 text-gray-500 border-gray-200"
        }`}>
          {isToday ? `Today — ${dateLabel}` : dateLabel}
        </span>

        {/* Entry count badge */}
        <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
          {entries.length} event{entries.length !== 1 ? "s" : ""}
        </span>

        {/* Chevron */}
        <span className="ml-auto mr-1 text-gray-400 group-hover:text-gray-600 transition-colors">
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* ── Entries ── */}
      {open && (
        <div className="space-y-3 ml-0 overflow-visible">
          {sortedEntries.map((entry) => {
            const config = AUDIT_EVENT_CONFIG[entry.eventType] ?? {
              label: entry.eventType,
              icon: null,
              color: "bg-gray-50 text-gray-600 border-gray-200",
              dotColor: "bg-gray-400",
            };
            const time = new Date(entry.timestamp).toLocaleTimeString("en-US", {
              hour: "numeric", minute: "2-digit", hour12: true,
            });

            return (
              <div key={entry.id} className="relative flex items-start gap-3">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    flex-shrink-0 relative z-0
                    ring-2 ring-white ring-offset-0
                    shadow-md
                    ${config.dotColor}
                  `}
                >
                  <span className="text-white">{config.icon}</span>
                </div>

                {/* Card */}
                <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${config.color}`}>
                        {config.label}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        entry.actorRole === "SYSTEM"
                          ? "bg-gray-100 text-gray-500 border-gray-200"
                          : entry.actorRole === "SEEKER"
                          ? "bg-accent/10 text-accent border-accent/20"
                          : "bg-purple-50 text-purple-600 border-purple-200"
                      }`}>
                        {entry.actorRole}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">{time}</span>
                  </div>

                  {/* Actor */}
                  <p className="text-xs font-semibold text-gray-700 mt-2">
                    {entry.actorRole === "SYSTEM"
                      ? <span className="text-gray-400 font-normal italic">System automation</span>
                      : entry.actorName
                    }
                  </p>

                  {/* Delta */}
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed break-words">
                    {entry.delta}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function AuditTimelineTab({ problemId }: { problemId: string }) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<RoleFilter>("ALL");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest-first");

  useEffect(() => {
    getAuditLog(problemId)
      .then(setLogs)
      .catch((err: unknown) => console.error("Failed to load audit log", err))
      .finally(() => setLoading(false));
  }, [problemId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No activity yet</h3>
        <p className="text-gray-500 text-sm">Events will appear here as the problem progresses.</p>
      </div>
    );
  }

  // ── Filter ──
  const filtered = filterRole === "ALL" ? logs : logs.filter((l) => l.actorRole === filterRole);

  // ── Group by date ──
  const groupMap = new Map<string, AuditLogEntry[]>();
  filtered.forEach((entry) => {
    const dateLabel = new Date(entry.timestamp).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });
    if (!groupMap.has(dateLabel)) groupMap.set(dateLabel, []);
    groupMap.get(dateLabel)!.push(entry);
  });

  // ── Sort date groups ──
  const groups = Array.from(groupMap.entries()).map(([dateLabel, entries]) => ({
    dateLabel,
    entries,
    // Use the latest timestamp in the group for sorting the group itself
    latestTs: Math.max(...entries.map((e) => new Date(e.timestamp).getTime())),
  }));

  const sortedGroups = sortOrder === "newest-first"
    ? groups.sort((a, b) => b.latestTs - a.latestTs)
    : groups.sort((a, b) => a.latestTs - b.latestTs);

  const todayLabel = getTodayLabel();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ── Header + stats ── */}
      {/* ── Header + stats ── */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Activity Ledger</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Immutable, chronological record of every event on this problem.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 bg-accent/10 text-accent rounded-full border border-accent/20">
            {logs.length} event{logs.length !== 1 ? "s" : ""} logged
          </span>
        </div>

        {/* ── Controls row ── */}
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          {/* Role filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 font-medium">Actor:</span>
            {(["ALL", "SEEKER", "SOLVER", "SYSTEM"] as const).map((role) => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  filterRole === role
                    ? "bg-accent text-white border-accent"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {role}
                {role !== "ALL" && (
                  <span className="ml-1.5 opacity-70">
                    {logs.filter((l) => l.actorRole === role).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-5 bg-gray-200" />

          {/* Sort order */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Order:</span>
            {(
              [
                { value: "newest-first", label: "Newest first" },
                { value: "oldest-first", label: "Oldest first" },
              ] as { value: SortOrder; label: string }[]
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortOrder(opt.value)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  sortOrder === opt.value
                    ? "bg-accent text-white border-accent"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className="relative overflow-visible">
        {/*
          FIX: The spine is now `pointer-events-none` so it never
          intercepts clicks on the day-header buttons.
          It's also `z-0` so icon dots (z-10) always render above it.
        */}
        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-200 z-0 pointer-events-none" />

        <div className="space-y-1 overflow-visible">
          {sortedGroups.map((group) => (
            <DayGroup
              key={group.dateLabel}
              dateLabel={group.dateLabel}
              entries={group.entries}
              sortOrder={sortOrder}
              // Today's group is open by default; all other days are collapsed
              defaultOpen={group.dateLabel === todayLabel}
            />
          ))}
        </div>
      </div>
    </div>
  );
}