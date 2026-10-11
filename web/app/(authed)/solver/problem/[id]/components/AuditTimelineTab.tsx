"use client";

import { useState, useEffect } from "react";
import { 
  History, ListX, ChevronDown, FilePlus, RefreshCw, 
  CheckCircle2, GitBranch, Upload, Save, XCircle, 
  CheckCircle, Paperclip, Send, ThumbsUp, ThumbsDown, 
  ShieldAlert, Edit3 
} from "lucide-react";
import { getAuditLog } from "../api/problem";
import type { AuditLogEntry, AuditEventType } from "@/types/attempt";

// ─── Refined Solvad Color Scheme ──────────────────────────────────────────────
const AUDIT_EVENT_CONFIG: Record<
  AuditEventType,
  { label: string; icon: React.ReactNode; color: string; iconColor: string }
> = {
  PROBLEM_CREATED: {
    label: "Problem Created",
    icon: <FilePlus className="w-4 h-4" />,
    color: "bg-slate-50 text-slate-600 border-slate-200",
    iconColor: "text-slate-500",
  },
  STATUS_CHANGED: {
    label: "Status Changed",
    icon: <RefreshCw className="w-4 h-4" />,
    color: "bg-slate-50 text-slate-600 border-slate-200",
    iconColor: "text-slate-500",
  },
  ATTEMPT_CLAIMED: {
    label: "Problem Claimed",
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: "bg-accent/10 text-accent border-accent/20",
    iconColor: "text-accent",
  },
  ATTEMPT_FORKED: {
    label: "Attempt Forked",
    icon: <GitBranch className="w-4 h-4" />,
    color: "bg-slate-50 text-slate-600 border-slate-200",
    iconColor: "text-slate-500",
  },
  SUBTASK_SUBMITTED: {
    label: "Subtask Submitted",
    icon: <Upload className="w-4 h-4" />,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    iconColor: "text-emerald-600",
  },
  SUBTASK_DRAFT_SAVED: {
    label: "Draft Saved",
    icon: <Save className="w-4 h-4" />,
    color: "bg-slate-50 text-slate-600 border-slate-200",
    iconColor: "text-slate-400",
  },
  ATTEMPT_ABANDONED: {
    label: "Attempt Abandoned",
    icon: <XCircle className="w-4 h-4" />,
    color: "bg-rose-50 text-rose-700 border-rose-200",
    iconColor: "text-rose-500",
  },
  ATTEMPT_COMPLETED: {
    label: "Attempt Completed",
    icon: <CheckCircle className="w-4 h-4" />,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    iconColor: "text-emerald-600",
  },
  FILE_UPLOADED: {
    label: "File Uploaded",
    icon: <Paperclip className="w-4 h-4" />,
    color: "bg-slate-50 text-slate-600 border-slate-200",
    iconColor: "text-slate-500",
  },
  PROPOSAL_SUBMITTED: {
    label: "Proposal Submitted",
    icon: <Send className="w-4 h-4" />,
    color: "bg-accent/10 text-accent border-accent/20",
    iconColor: "text-accent",
  },
  PROPOSAL_APPROVED: {
    label: "Proposal Approved",
    icon: <ThumbsUp className="w-4 h-4" />,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    iconColor: "text-emerald-600",
  },
  PROPOSAL_REJECTED: {
    label: "Proposal Rejected",
    icon: <ThumbsDown className="w-4 h-4" />,
    color: "bg-rose-50 text-rose-700 border-rose-200",
    iconColor: "text-rose-500",
  },
  CAPACITY_REACHED: {
    label: "Capacity Reached",
    icon: <ShieldAlert className="w-4 h-4" />,
    color: "bg-slate-50 text-slate-600 border-slate-200",
    iconColor: "text-slate-500",
  },
  PROBLEM_UPDATED: {
    label: "Problem Updated",
    icon: <Edit3 className="w-4 h-4" />,
    color: "bg-slate-50 text-slate-600 border-slate-200",
    iconColor: "text-slate-500",
  },
};

type SortOrder = "newest-first" | "oldest-first";
type RoleFilter = "ALL" | "SEEKER" | "SOLVER" | "SYSTEM";

function getTodayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

