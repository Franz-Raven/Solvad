"use client";

import { useState, useEffect } from "react";
import {
  History, ListX, ChevronDown, FilePlus, RefreshCw,
  CheckCircle2, GitBranch, Upload, Save, XCircle,
  CheckCircle, Paperclip, Send, ThumbsUp, ThumbsDown,
  ShieldAlert, Edit3, Loader2, AlertCircle, Activity
} from "lucide-react";
import { getAuditSummaries, getAuditLogsByDate } from "../api/problem";

import type { AuditDateSummary, AuditLog } from "@/types/audit";
import type { AuditEventType } from "@/types/attempt";

// ─── Event styling ──
const AUDIT_EVENT_CONFIG: Record<
  AuditEventType,
  { label: string; icon: React.ReactNode; color: string; iconColor: string }
> = {
  PROBLEM_CREATED: { label: "Problem Created", icon: <FilePlus className="w-4 h-4" />, color: "bg-slate-50 text-slate-600 border-slate-200", iconColor: "text-slate-500" },
  STATUS_CHANGED: { label: "Status Changed", icon: <RefreshCw className="w-4 h-4" />, color: "bg-slate-50 text-slate-600 border-slate-200", iconColor: "text-slate-500" },
  ATTEMPT_CLAIMED: { label: "Problem Claimed", icon: <CheckCircle2 className="w-4 h-4" />, color: "bg-emerald-50 text-emerald-700 border-emerald-200", iconColor: "text-emerald-600" },
  ATTEMPT_FORKED: { label: "Attempt Forked", icon: <GitBranch className="w-4 h-4" />, color: "bg-slate-50 text-slate-600 border-slate-200", iconColor: "text-slate-500" },
  SUBTASK_SUBMITTED: { label: "Subtask Submitted", icon: <Upload className="w-4 h-4" />, color: "bg-emerald-50 text-emerald-700 border-emerald-200", iconColor: "text-emerald-600" },
  SUBTASK_DRAFT_SAVED: { label: "Draft Saved", icon: <Save className="w-4 h-4" />, color: "bg-slate-50 text-slate-600 border-slate-200", iconColor: "text-slate-400" },
  ATTEMPT_ABANDONED: { label: "Attempt Abandoned", icon: <XCircle className="w-4 h-4" />, color: "bg-rose-50 text-rose-700 border-rose-200", iconColor: "text-rose-500" },
  ATTEMPT_COMPLETED: { label: "Attempt Completed", icon: <CheckCircle className="w-4 h-4" />, color: "bg-emerald-50 text-emerald-700 border-emerald-200", iconColor: "text-emerald-600" },
  FILE_UPLOADED: { label: "File Uploaded", icon: <Paperclip className="w-4 h-4" />, color: "bg-slate-50 text-slate-600 border-slate-200", iconColor: "text-slate-500" },
  PROPOSAL_SUBMITTED: { label: "Proposal Submitted", icon: <Send className="w-4 h-4" />, color: "bg-emerald-50 text-emerald-700 border-emerald-200", iconColor: "text-emerald-600" },
  PROPOSAL_APPROVED: { label: "Proposal Approved", icon: <ThumbsUp className="w-4 h-4" />, color: "bg-emerald-50 text-emerald-700 border-emerald-200", iconColor: "text-emerald-600" },
  PROPOSAL_REJECTED: { label: "Proposal Rejected", icon: <ThumbsDown className="w-4 h-4" />, color: "bg-rose-50 text-rose-700 border-rose-200", iconColor: "text-rose-500" },
  CAPACITY_REACHED: { label: "Capacity Reached", icon: <ShieldAlert className="w-4 h-4" />, color: "bg-slate-50 text-slate-600 border-slate-200", iconColor: "text-slate-500" },
  PROBLEM_UPDATED: { label: "Problem Updated", icon: <Edit3 className="w-4 h-4" />, color: "bg-slate-50 text-slate-600 border-slate-200", iconColor: "text-slate-500" },
};

type SortOrder = "newest-first" | "oldest-first";
type RoleFilter = "ALL" | "SEEKER" | "SOLVER" | "SYSTEM";
const CARD = "bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-6 md:p-8";

