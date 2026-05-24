"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Portal from "@/components/portal";
import { getProblemById } from "@/lib/api/problem";
import { getMyAttempt, getAllAttempts, getMyProposalStatus } from "@/lib/api/attempts";
import type { ProblemResponse } from "@/types/problem";
import type { SolutionAttemptResponse } from "@/types/attempt";
import { AuditTimelineTab } from "@/components/problem-detail-solver/AuditTimelineTab";
import SubmitProposalModal from "@/components/problem-detail-solver/SubmitProposalModal";

type TabType = "blueprint" | "subtasks" | "tree" | "history";

export interface TreeAttemptNode extends SolutionAttemptResponse {
  children: TreeAttemptNode[];
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-accent text-white",
  CLAIMED: "bg-secondary text-white",
  IN_PROGRESS: "bg-yellow-500 text-white",
  SOLVED_OPEN_FOR_IMPROVEMENT: "bg-green-500 text-white",
  COMPLETED: "bg-gray-800 text-white",
  CLOSED: "bg-gray-500 text-white",
  TERMINATED: "bg-red-500 text-white",
};

function buildHierarchyTree(flatList: SolutionAttemptResponse[]): TreeAttemptNode[] {
  const map: Record<string, TreeAttemptNode> = {};
  const roots: TreeAttemptNode[] = [];
  flatList.forEach((item) => { map[item.id] = { ...item, children: [] }; });
  flatList.forEach((item) => {
    const node = map[item.id];
    if (item.parentAttemptId && map[item.parentAttemptId]) {
      map[item.parentAttemptId].children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

// ─── Attempt Detail Modal ────────────────────────────────────────────────────
function AttemptDetailModal({
  node,
  flatAttemptsList,
  isAlreadyClaimed,
  isUnavailable,
  hasPendingProposal,
  onClaimCall,
  onClose,
}: {
  node: TreeAttemptNode;
  flatAttemptsList: SolutionAttemptResponse[];
  isAlreadyClaimed: boolean;
  isUnavailable: boolean;
  hasPendingProposal: boolean;
  onClaimCall: (id?: string) => void;
  onClose: () => void;
}) {
  const attemptDate = new Date(node.claimedAt);
  const [activeSubIdx, setActiveSubIdx] = useState(0);
  const activeSub = node.submissions[activeSubIdx] ?? null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden border border-gray-200">
          <div className="flex items-start justify-between p-5 border-b border-gray-100 flex-shrink-0">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900">{node.solverFirstName} {node.solverLastName}</h2>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${node.status === "COMPLETED" ? "bg-green-100 text-green-700 border-green-200" : node.status === "ABANDONED" ? "bg-red-100 text-red-700 border-red-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"}`}>{node.status}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{node.solverDegreeProgram} · {node.solverInstitution}</p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {node.parentAttemptId && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent text-[11px] font-semibold rounded-full">
                    Forked from {node.parentSolverName}
                  </span>
                )}
                <span className="text-[11px] text-gray-400">{attemptDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {node.status === "COMPLETED" && !isAlreadyClaimed && !isUnavailable && !hasPendingProposal && (
                <button
                  onClick={() => onClaimCall(node.id)}
                  className="px-3 py-1.5 bg-secondary hover:bg-accent text-white text-sm font-semibold rounded-lg transition-all shadow-sm"
                >
                  Submit Proposal to Build Upon ➔
                </button>
              )}
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {node.submissions.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-12"><p className="text-gray-400 text-sm">No subtask submissions yet.</p></div>
          ) : (
            <>
              <div className="flex gap-2 px-5 pt-4 pb-3 border-b border-gray-100 flex-shrink-0 flex-wrap">
                {node.submissions.map((sub, idx) => (
                  <button key={sub.id} onClick={() => setActiveSubIdx(idx)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${activeSubIdx === idx ? "bg-accent text-white border-accent shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-accent hover:text-accent"}`}>
                    {sub.subtaskTitle}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-5 space-y-4">
                {activeSub && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800 truncate">{activeSub.subtaskTitle}</span>
                      <span className="ml-auto flex-shrink-0 text-xs px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-500 rounded-full">{activeSub.status}</span>
                    </div>
                    {activeSub.deltaDescription && (
                      <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
                        <p className="text-xs font-bold text-accent uppercase tracking-wide mb-1">What changed from the parent solution</p>
                        <p className="text-sm text-gray-800 italic leading-relaxed break-words">{activeSub.deltaDescription}</p>
                      </div>
                    )}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap break-words leading-relaxed">{activeSub.description || "No description provided."}</p>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Portal>
  );
}

// ─── Individual attempt card ─────────────────────────────────────────────────
function AttemptCard({
  node,
  isAlreadyClaimed,
  isUnavailable,
  hasPendingProposal,
  onViewClick,
  onBuildUponClick,
}: {
  node: TreeAttemptNode;
  isAlreadyClaimed: boolean;
  isUnavailable: boolean;
  hasPendingProposal: boolean;
  onViewClick: () => void;
  onBuildUponClick: () => void;
}) {
  const attemptDate = new Date(node.claimedAt);
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-accent/40 hover:shadow-md transition-all w-56 select-none" style={{ minWidth: "224px", maxWidth: "224px" }}>
      <div className="flex items-start justify-between gap-1 mb-1">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm leading-tight truncate">{node.solverFirstName} {node.solverLastName}</p>
          <p className="text-[11px] text-gray-500 leading-snug truncate">{node.solverDegreeProgram}</p>
        </div>
        <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ml-1 mt-0.5 ${node.status === "COMPLETED" ? "bg-green-100 text-green-700 border-green-200" : node.status === "ABANDONED" ? "bg-red-100 text-red-700 border-red-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"}`}>
          {node.status}
        </span>
      </div>
      <p className="text-[10px] text-gray-400 mt-1">{attemptDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>

      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
        {node.status === "COMPLETED" && !isAlreadyClaimed && !isUnavailable && !hasPendingProposal && (
          <button
            onClick={(e) => { e.stopPropagation(); onBuildUponClick(); }}
            className="px-2.5 py-1 bg-secondary hover:bg-accent text-white text-[11px] font-semibold rounded-lg transition-all shadow-sm"
          >
            Build Upon ➔
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); onViewClick(); }} className="px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:text-accent border border-gray-200 rounded-lg bg-white hover:bg-accent/5 hover:border-accent/30 transition-all">
          View ↗
        </button>
      </div>
    </div>
  );
}

// ─── Family Tree renderer ────────────────────────────────────────────────────
function SolutionFamilyTree({
  roots,
  flatAttemptsList,
  isAlreadyClaimed,
  isUnavailable,
  hasPendingProposal,
  onClaimCall,
  onViewAttempt,
}: {
  roots: TreeAttemptNode[];
  flatAttemptsList: SolutionAttemptResponse[];
  isAlreadyClaimed: boolean;
  isUnavailable: boolean;
  hasPendingProposal: boolean;
  onClaimCall: (id?: string) => void;
  onViewAttempt: (node: TreeAttemptNode) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  function renderLevel(nodes: TreeAttemptNode[]): React.ReactNode {
    return (
      <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 0, justifyContent: "center" }}>
        {nodes.map((node) => (
          <div key={node.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 16px" }}>
            <AttemptCard
              node={node}
              isAlreadyClaimed={isAlreadyClaimed}
              isUnavailable={isUnavailable}
              hasPendingProposal={hasPendingProposal}
              onBuildUponClick={() => onClaimCall(node.id)}
              onViewClick={() => onViewAttempt(node)}
            />
            {node.children.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 2, height: 28, background: "#e5e7eb" }} />
                {renderLevel(node.children)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: "relative", overflowX: "auto", paddingBottom: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 700, paddingTop: 8, position: "relative", zIndex: 1 }}>
        {renderLevel(roots)}
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function SolverProblemDetailPage() {
  const params = useParams();
  const problemId = params.id as string;

  const [problem, setProblem] = useState<ProblemResponse | null>(null);
  const [myAttempt, setMyAttempt] = useState<SolutionAttemptResponse | null>(null);
  const [attempts, setAttempts] = useState<SolutionAttemptResponse[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("blueprint");

  const [modalNode, setModalNode] = useState<TreeAttemptNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Proposal Flow State
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [forkingParentId, setForkingParentId] = useState<string | undefined>();
  const [hasPendingProposal, setHasPendingProposal] = useState(false);
  const [proposalSuccessMsg, setProposalSuccessMsg] = useState<string | null>(null);

  useEffect(() => { loadData(); }, [problemId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const problemData = await getProblemById(problemId);
      setProblem(problemData);

      // Check for active workspace
      try {
        const attemptData = await getMyAttempt(problemId);
        setMyAttempt(attemptData);
      } catch {
        setMyAttempt(null);

        // No active workspace — check if solver has a pending/approved proposal
        try {
          const proposalStatus = await getMyProposalStatus(problemId);
          if (proposalStatus === "PENDING" || proposalStatus === "APPROVED") {
            setHasPendingProposal(true);
            setProposalSuccessMsg("Your proposal is currently under review by the Seeker.");
          }
        } catch {
          // Not a solver or no proposals — ignore
        }
      }

      try { setAttempts(await getAllAttempts(problemId)); } catch { setAttempts([]); }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to load problem");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProposal = (parentAttemptId?: string) => {
    setForkingParentId(parentAttemptId);
    setShowProposalModal(true);
    setModalNode(null);
  };

  const handleProposalSuccess = () => {
    setShowProposalModal(false);
    setHasPendingProposal(true);
    setProposalSuccessMsg("Your proposal has been successfully submitted! You'll be notified when the Seeker reviews it.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !problem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700 font-medium">{error}</div>
          <Link href="/solver/dashboard" className="mt-4 inline-block text-accent hover:text-secondary font-medium transition-colors">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (!problem) return null;

  const isAlreadyClaimed = myAttempt?.status === "ACTIVE";
  const canClaimFresh = problem.status === "OPEN";
  const isUnavailable = !isAlreadyClaimed && !canClaimFresh && problem.status !== "SOLVED_OPEN_FOR_IMPROVEMENT";
  const structuredTreeRoots = buildHierarchyTree(attempts);

  const tabs: { id: TabType; label: string }[] = [
    { id: "blueprint", label: "Problem Blueprint" },
    { id: "subtasks", label: "Sub-problems" },
    { id: "tree", label: `Solution Tree${attempts.length > 0 ? ` (${attempts.length})` : ""}` },
    { id: "history", label: "Audit Timeline" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 pb-12">

      {/* View Attempt Modal */}
      {modalNode && (
        <AttemptDetailModal
          node={modalNode}
          flatAttemptsList={attempts}
          isAlreadyClaimed={isAlreadyClaimed}
          isUnavailable={isUnavailable}
          hasPendingProposal={hasPendingProposal}
          onClaimCall={handleOpenProposal}
          onClose={() => setModalNode(null)}
        />
      )}

      {/* Submit Proposal Modal */}
      {showProposalModal && (
        <SubmitProposalModal
          problemId={problemId}
          parentAttemptId={forkingParentId}
          onClose={() => setShowProposalModal(false)}
          onSuccess={handleProposalSuccess}
        />
      )}

      {/* ── Sticky header ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <Link href="/solver/dashboard" className="text-sm text-gray-500 hover:text-accent font-medium mb-4 inline-flex items-center transition-colors">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Dashboard
          </Link>

          <div className="flex items-start justify-between mt-2">
            <h1 className="text-3xl font-bold text-gray-900 leading-tight flex-1 min-w-0 pr-4">{problem.title}</h1>
            <div className="flex-shrink-0">
              {isAlreadyClaimed ? (
                <Link href={`/solver/problem/${problemId}/work`} className="px-6 py-2.5 bg-secondary hover:bg-accent text-white rounded-lg font-medium transition-colors shadow-sm inline-block">
                  Continue Working →
                </Link>
              ) : hasPendingProposal ? (
                <span className="px-6 py-2.5 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-lg font-medium shadow-sm flex items-center gap-2 cursor-default">
                  Proposal Under Review
                </span>
              ) : canClaimFresh ? (
                <button onClick={() => handleOpenProposal()} className="px-6 py-2.5 bg-secondary hover:bg-accent text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                  Submit Proposal
                </button>
              ) : problem.status === "SOLVED_OPEN_FOR_IMPROVEMENT" ? (
                <button onClick={() => setActiveTab("tree")} className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm">
                  Build Upon (Solution Tree)
                </button>
              ) : isUnavailable ? (
                <span className="px-6 py-2.5 bg-gray-100 border border-gray-200 text-gray-400 rounded-lg font-medium cursor-not-allowed inline-block shadow-inner">
                  Not Available
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap mt-5">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase ${STATUS_COLORS[problem.status] || STATUS_COLORS.OPEN}`}>
              {problem.status.replace("_", " ")}
            </span>
            <span className="inline-flex items-center px-3 py-1.5 bg-accent/10 text-accent rounded-full text-xs font-bold uppercase tracking-wide border border-accent/20">
              {problem.preferredProgram}
            </span>
            <span className="inline-flex items-center text-sm text-gray-600 font-medium">
              {problem.subtasks.length} Sub-tasks
            </span>
            <span className="inline-flex items-center text-sm text-gray-600 font-medium">
              Seeker: <span className="ml-1 text-gray-900">{problem.organizationName}</span>
            </span>
          </div>

          {/* Proposal pending banner */}
          {proposalSuccessMsg && (
            <div className="mt-5 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-sm font-bold text-yellow-800">Proposal Pending Review</p>
                <p className="text-xs text-yellow-700 mt-0.5">{proposalSuccessMsg}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tab navigation */}
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors ${activeTab === tab.id ? "border-accent text-accent" : "border-transparent text-gray-500 hover:text-gray-900"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Page body ── */}
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">

        {/* Active claim banner */}
        {isAlreadyClaimed && (
          <div className="bg-white border-l-4 border-l-accent border-y border-r border-gray-200 rounded-r-lg p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-accent rounded-full animate-pulse" />
              <p className="text-sm font-semibold text-gray-800">You have an active approved workspace for this problem.</p>
            </div>
            <Link href={`/solver/problem/${problemId}/work`} className="text-sm font-bold text-accent hover:text-secondary transition-colors">
              Go to workspace →
            </Link>
          </div>
        )}

        {/* ── Tab: Problem Blueprint ── */}
        {activeTab === "blueprint" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              Problem Blueprint
            </h2>
            <div className="space-y-8">
              {problem.backgroundContext && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Background Context</h3>
                  <div className="bg-gray-50 rounded-lg p-5 border border-gray-100"><p className="text-gray-800 leading-relaxed text-sm">{problem.backgroundContext}</p></div>
                </div>
              )}
              <div>
                <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Primary Problem Statement</h3>
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-100"><p className="text-gray-800 leading-relaxed font-medium text-sm">{problem.primaryStatement}</p></div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: AI Sub-problems ── */}
        {activeTab === "subtasks" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              </div>
              AI-Decomposed Sub-problems
            </h2>
            <div className="grid gap-5">
              {problem.subtasks.map((subtask, index) => (
                <div key={subtask.id} className="bg-gradient-to-r from-accent/5 to-secondary/5 rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm">{index + 1}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-bold text-gray-900">{subtask.title}</h3>
                        <span className="px-2.5 py-1 bg-white border border-secondary/20 text-secondary text-[11px] font-bold tracking-wide uppercase rounded-full shadow-sm">{subtask.departmentFocus}</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed text-sm">{subtask.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Solution Tree ── */}
        {activeTab === "tree" && (
          <>
            {attempts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
                <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No solutions proposed yet</h3>
                <p className="text-gray-500 text-sm">Be the first to submit a proposal for this problem and start the tree.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    </div>
                    Solution Evolution Tree
                  </h2>
                  <p className="text-sm text-gray-500 mt-2 ml-10">Each node is a workspace attempt. Click <strong>View</strong> on any card to see details and before/after comparisons.</p>
                </div>
                <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-6 shadow-inner overflow-x-auto">
                  <SolutionFamilyTree roots={structuredTreeRoots} flatAttemptsList={attempts} isAlreadyClaimed={isAlreadyClaimed} isUnavailable={isUnavailable} hasPendingProposal={hasPendingProposal} onClaimCall={handleOpenProposal} onViewAttempt={(node) => setModalNode(node)} />
                </div>
              </div>
            )}

            {/* Submit Proposal CTA at bottom if applicable */}
            {!isAlreadyClaimed && !isUnavailable && !hasPendingProposal && (
              <div className="bg-gradient-to-r from-accent/10 to-secondary/10 rounded-xl shadow-sm border border-accent/20 p-8 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Have a unique approach?</h3>
                  <p className="text-sm text-gray-600 mt-1">Send your proposal to the seeker. Once approved, you can tackle the sub-tasks in your workspace.</p>
                </div>
                <button onClick={() => handleOpenProposal()} className="px-8 py-3.5 bg-secondary hover:bg-accent text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                  Submit Proposal ➔
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Tab: History (Audit Timeline) ── */}
        {activeTab === "history" && <AuditTimelineTab problemId={problemId} />}
      </div>
    </div>
  );
}