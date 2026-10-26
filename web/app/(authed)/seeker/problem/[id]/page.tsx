"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronDown, Check, HelpCircle, AlertTriangle, Trash2, X } from "lucide-react";
import Portal from "@/components/portal";

import { getProblemById, updateProblemStatus, deleteProblem, getProblemActiveAttemptsCount } from "./api/problem";
import type { ProblemResponse } from "@/types/problem";

const SkeletonCard = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-6 md:p-8 animate-pulse">{children}</div>
);

const ProblemSkeleton = () => (
  <SkeletonCard>
    <div className="w-48 h-8 bg-slate-200 rounded-lg mb-8" />
    <div className="space-y-6">{[1, 2, 3].map((i) => <div key={i}><div className="w-32 h-4 bg-slate-200 rounded mb-3" /><div className="h-24 bg-slate-50 border border-slate-100 rounded-xl" /></div>)}</div>
  </SkeletonCard>
);

const ProposalsSkeleton = () => (
  <SkeletonCard>
    <div className="w-56 h-8 bg-slate-200 rounded-lg mb-8" />
    <div className="space-y-5">{[1, 2, 3].map((i) => <div key={i} className="flex items-start gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl"><div className="w-12 h-12 rounded-full bg-slate-200 flex-shrink-0" /><div className="flex-1 space-y-3"><div className="w-1/3 h-4 bg-slate-200 rounded-md" /><div className="w-full h-3 bg-slate-100 rounded-md" /><div className="w-2/3 h-3 bg-slate-100 rounded-md" /></div><div className="hidden md:block w-28 h-10 bg-slate-100 rounded-xl flex-shrink-0" /></div>)}</div>
  </SkeletonCard>
);

const WorkspaceSkeleton = () => (
  <SkeletonCard>
    <div className="w-56 h-8 bg-slate-200 rounded-lg mb-8" />
    <div className="h-20 bg-slate-50 border border-slate-100 rounded-xl mb-6" />
    <div className="h-64 bg-slate-50 border border-slate-100 rounded-2xl" />
  </SkeletonCard>
);

const TreeSkeletonShell = () => (
  <SkeletonCard>
    <div className="w-64 h-8 bg-slate-200 rounded-lg mb-8" />
    <div className="h-[480px] bg-slate-50 border border-slate-100 rounded-2xl" />
  </SkeletonCard>
);

const InsightsSkeleton = () => (
  <SkeletonCard>
    <div className="w-48 h-8 bg-slate-200 rounded-lg mb-8" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">{[1, 2, 3].map((i) => <div key={i} className="h-28 bg-slate-50 border border-slate-100 rounded-2xl" />)}</div>
    <div className="h-48 bg-slate-50 border border-slate-100 rounded-2xl" />
  </SkeletonCard>
);

const TimelineSkeleton = () => (
  <SkeletonCard>
    <div className="w-48 h-8 bg-slate-200 rounded-lg mb-8" />
    <div className="h-16 bg-slate-50 border border-slate-100 rounded-xl mb-12" />
    <div className="space-y-6 pl-12 border-l-2 border-slate-100 ml-4">{[1, 2, 3].map((i) => <div key={i} className="h-32 bg-white border border-slate-100 rounded-2xl shadow-sm relative"><div className="absolute -left-16 top-4 w-8 h-8 rounded-full bg-slate-200" /></div>)}</div>
  </SkeletonCard>
);

const SettingsSkeleton = () => (
  <SkeletonCard>
    <div className="w-40 h-8 bg-slate-200 rounded-lg mb-8" />
    <div className="space-y-8">{[1, 2].map((i) => <div key={i}><div className="w-32 h-4 bg-slate-200 rounded mb-3" /><div className="h-12 bg-slate-50 border border-slate-100 rounded-xl mb-3" /><div className="w-2/3 h-3 bg-slate-100 rounded-md" /></div>)}</div>
  </SkeletonCard>
);