// ─── LAZY LOADED DAY GROUP ──────────────────────────────────────────────────
function DayGroup({
  dateLabel,
  count,
  defaultOpen,
  sortOrder,
  fetchEntries,
}: {
  dateLabel: string;
  count: number;
  defaultOpen: boolean;
  sortOrder: SortOrder;
  fetchEntries: () => Promise<AuditLogEntry[]>;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(defaultOpen);
  const [entries, setEntries] = useState<AuditLogEntry[] | null>(null);
  
  const isToday = dateLabel === getTodayLabel();

  // If defaultOpen is true (Today's date), trigger fetch immediately on mount
  useEffect(() => {
    if (defaultOpen && !entries) {
      setLoading(true);
      fetchEntries().then((data) => {
        setEntries(data);
        setLoading(false);
      });
    }
  }, [defaultOpen, entries, fetchEntries]);

  const handleToggle = async () => {
    // Only fetch if it hasn't been fetched yet
    if (!open && !entries) {
      setLoading(true);
      setOpen(true);
      try {
        const data = await fetchEntries();
        setEntries(data);
      } catch (err) {
        console.error("Failed to load entries for date", err);
      } finally {
        setLoading(false);
      }
    } else {
      setOpen(!open);
    }
  };

  const sortedEntries = entries
    ? sortOrder === "newest-first"
      ? [...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      : [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : [];

  return (
    <div className="overflow-visible relative z-10">
      <button
        onClick={handleToggle}
        className="relative flex items-center gap-4 mb-4 mt-8 first:mt-0 w-full text-left group overflow-visible cursor-pointer z-10"
      >
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-white border border-slate-200 shadow-sm group-hover:shadow-md transition-all">
          <div className={`w-2.5 h-2.5 rounded-full transition-colors ${isToday ? "bg-accent" : "bg-slate-300"}`} />
        </div>

        <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-md border transition-colors ${
          isToday
            ? "bg-accent/10 text-accent border-accent/20"
            : "bg-slate-50 text-slate-500 border-slate-200"
        }`}>
          {isToday ? `Today — ${dateLabel}` : dateLabel}
        </span>

        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md uppercase tracking-wider hidden sm:block">
          {count} event{count !== 1 ? "s" : ""}
        </span>

        <span className="ml-auto mr-1 text-slate-400 group-hover:text-accent transition-colors">
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="space-y-4 ml-0 overflow-visible mt-4">
          {loading ? (
            /* 🚀 Structural Entry Skeleton Loader */
            <div className="space-y-4 relative z-10">
              {[1, 2].map((i) => (
                <div key={i} className="relative flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex-shrink-0 bg-slate-50 border border-slate-100 animate-pulse" />
                  <div className="flex-1 bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-32 h-5 bg-slate-100 rounded-md animate-pulse" />
                      <div className="w-16 h-3 bg-slate-50 rounded-md animate-pulse" />
                    </div>
                    <div className="w-1/4 h-4 bg-slate-100 rounded-md animate-pulse mb-2" />
                    <div className="w-full h-3 bg-slate-50 rounded-md animate-pulse mb-1" />
                    <div className="w-2/3 h-3 bg-slate-50 rounded-md animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            sortedEntries.map((entry) => {
              const config = AUDIT_EVENT_CONFIG[entry.eventType] ?? {
                label: entry.eventType,
                icon: null,
                color: "bg-slate-50 text-slate-600 border-slate-200",
                iconColor: "text-slate-400",
              };
              const time = new Date(entry.timestamp).toLocaleTimeString("en-US", {
                hour: "numeric", minute: "2-digit", hour12: true,
              });

              return (
                <div key={entry.id} className="relative flex items-start gap-4 z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-white border border-slate-200 shadow-sm ${config.iconColor}`}
                  >
                    {config.icon}
                  </div>

                  {/* 🚀 Removed hover transition classes to prevent box jumping/glitching */}
                  <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${config.color}`}>
                          {config.label}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                          entry.actorRole === "SYSTEM"
                            ? "bg-slate-100 text-slate-500 border-slate-200"
                            : entry.actorRole === "SEEKER"
                            ? "bg-accent/10 text-accent border-accent/20"
                            : "bg-purple-50 text-purple-600 border-purple-200"
                        }`}>
                          {entry.actorRole}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 flex-shrink-0">{time}</span>
                    </div>

                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {entry.actorRole === "SYSTEM"
                        ? <span className="text-slate-400 font-medium italic">System automation</span>
                        : entry.actorName
                      }
                    </p>

                    <p className="text-sm text-slate-600 mt-1.5 font-medium leading-relaxed break-words">
                      {entry.delta}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

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
      <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-6 md:p-8 animate-pulse">
        <div className="w-48 h-8 bg-slate-200 rounded-lg mb-8" />
        <div className="h-16 bg-slate-50 border border-slate-100 rounded-xl mb-12" />
        <div className="space-y-6 pl-12 border-l-2 border-slate-100 ml-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white border border-slate-100 rounded-2xl shadow-sm relative">
              <div className="absolute -left-16 top-4 w-8 h-8 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-12 text-center animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <ListX className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No activity yet</h3>
        <p className="text-slate-500 font-medium text-sm">Events will appear here as the problem progresses.</p>
      </div>
    );
  }

  // Filter logs for the summary generator
  const filtered = filterRole === "ALL" ? logs : logs.filter((l) => l.actorRole === filterRole);

  const groupMap = new Map<string, AuditLogEntry[]>();
  filtered.forEach((entry) => {
    const dateLabel = new Date(entry.timestamp).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });
    if (!groupMap.has(dateLabel)) groupMap.set(dateLabel, []);
    groupMap.get(dateLabel)!.push(entry);
  });

  const groups = Array.from(groupMap.entries()).map(([dateLabel, entries]) => ({
    dateLabel,
    entries,
    latestTs: Math.max(...entries.map((e) => new Date(e.timestamp).getTime())),
  }));

  const sortedGroups = sortOrder === "newest-first"
    ? groups.sort((a, b) => b.latestTs - a.latestTs)
    : groups.sort((a, b) => a.latestTs - b.latestTs);

  const todayLabel = getTodayLabel();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-6 md:p-8 relative z-20">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2.5 bg-slate-50 rounded-xl text-slate-500 border border-slate-200">
                <History className="w-5 h-5" />
              </div>
              Activity Ledger
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-3">
              Immutable, chronological record of every event on this problem.
            </p>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 bg-accent/10 text-accent uppercase tracking-wider rounded-md border border-accent/20 h-fit mt-2">
            {logs.length} event{logs.length !== 1 ? "s" : ""} logged
          </span>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center gap-6 mt-8 flex-wrap border-t border-slate-100 pt-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full xl:w-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actor:</span>
            <div className="flex space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-100 w-fit overflow-x-auto">
              {(["ALL", "SEEKER", "SOLVER", "SYSTEM"] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                    filterRole === role
                      ? "bg-white text-accent shadow-sm border-slate-200"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border-transparent"
                  }`}
                >
                  {role}
                  {role !== "ALL" && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] leading-none ${filterRole === role ? "bg-accent/10 text-accent" : "bg-slate-200/60 text-slate-500"}`}>
                      {logs.filter((l) => l.actorRole === role).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden xl:block w-px h-6 bg-slate-200" />

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full xl:w-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Order:</span>
            <div className="flex space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-100 w-fit overflow-x-auto">
              {(
                [
                  { value: "newest-first", label: "Newest first" },
                  { value: "oldest-first", label: "Oldest first" },
                ] as { value: SortOrder; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortOrder(opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer border ${
                    sortOrder === opt.value
                      ? "bg-white text-accent shadow-sm border-slate-200"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border-transparent"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative overflow-visible px-4 md:px-8">
        <div className="absolute left-[35px] md:left-[51px] top-4 bottom-4 w-0.5 bg-slate-200 z-0 pointer-events-none" />

        <div className="space-y-4 overflow-visible relative z-10">
          {sortedGroups.map((group) => (
            <DayGroup
              // Keying with filterRole ensures the DayGroup unmounts and remounts when filters change
              key={`${group.dateLabel}-${filterRole}`}
              dateLabel={group.dateLabel}
              count={group.entries.length}
              sortOrder={sortOrder}
              defaultOpen={group.dateLabel === todayLabel}
              // 🚀 Swap this Promise out for an actual API endpoint fetch later!
              fetchEntries={() => 
                new Promise<AuditLogEntry[]>((resolve) => {
                  setTimeout(() => resolve(group.entries), 400); // Simulated network delay
                })
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}