function getTodayLabel(): string {
  return new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// ─── Lazy-loaded day group ──
function DayGroup({
  summary,
  defaultOpen,
  sortOrder,
  filterRole,
  problemId,
}: {
  summary: AuditDateSummary;
  defaultOpen: boolean;
  sortOrder: SortOrder;
  filterRole: RoleFilter;
  problemId: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(defaultOpen);
  const [failed, setFailed] = useState(false);
  const [entries, setEntries] = useState<AuditLog[] | null>(null);

  const normalizedLabel = new Date(summary.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const isToday = normalizedLabel === getTodayLabel();

  const loadEntries = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const logs = await getAuditLogsByDate(problemId, summary.date);
      setEntries(logs);
    } catch (err) {
      console.error("Failed to load entries for date", err);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (defaultOpen) loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = () => {
    if (!open && !entries) {
      setOpen(true);
      loadEntries();
    } else {
      setOpen(!open);
    }
  };

  let filteredEntries = entries ? [...entries] : [];
  if (filterRole !== "ALL") {
    filteredEntries = filteredEntries.filter((e) => e.actorRole === filterRole);
  }

  const sortedEntries = filteredEntries.sort((a, b) => {
    const diff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    return sortOrder === "newest-first" ? -diff : diff;
  });

  if (entries && filteredEntries.length === 0) return null;

  return (
    <div className="overflow-visible relative z-10">
      <button
        onClick={handleToggle}
        className="relative flex items-center gap-4 mb-4 mt-8 first:mt-0 w-full text-left group overflow-visible cursor-pointer z-10 outline-none"
      >
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-white border border-slate-200 shadow-sm transition-colors relative">
          <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
            open
              ? "bg-accent shadow-[0_0_12px_rgba(var(--accent),0.8)]" 
              : isToday ? "bg-accent/80" : "bg-slate-300"
          }`} />
        </div>

        <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-md border transition-colors duration-300 ${
          open 
            ? "bg-accent/10 text-accent border-accent/20" 
            : isToday
            ? "bg-accent/5 text-accent/80 border-accent/10"
            : "bg-slate-50 text-slate-500 border-slate-200 group-hover:bg-slate-100"
        }`}>
          {isToday ? `Today — ${normalizedLabel}` : normalizedLabel}
        </span>

        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md uppercase tracking-wider hidden sm:block">
          {summary.eventCount} event{summary.eventCount !== 1 ? "s" : ""}
        </span>

        <span className="ml-auto mr-1 text-slate-400 transition-colors">
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${open ? "rotate-180 text-accent" : "group-hover:text-slate-600"}`} />
        </span>
      </button>

      {open && (
        <div className="mt-6 mb-8 animate-in fade-in duration-300">
          {loading ? (
            <div className="space-y-4 relative z-10">
              {Array.from({ length: Math.min(Math.max(summary.eventCount, 1), 3) }).map((_, i) => (
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
          ) : failed ? (
            <div className="relative z-10 flex items-center justify-between gap-4 bg-rose-50 border border-rose-100 shadow-sm rounded-2xl p-5">
              <div className="flex items-center gap-3 text-rose-700 text-sm font-bold">
                <AlertCircle className="w-5 h-5" /> Couldn't load events.
              </div>
              <button onClick={loadEntries} className="text-sm font-bold text-rose-700 hover:underline cursor-pointer flex-shrink-0">
                Try again
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedEntries.map((log) => {
                const eventTypeKey = log.eventType as AuditEventType;
                const config = AUDIT_EVENT_CONFIG[eventTypeKey] ?? {
                  label: log.eventType.replace(/_/g, ' '),
                  icon: <Activity className="w-4 h-4" />,
                  color: "bg-slate-50 text-slate-600 border-slate-200",
                  iconColor: "text-slate-400",
                };
                const time = new Date(log.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

                return (
                  <div key={log.id} className="relative flex items-start gap-4 z-10 group/log animate-in fade-in duration-300">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-white border border-slate-200 shadow-sm transition-colors group-hover/log:border-accent/30 group-hover/log:text-accent ${config.iconColor}`}>
                      {config.icon}
                    </div>

                    <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-colors transition-shadow duration-300 p-5 min-w-0 group-hover/log:border-slate-300">
                      <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${config.color}`}>
                            {config.label}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                            log.actorRole === "SYSTEM" ? "bg-slate-100 text-slate-500 border-slate-200" : 
                            log.actorRole === "SEEKER" ? "bg-accent/10 text-accent border-accent/20" : 
                            "bg-purple-50 text-purple-600 border-purple-200"
                          }`}>
                            {log.actorRole}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 flex-shrink-0">{time}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {log.actorRole === "SYSTEM" ? <span className="text-slate-400 font-medium italic">System automation</span> : log.actorName}
                      </p>
                      <p className="text-sm text-slate-600 mt-1.5 font-medium leading-relaxed break-words">
                        {log.delta}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Tab Component ──
export function AuditTimelineTab({ problemId }: { problemId: string }) {
  const [summaries, setSummaries] = useState<AuditDateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  
  const [filterRole, setFilterRole] = useState<RoleFilter>("ALL");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest-first");

  const loadSummaries = () => {
    setLoading(true);
    setLoadError(false);
    getAuditSummaries(problemId)
      .then(setSummaries)
      .catch((err: unknown) => {
        console.error("Failed to load audit summaries", err);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSummaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemId]);

  if (loading) {
    return (
      <div className={`${CARD} animate-pulse animate-in fade-in duration-500`}>
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

  if (loadError) {
    return (
      <div className={`${CARD} p-12 text-center animate-in fade-in duration-500`}>
        <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <History className="w-8 h-8 text-rose-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Couldn't load the activity ledger</h3>
        <p className="text-slate-500 font-medium text-sm mb-6">Something went wrong while fetching the audit log summaries.</p>
        <button onClick={loadSummaries} className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-colors shadow-md cursor-pointer">
          Try Again
        </button>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className={`${CARD} p-12 text-center animate-in fade-in duration-500`}>
        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <ListX className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No activity yet</h3>
        <p className="text-slate-500 font-medium text-sm">Events will appear here as the problem progresses.</p>
      </div>
    );
  }

  const sortedSummaries = sortOrder === "newest-first" 
    ? [...summaries]
    : [...summaries].reverse();

  const totalEvents = summaries.reduce((acc, sum) => acc + sum.eventCount, 0);
  const todayLabel = getTodayLabel();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header and Controls */}
      <div className={`${CARD} relative z-20`}>
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
            {totalEvents} event{totalEvents !== 1 ? "s" : ""} logged
          </span>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center gap-6 mt-8 flex-wrap border-t border-slate-100 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full xl:w-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actor:</span>
            <div className="flex space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-100 w-fit max-w-full overflow-x-auto no-scrollbar">
              {(["ALL", "SEEKER", "SOLVER", "SYSTEM"] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer flex items-center gap-2 border ${
                    filterRole === role
                      ? "bg-white text-accent shadow-sm border-slate-200"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border-transparent"
                  }`}
                >
                  {role}
                  {role !== "ALL" && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] leading-none ${
                        filterRole === role ? "bg-accent/10 text-accent" : "bg-slate-200/60 text-slate-500"
                      }`}
                    >
                      {/* Note: This count only applies to loaded entries now, or you can drop it to keep UI simple */}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden xl:block w-px h-6 bg-slate-200" />

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full xl:w-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Order:</span>
            <div className="flex space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-100 w-fit max-w-full overflow-x-auto no-scrollbar">
              {(
                [
                  { value: "newest-first", label: "Newest first" },
                  { value: "oldest-first", label: "Oldest first" },
                ] as { value: SortOrder; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortOrder(opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer border whitespace-nowrap ${
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

      {/* Lazy Loaded Timeline */}
      <div className="relative overflow-visible px-4 md:px-8">
        <div className="absolute left-[35px] md:left-[51px] top-4 bottom-4 w-0.5 bg-slate-200 z-0 pointer-events-none" />

        <div className="space-y-4 overflow-visible relative z-10">
          {sortedSummaries.map((summary) => (
            <DayGroup
              key={`${summary.date}-${filterRole}`} 
              summary={summary}
              problemId={problemId}
              sortOrder={sortOrder}
              filterRole={filterRole}
              defaultOpen={
                new Date(summary.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) === todayLabel
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}