const ProblemTab = dynamic(() => import("@/app/(authed)/seeker/problem/[id]/components/ProblemTab").then((mod) => mod.ProblemTab), { loading: () => <ProblemSkeleton /> });
const ProposalsTab = dynamic(() => import("@/app/(authed)/seeker/problem/[id]/components/ProposalsTab").then((mod) => mod.ProposalsTab), { loading: () => <ProposalsSkeleton /> });
const ReviewSolutionsTab = dynamic(() => import("@/app/(authed)/seeker/problem/[id]/components/ReviewSolutionsTab").then((mod) => mod.ReviewSolutionsTab), { loading: () => <ProposalsSkeleton /> });
const WorkspaceTab = dynamic(() => import("@/app/(authed)/seeker/problem/[id]/components/WorkspaceTab").then((mod) => mod.WorkspaceTab), { loading: () => <WorkspaceSkeleton /> });
const SolutionTreeTab = dynamic(() => import("@/app/(authed)/seeker/problem/[id]/components/SolutionTreeTab").then((mod) => mod.SolutionTreeTab), { loading: () => <TreeSkeletonShell /> });
const AIInsightsTab = dynamic(() => import("@/app/(authed)/seeker/problem/[id]/components/AIInsightsTab"), { loading: () => <InsightsSkeleton /> });
const AuditTimelineTab = dynamic(() => import("@/app/(authed)/seeker/problem/[id]/components/AuditTimelineTab").then((mod) => mod.AuditTimelineTab), { loading: () => <TimelineSkeleton /> });
const SettingsTab = dynamic(() => import("@/app/(authed)/seeker/problem/[id]/components/SettingsTab").then((mod) => mod.SettingsTab), { loading: () => <SettingsSkeleton /> });

// 🚀 FIXED: Removed "gap" since it is no longer a top-level tab
type TabType = "problem" | "proposals" | "workspace" | "review" | "insights" | "tree" | "history" | "settings";
type ModalMode = "confirm" | "terminate" | "delete" | null;

const VALID_TABS: TabType[] = ["problem", "proposals", "workspace", "review", "tree", "insights", "history", "settings"];

const isValidTab = (value: string | null): value is TabType => value !== null && (VALID_TABS as string[]).includes(value);

const getBadgeStyle = (status: string) => {
  switch (status) {
    case "OPEN": return "bg-accent/10 text-accent border-accent/20";
    case "SOLVED_OPEN_FOR_IMPROVEMENT":
    case "COMPLETED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "TERMINATED":
    case "CLOSED": return "bg-rose-50 text-rose-700 border-rose-200";
    default: return "bg-amber-50 text-amber-700 border-amber-200";
  }
};

const STATUS_DOT: Record<string, string> = { OPEN: "bg-accent", SOLVED_OPEN_FOR_IMPROVEMENT: "bg-emerald-500", COMPLETED: "bg-emerald-500", CLOSED: "bg-rose-500" };
const STATUS_LABELS: Record<string, string> = { OPEN: "Open", SOLVED_OPEN_FOR_IMPROVEMENT: "Solved – Open for Improvement", COMPLETED: "Completed", CLOSED: "Closed" };
const STATUS_DESCRIPTIONS: Record<string, string> = { OPEN: "The problem will be visible to solvers and open for new claims.", SOLVED_OPEN_FOR_IMPROVEMENT: "The problem will be marked as solved but remain visible so solvers can continue to improve upon it.", COMPLETED: "The problem will be marked as fully completed and hidden from the solver browse page.", CLOSED: "The problem will be hidden from all solvers. You can reopen it later." };
const STATUS_OPTIONS = ["OPEN", "SOLVED_OPEN_FOR_IMPROVEMENT", "COMPLETED", "CLOSED"] as const;

function ConfirmModal({ tone, icon, title, confirmLabel, busy, onConfirm, onCancel, children }: { tone: "accent" | "danger"; icon: React.ReactNode; title: string; confirmLabel: string; busy: boolean; onConfirm: () => void; onCancel: () => void; children: React.ReactNode; }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onCancel(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [busy, onCancel]);
  const iconWrap = tone === "danger" ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-accent/10 border-accent/20 text-accent";
  const confirmBtn = tone === "danger" ? "bg-rose-600 hover:bg-rose-700" : "bg-accent hover:bg-accent/90";
  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 p-6 md:p-8 animate-in zoom-in-95 duration-200">
          <div className={`w-14 h-14 rounded-full border shadow-sm flex items-center justify-center mx-auto mb-5 ${iconWrap}`}>{icon}</div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight text-center mb-4">{title}</h2>
          {children}
          <div className="flex gap-3 mt-8">
            <button onClick={onCancel} disabled={busy} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-sm font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50">Cancel</button>
            <button onClick={onConfirm} disabled={busy} className={`flex-1 px-4 py-2.5 text-white text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 ${confirmBtn}`}>
              {busy ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Working...</> : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

function ProblemDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const problemId = params.id as string;

  const [problem, setProblem] = useState<ProblemResponse | null>(null);
  const [activeAttemptsCount, setActiveAttemptsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabType>(isValidTab(tabParam) ? tabParam : "problem");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);

  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadProblem(); }, [problemId]);
  useEffect(() => { if (isValidTab(tabParam)) setActiveTab(tabParam); }, [tabParam]);

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    if (tabId !== "tree") setHighlightedNodeId(null);
    router.replace(`/seeker/problem/${problemId}?tab=${tabId}`, { scroll: false });
  };

  const locateInTree = (nodeId: string) => {
    setHighlightedNodeId(nodeId);
    setActiveTab("tree");
    router.replace(`/seeker/problem/${problemId}?tab=tree`, { scroll: false });
  };

  useEffect(() => {
    if (!showStatusDropdown) return;
    const onDown = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowStatusDropdown(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowStatusDropdown(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [showStatusDropdown]);

  const loadProblem = async () => {
    try {
      setLoading(true); setError(null);
      const [problemResult, countResult] = await Promise.allSettled([ getProblemById(problemId), getProblemActiveAttemptsCount(problemId) ]);
      if (problemResult.status !== "fulfilled") throw problemResult.reason instanceof Error ? problemResult.reason : new Error("Failed to load problem");
      setProblem(problemResult.value);
      setActiveAttemptsCount(countResult.status === "fulfilled" ? countResult.value : 0);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load problem"); } finally { setLoading(false); }
  };

  const handleStatusChangeClick = (newStatus: string) => {
    setShowStatusDropdown(false); setActionError(null); setPendingStatus(newStatus);
    const solverIsActive = activeAttemptsCount > 0;
    const isClosingAction = newStatus === "COMPLETED" || newStatus === "CLOSED";
    setModalMode(isClosingAction && solverIsActive ? "terminate" : "confirm");
  };

  const cancelModal = () => { setPendingStatus(null); setModalMode(null); };

  const executeStatusChange = async (status: string) => {
    try {
      setIsUpdatingStatus(true);
      const updatedProblem = await updateProblemStatus(problemId, status);
      setProblem(updatedProblem);
      const count = await getProblemActiveAttemptsCount(problemId).catch(() => 0);
      setActiveAttemptsCount(count);
    } catch (err) { setActionError(err instanceof Error ? err.message : "Failed to update status"); } finally { setPendingStatus(null); setModalMode(null); setIsUpdatingStatus(false); }
  };

  const executeDelete = async () => {
    try {
      setIsDeleting(true); await deleteProblem(problemId); router.push("/seeker/dashboard");
    } catch (err) { setActionError(err instanceof Error ? err.message : "Failed to delete problem"); setModalMode(null); setIsDeleting(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 md:py-5">
            <div className="w-32 h-4 bg-slate-100 rounded animate-pulse mb-4" />
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="w-full md:w-3/4 h-8 md:h-10 bg-slate-100 rounded-lg animate-pulse" />
              <div className="w-full md:w-40 h-10 bg-slate-100 rounded-xl animate-pulse flex-shrink-0" />
            </div>
            <div className="flex items-center gap-3 mt-4 mb-4">
              <div className="w-16 h-6 bg-slate-100 rounded-md animate-pulse" />
              <div className="w-48 h-6 bg-slate-100 rounded-md animate-pulse" />
              <div className="w-24 h-6 bg-slate-100 rounded-md animate-pulse" />
            </div>
            <div className="flex space-x-2 bg-slate-50 p-1 rounded-xl mt-4 w-fit max-w-full overflow-hidden animate-pulse border border-slate-100">
              <div className="w-36 h-9 bg-white rounded-lg border border-slate-200 flex-shrink-0" />
              {[32, 36, 32, 28, 28, 32, 24].map((w, i) => <div key={i} className="h-9 bg-slate-200/50 rounded-lg flex-shrink-0" style={{ width: `${w * 4}px` }} />)}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-8"><ProblemSkeleton /></div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-8 flex flex-col items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-lg w-full text-center shadow-sm animate-in fade-in duration-300">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Problem</h2>
          <p className="text-sm font-medium text-red-600 mb-6">{error || "Problem not found"}</p>
          <Link href="/seeker/dashboard" className="px-6 py-2.5 bg-white border border-red-200 text-red-700 font-bold rounded-lg hover:bg-red-100 transition-colors inline-block">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  // 🚀 FIXED: Removed "Gap Analysis" from tabs UI since it's nested
  const tabs: { id: TabType; label: string }[] = [
    { id: "problem", label: "Problem Profile" },
    { id: "proposals", label: "Pending Proposals" },
    { id: "workspace", label: "Active Workspaces" },
    { id: "review", label: "Pending Solutions" },
    { id: "tree", label: "Solution Tree" },
    { id: "insights", label: "AI Insights" },
    { id: "history", label: "Audit Timeline" },
    { id: "settings", label: "Settings" },
  ];

  const pendingLabel = pendingStatus ? STATUS_LABELS[pendingStatus] ?? pendingStatus.replace(/_/g, " ") : "";

  return (
    <div className="min-h-screen bg-slate-50/50">
      {modalMode === "confirm" && pendingStatus && (
        <ConfirmModal tone="accent" icon={<HelpCircle className="w-7 h-7" />} title="Confirm Status Change" confirmLabel="Confirm" busy={isUpdatingStatus} onConfirm={() => executeStatusChange(pendingStatus)} onCancel={cancelModal}>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2">New status</p>
          <div className="flex justify-center mb-4"><span className={`text-[11px] font-bold px-3 py-1 rounded-md border uppercase tracking-wider ${getBadgeStyle(pendingStatus)}`}>{pendingLabel}</span></div>
          <div className="bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-3"><p className="text-sm text-slate-600 font-medium leading-relaxed text-center">{STATUS_DESCRIPTIONS[pendingStatus] ?? "This will update the visibility and state of your problem."}</p></div>
        </ConfirmModal>
      )}

      {modalMode === "terminate" && pendingStatus && (
        <ConfirmModal tone="danger" icon={<AlertTriangle className="w-7 h-7" />} title="Active Solver Warning" confirmLabel="Yes, Terminate" busy={isUpdatingStatus} onConfirm={() => executeStatusChange(pendingStatus)} onCancel={cancelModal}>
          <p className="text-sm text-slate-600 font-medium leading-relaxed text-center mb-4">
            {activeAttemptsCount === 1 ? "A solver is" : `${activeAttemptsCount} solvers are`} <strong className="text-slate-900">currently working</strong> on this problem. Setting the status to <strong className="text-slate-900">{pendingLabel}</strong> will immediately <span className="text-rose-600 font-bold">terminate their active attempt</span>.
          </p>
        </ConfirmModal>
      )}

      {modalMode === "delete" && (
        <ConfirmModal tone="danger" icon={<Trash2 className="w-7 h-7" />} title="Delete this problem?" confirmLabel="Delete Problem" busy={isDeleting} onConfirm={executeDelete} onCancel={() => setModalMode(null)}>
          <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3"><p className="text-sm text-rose-700 font-medium leading-relaxed text-center"><strong className="font-bold">{problem.title}</strong> and its data will be permanently removed.</p></div>
        </ConfirmModal>
      )}

      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm animate-in fade-in duration-500">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 md:py-5">
          <Link href="/seeker/dashboard" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-3 inline-flex items-center gap-1.5 cursor-pointer">
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight flex-1 min-w-0">{problem.title}</h1>
            <div className="relative flex-shrink-0 w-full md:w-auto" ref={dropdownRef}>
              <button onClick={() => setShowStatusDropdown((v) => !v)} disabled={isUpdatingStatus} aria-haspopup="menu" aria-expanded={showStatusDropdown} className="w-full md:w-auto px-6 py-2.5 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl shadow-md transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed">
                {isUpdatingStatus && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {isUpdatingStatus ? "Updating..." : "Change Status"}
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showStatusDropdown ? "rotate-180" : ""}`} />
              </button>

              {showStatusDropdown && (
                <div role="menu" className="absolute right-0 mt-2 w-full md:w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50 origin-top-right animate-in fade-in zoom-in-95 duration-150">
                  {STATUS_OPTIONS.map((status) => {
                    const isDestructive = status === "COMPLETED" || status === "CLOSED";
                    const willTerminate = isDestructive && activeAttemptsCount > 0;
                    const isCurrent = problem.status === status;
                    return (
                      <button key={status} role="menuitem" onClick={() => handleStatusChangeClick(status)} className={`w-full px-3 py-2.5 text-left text-sm font-bold rounded-xl transition-colors flex items-center gap-3 cursor-pointer ${willTerminate ? "text-rose-700 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"}`}>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[status]}`} />
                        <span className="flex-1 min-w-0 truncate">{STATUS_LABELS[status]}</span>
                        {willTerminate && <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md uppercase tracking-wider flex-shrink-0">Terminates solver</span>}
                        {isCurrent && !willTerminate && <Check className="w-4 h-4 text-accent flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap mt-3">
            <span className={`text-[10px] sm:text-[11px] px-3 py-1 rounded-md font-bold border uppercase tracking-wider ${getBadgeStyle(problem.status)}`}>{problem.status.replace(/_/g, " ")}</span>
            <span className="text-[10px] sm:text-[11px] px-3 py-1 rounded-md font-bold border border-amber-200 bg-amber-50 text-amber-700 uppercase tracking-wider">{problem.preferredProgram}</span>
            <span className="text-[10px] sm:text-[11px] px-3 py-1 rounded-md font-bold border border-slate-200 bg-slate-50 text-slate-600 uppercase tracking-wider">{problem.subtasks.length} Sub-tasks</span>
          </div>

          <div className="flex space-x-1 bg-slate-50 p-1 rounded-xl mt-4 w-fit max-w-full overflow-x-auto no-scrollbar border border-slate-100">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`px-5 md:px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === tab.id ? "bg-white text-accent shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent"}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 space-y-6">
        {actionError && (
          <div className="bg-white border-l-4 border-rose-500 shadow-sm rounded-r-xl p-5 flex items-start gap-3 animate-in fade-in duration-300">
            <div className="w-2.5 h-2.5 bg-rose-500 rounded-full mt-1.5 flex-shrink-0" />
            <p className="text-sm font-bold text-slate-800 flex-1 min-w-0 break-words">{actionError}</p>
            <button onClick={() => setActionError(null)} aria-label="Dismiss" className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer flex-shrink-0"><X className="w-4 h-4" /></button>
          </div>
        )}

        {activeAttemptsCount > 0 && activeTab !== "workspace" && (
          <div className="bg-white border-l-4 border-accent shadow-sm rounded-r-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-accent rounded-full animate-pulse flex-shrink-0" />
              <p className="text-sm font-bold text-slate-800">{activeAttemptsCount === 1 ? "1 solver is currently working on this problem." : `${activeAttemptsCount} solvers are currently working on this problem.`}</p>
            </div>
            <button onClick={() => handleTabChange("workspace")} className="text-sm font-bold text-accent hover:underline transition-all cursor-pointer text-left">View workspace →</button>
          </div>
        )}

        <div key={activeTab} className="animate-in fade-in duration-500">
          {/* 🚀 FIXED: GapAnalysisView removed completely from here. It is handled by AIInsightsTab now. */}
          {activeTab === "problem" && <ProblemTab problem={problem} />}
          {activeTab === "proposals" && <ProposalsTab problem={problem} onLocateInTree={locateInTree} />}
          {activeTab === "workspace" && <WorkspaceTab problem={problem} onProblemUpdate={setProblem} onLocateInTree={locateInTree} />}
          {activeTab === "review" && <ReviewSolutionsTab problem={problem} />}
          {activeTab === "tree" && <SolutionTreeTab problemId={problemId} highlightedAttemptId={highlightedNodeId} />}
          {activeTab === "insights" && <AIInsightsTab problemId={problemId} />}
          {activeTab === "history" && <AuditTimelineTab problemId={problemId} />}
          {activeTab === "settings" && <SettingsTab problem={problem} onDelete={() => { setActionError(null); setModalMode("delete"); }} />}
        </div>
      </div>
    </div>
  );
}

export default function ProblemDetailPage() {
  return (
    <Suspense fallback={null}>
      <ProblemDetailContent />
    </Suspense>
  );
}