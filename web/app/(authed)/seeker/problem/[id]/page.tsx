"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProblemById, updateProblemStatus, deleteProblem } from "@/lib/api/problem";
import type { ProblemResponse } from "@/types/problem";
import { getAllAttempts } from "@/lib/api/attempts";
import type { SolutionAttemptResponse, TreeAttemptNode } from "@/types/attempt";

type TabType = "problem" | "insights" | "tree" | "history" | "settings";

const STATUS_COLORS = {
  OPEN: "bg-blue-500 text-white",
  CLAIMED: "bg-purple-500 text-white",
  IN_PROGRESS: "bg-yellow-500 text-white",
  SOLVED: "bg-green-500 text-white",
  CLOSED: "bg-gray-500 text-white",
};

// ─── Portal helper ───────────────────────────────────────────────────────────
function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted ? createPortal(children, document.body) : null;
}

// ─── Build parent→children hierarchy ────────────────────────────────────────
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

// ─── Read-only Attempt Detail Modal ──────────────────────────────────────────
function AttemptDetailModal({
  node,
  flatAttemptsList,
  onClose,
}: {
  node: TreeAttemptNode;
  flatAttemptsList: SolutionAttemptResponse[];
  onClose: () => void;
}) {
  const attemptDate = new Date(node.claimedAt);
  const parentRec = node.parentAttemptId
    ? flatAttemptsList.find((a) => a.id === node.parentAttemptId)
    : null;

  const [activeSubIdx, setActiveSubIdx] = useState(0);
  const [viewPanel, setViewPanel] = useState<"current" | "previous">("current");

  const activeSub = node.submissions[activeSubIdx] ?? null;
  const predecessorSub = activeSub && parentRec
    ? parentRec.submissions.find((ps) => ps.subtaskId === activeSub.subtaskId)
    : null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => { setViewPanel("current"); }, [activeSubIdx]);

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden border border-gray-200">

          {/* Header - Fixed */}
          <div className="flex items-start justify-between p-5 border-b border-gray-100 flex-shrink-0">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900">
                  {node.solverFirstName} {node.solverLastName}
                </h2>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    node.status === "COMPLETED"
                      ? "bg-green-100 text-green-700 border-green-200"
                      : node.status === "ABANDONED"
                      ? "bg-red-100 text-red-700 border-red-200"
                      : "bg-yellow-100 text-yellow-700 border-yellow-200"
                  }`}
                >
                  {node.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {node.solverDegreeProgram} · {node.solverInstitution}
              </p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {node.parentAttemptId && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-semibold rounded-full">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7l-2 2m2-2l2 2m4 4v-4a2 2 0 00-2-2h-6" />
                    </svg>
                    Forked from {node.parentSolverName}
                  </span>
                )}
                <span className="text-[11px] text-gray-400">
                  {attemptDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </span>
                <span className="text-[11px] text-gray-500">
                  {node.submissions.filter((s) => s.status === "SUBMITTED").length}/{node.submissions.length} subtasks submitted
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {node.submissions.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <p className="text-gray-400 text-sm">No subtask submissions yet.</p>
            </div>
          ) : (
            <>
              {/* Subtask Tabs - Fixed */}
              <div className="flex gap-2 px-5 pt-4 pb-3 border-b border-gray-100 flex-shrink-0 flex-wrap">
                {node.submissions.map((sub, idx) => (
                  <button
                    key={sub.id}
                    onClick={() => setActiveSubIdx(idx)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      activeSubIdx === idx
                        ? "bg-accent text-white border-accent shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-900"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        sub.status === "SUBMITTED"
                          ? activeSubIdx === idx ? "bg-white" : "bg-green-500"
                          : activeSubIdx === idx ? "bg-white/60" : "bg-gray-300"
                      }`}
                    />
                    {sub.subtaskTitle}
                  </button>
                ))}
              </div>

              {/* Body - Scrollable */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-5 space-y-4">
                {activeSub && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activeSub.status === "SUBMITTED" ? "bg-green-500" : "bg-gray-300"}`} />
                      <span className="text-sm font-semibold text-gray-800 truncate">{activeSub.subtaskTitle}</span>
                      <span className="ml-auto flex-shrink-0 text-xs px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-500 rounded-full">
                        {activeSub.status}
                      </span>
                    </div>

                    {activeSub.deltaDescription && (
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">🔧 Technical Delta</p>
                        <p className="text-sm text-blue-900 italic leading-relaxed break-words">{activeSub.deltaDescription}</p>
                      </div>
                    )}

                    {predecessorSub ? (
                      <>
                        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit">
                          <button
                            onClick={() => setViewPanel("current")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                              viewPanel === "current"
                                ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                                : "text-gray-500 hover:text-gray-800"
                            }`}
                          >
                            ⏭ Current Solution
                          </button>
                          <button
                            onClick={() => setViewPanel("previous")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                              viewPanel === "previous"
                                ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                                : "text-gray-500 hover:text-gray-800"
                            }`}
                          >
                            ⏮ Previous ({node.parentSolverName})
                          </button>
                        </div>

                        {viewPanel === "current" && (
                          <div className="bg-green-50/40 border border-green-100 rounded-xl p-4">
                            <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">
                              {node.solverFirstName}'s Solution
                            </p>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
                              {activeSub.description || "No description provided."}
                            </p>
                            {activeSub.fileUrls && activeSub.fileUrls.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-green-100 space-y-1.5">
                                <p className="text-xs font-bold text-green-700 uppercase">Files</p>
                                {activeSub.fileUrls.map((url, idx) => (
                                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs text-green-700 hover:underline min-w-0">
                                    📎 <span className="truncate">Modified File {idx + 1}</span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {viewPanel === "previous" && (
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                              {node.parentSolverName}'s Original
                            </p>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap break-words leading-relaxed">
                              {predecessorSub.description || "No description provided."}
                            </p>
                            {predecessorSub.fileUrls && predecessorSub.fileUrls.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200 space-y-1.5">
                                <p className="text-xs font-bold text-gray-400 uppercase">Files</p>
                                {predecessorSub.fileUrls.map((url, idx) => (
                                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-500 min-w-0">
                                    📎 <span className="truncate">Original File {idx + 1}</span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
                          {activeSub.description || "No description provided."}
                        </p>
                        {activeSub.fileUrls && activeSub.fileUrls.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-2">
                            {activeSub.fileUrls.map((url, idx) => (
                              <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-blue-500 hover:border-blue-200 transition-colors">
                                📎 File {idx + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
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

// ─── Read-only Attempt Card ───────────────────────────────────────────────────
function AttemptCard({
  node,
  onViewClick,
}: {
  node: TreeAttemptNode;
  onViewClick: () => void;
}) {
  const attemptDate = new Date(node.claimedAt);
  return (
    <div
      className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-blue-300 hover:shadow-md transition-all w-56 select-none"
      style={{ minWidth: "224px", maxWidth: "224px" }}
    >
      <div className="flex items-start justify-between gap-1 mb-1">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm leading-tight truncate">
            {node.solverFirstName} {node.solverLastName}
          </p>
          <p className="text-[11px] text-gray-500 leading-snug truncate">{node.solverDegreeProgram}</p>
          <p className="text-[10px] text-gray-400 truncate">{node.solverInstitution}</p>
        </div>
        <span
          className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ml-1 mt-0.5 ${
            node.status === "COMPLETED"
              ? "bg-green-100 text-green-700 border-green-200"
              : node.status === "ABANDONED"
              ? "bg-red-100 text-red-700 border-red-200"
              : "bg-yellow-100 text-yellow-700 border-yellow-200"
          }`}
        >
          {node.status}
        </span>
      </div>

      {node.parentAttemptId && (
        <div className="flex items-center gap-1 mt-1 mb-1">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-semibold rounded-full">
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7l-2 2m2-2l2 2m4 4v-4a2 2 0 00-2-2h-6" />
            </svg>
            Forked from {node.parentSolverName}
          </span>
        </div>
      )}

      <p className="text-[10px] text-gray-400 mt-1">
        {attemptDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </p>
      <p className="text-[10px] text-gray-500 mt-1">
        {node.submissions.filter((s) => s.status === "SUBMITTED").length} / {node.submissions.length} subtasks submitted
      </p>

      <div className="flex items-center gap-1.5 mt-3">
        <button
          onClick={(e) => { e.stopPropagation(); onViewClick(); }}
          className="px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-all"
        >
          View ↗
        </button>
      </div>
    </div>
  );
}

// ─── Family Tree renderer ────────────────────────────────────────────────────
function SolutionFamilyTree({
  roots,
  onViewAttempt,
}: {
  roots: TreeAttemptNode[];
  onViewAttempt: (node: TreeAttemptNode) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setTick((n) => n + 1), 80);
    return () => clearTimeout(t);
  }, [roots]);

  function renderLevel(nodes: TreeAttemptNode[]): React.ReactNode {
    return (
      <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 0, justifyContent: "center" }}>
        {nodes.map((node) => (
          <div
            key={node.id}
            id={`tnode-${node.id}`}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 16px" }}
          >
            <AttemptCard
              node={node}
              onViewClick={() => onViewAttempt(node)}
            />
            {node.children.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 2, height: 28, background: "#d1d5db" }} />
                {renderLevel(node.children)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  function buildConnectorLines(nodes: TreeAttemptNode[]): React.ReactNode[] {
    if (!containerRef.current) return [];
    const containerRect = containerRef.current.getBoundingClientRect();
    const lines: React.ReactNode[] = [];

    function walk(nodes: TreeAttemptNode[]) {
      nodes.forEach((node) => {
        if (node.children.length >= 2) {
          const childWrappers = node.children.map((c) => {
            const el = containerRef.current!.querySelector(`#tnode-${c.id}`) as HTMLElement;
            return el ? (el.children[0] as HTMLElement) : null;
          }).filter(Boolean) as HTMLElement[];

          if (childWrappers.length < 2) { walk(node.children); return; }

          const childRects = childWrappers.map((el) => el.getBoundingClientRect());
          const parentWrapper = containerRef.current!.querySelector(`#tnode-${node.id}`) as HTMLElement;
          const parentCard = parentWrapper ? (parentWrapper.children[0] as HTMLElement) : null;
          if (!parentCard) { walk(node.children); return; }
          const pRect = parentCard.getBoundingClientRect();

          const scroll = { x: containerRef.current!.scrollLeft, y: containerRef.current!.scrollTop };
          const toL = (r: DOMRect) => ({
            cx: r.left + r.width / 2 - containerRect.left + scroll.x,
            top: r.top - containerRect.top + scroll.y,
            bottom: r.bottom - containerRect.top + scroll.y,
          });

          const p = toL(pRect);
          const cs = childRects.map(toL);
          const barY = p.bottom + 14;
          const leftX = Math.min(...cs.map((c) => c.cx));
          const rightX = Math.max(...cs.map((c) => c.cx));

          lines.push(
            <g key={`conn-${node.id}`} stroke="#cbd5e1" strokeWidth="1.5" fill="none" strokeLinecap="round">
              <line x1={p.cx} y1={p.bottom} x2={p.cx} y2={barY} />
              <line x1={leftX} y1={barY} x2={rightX} y2={barY} />
              {cs.map((c, i) => (
                <line key={i} x1={c.cx} y1={barY} x2={c.cx} y2={c.top} />
              ))}
            </g>
          );
        }
        walk(node.children);
      });
    }

    walk(nodes);
    return lines;
  }

  const svgLines = buildConnectorLines(roots);
  const treeWidth = containerRef.current?.scrollWidth ?? 0;
  const treeHeight = containerRef.current?.scrollHeight ?? 0;

  return (
    <div ref={containerRef} style={{ position: "relative", overflowX: "auto", paddingBottom: 24 }}>
      {svgLines.length > 0 && (
        <svg
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 0, overflow: "visible" }}
          width={treeWidth}
          height={treeHeight}
        >
          {svgLines}
        </svg>
      )}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 700, paddingTop: 8, position: "relative", zIndex: 1 }}>
        {renderLevel(roots)}
      </div>
    </div>
  );
}

// ─── Solution Tree Tab ────────────────────────────────────────────────────────
function SolutionTreeTab({ problemId }: { problemId: string }) {
  const [attempts, setAttempts] = useState<SolutionAttemptResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalNode, setModalNode] = useState<TreeAttemptNode | null>(null);

  useEffect(() => {
    getAllAttempts(problemId)
      .then(setAttempts)
      .catch((err) => console.error("Failed to load attempts", err))
      .finally(() => setLoading(false));
  }, [problemId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No attempts yet</h3>
        <p className="text-gray-600">No students have claimed this problem yet. Check back soon.</p>
      </div>
    );
  }

  const roots = buildHierarchyTree(attempts);

  return (
    <>
      {/* Modal */}
      {modalNode && (
        <AttemptDetailModal
          node={modalNode}
          flatAttemptsList={attempts}
          onClose={() => setModalNode(null)}
        />
      )}

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Solution Evolution Tree</h2>
          <p className="text-xs text-gray-500 mt-1">
            Each node is a solution attempt. Forked nodes branch downward from their parent — click{" "}
            <strong>View</strong> on any card to read the submitted work.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-5 flex-wrap">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Legend:</span>
          <span className="inline-flex items-center gap-1.5 text-xs text-green-700">
            <span className="w-2.5 h-2.5 rounded-full bg-green-100 border border-green-200 inline-block" />
            Completed
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-yellow-700">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-100 border border-yellow-200 inline-block" />
            Active
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-red-700">
            <span className="w-2.5 h-2.5 rounded-full bg-red-100 border border-red-200 inline-block" />
            Abandoned
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-blue-700">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7l-2 2m2-2l2 2m4 4v-4a2 2 0 00-2-2h-6" />
            </svg>
            Forked attempt
          </span>
          <span className="ml-auto text-xs text-gray-400">{attempts.length} total attempt{attempts.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-4">
          <SolutionFamilyTree
            roots={roots}
            onViewAttempt={(node) => setModalNode(node)}
          />
        </div>
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ProblemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const problemId = params.id as string;

  const [problem, setProblem] = useState<ProblemResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("problem");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  useEffect(() => { loadProblem(); }, [problemId]);

  const loadProblem = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProblemById(problemId);
      setProblem(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load problem");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const updatedProblem = await updateProblemStatus(problemId, newStatus);
      setProblem(updatedProblem);
      setShowStatusDropdown(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
      setShowStatusDropdown(false);
    }
  };

  const handleDeleteProblem = async () => {
    if (!confirm("Are you sure you want to delete this problem? This action cannot be undone.")) return;
    try {
      await deleteProblem(problemId);
      router.push("/seeker/dashboard");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete problem");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
            {error || "Problem not found"}
          </div>
          <Link href="/seeker/dashboard" className="mt-4 inline-block text-accent hover:text-secondary">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: "problem",  label: "Problem Profile" },
    { id: "insights", label: "AI Insights" },
    { id: "tree",     label: "Solution Tree" },
    { id: "history",  label: "Audit Timeline" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10">
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <Link href="/seeker/dashboard" className="text-sm text-gray-600 hover:text-accent mb-4 inline-flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>

          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0 pr-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">{problem.title}</h1>
            </div>
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="px-4 py-2.5 bg-secondary hover:bg-accent text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
                Change Status
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showStatusDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
                  {["OPEN", "CLAIMED", "IN_PROGRESS", "SOLVED", "CLOSED"].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-gray-700"
                    >
                      {status.replace("_", " ")}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${STATUS_COLORS[problem.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.OPEN}`}>
              {problem.status.replace("_", " ")}
            </span>
            <span className="inline-flex items-center px-3 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-medium border border-accent/20">
              Required: {problem.requiredCourse}
            </span>
            <span className="inline-flex items-center text-sm text-gray-600 font-medium">
              {problem.subtasks.length} Sub-tasks
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-accent text-accent"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {activeTab === "problem"  && <ProblemTab problem={problem} />}
        {activeTab === "insights" && <PlaceholderTab title="AI Insights & Similarity" />}
        {activeTab === "tree"     && <SolutionTreeTab problemId={problemId} />}
        {activeTab === "history"  && <AuditTimelineTab problemId={problemId} />}
        {activeTab === "settings" && <SettingsTab problem={problem} onDelete={handleDeleteProblem} />}
      </div>
    </div>
  );
}

// ─── Tab 1: Problem Profile ───────────────────────────────────────────────────
function ProblemTab({ problem }: { problem: ProblemResponse }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Problem Blueprint
        </h2>
        <div className="space-y-6">
          {problem.backgroundContext && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Background Context</h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-800 leading-relaxed">{problem.backgroundContext}</p>
              </div>
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Primary Problem Statement</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-gray-800 leading-relaxed font-medium">{problem.primaryStatement}</p>
            </div>
          </div>
          {problem.objectives && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Objectives</h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-800 leading-relaxed">{problem.objectives}</p>
              </div>
            </div>
          )}
          {problem.constraints && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Technical Constraints</h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-800 leading-relaxed">{problem.constraints}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          AI-Decomposed Sub-problems
        </h2>
        <div className="grid gap-4">
          {problem.subtasks.map((subtask, index) => (
            <div key={subtask.id} className="bg-gradient-to-r from-accent/5 to-secondary/5 rounded-lg p-5 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{subtask.title}</h3>
                    <span className="px-2 py-1 bg-secondary/10 text-secondary text-xs font-medium rounded-full">
                      {subtask.departmentFocus}
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{subtask.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          Attachments
        </h2>
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-600 text-sm">No attachments uploaded</p>
          <p className="text-gray-500 text-xs mt-1">File upload feature coming soon</p>
        </div>
      </div>
    </div>
  );
}

// ─── Placeholder Tab ──────────────────────────────────────────────────────────
function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">This feature is coming soon. Stay tuned!</p>
      </div>
    </div>
  );
}

// ─── Tab 4: Audit Timeline ────────────────────────────────────────────────────
function AuditTimelineTab({ problemId }: { problemId: string }) {
  const [attempts, setAttempts] = useState<SolutionAttemptResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);

  useEffect(() => {
    getAllAttempts(problemId)
      .then(setAttempts)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [problemId]);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading timeline...</div>;
  }

  if (attempts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center text-gray-500">
        No solution attempts have been made yet.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Solution Audit Timeline</h2>
      <div className="relative border-l-2 border-accent/30 ml-4">
        {attempts.map((attempt, index) => {
          const attemptDate = new Date(attempt.claimedAt);
          const currentMonthYear = attemptDate.toLocaleString("default", { month: "long", year: "numeric" });
          const prevMonthYear = index > 0
            ? new Date(attempts[index - 1].claimedAt).toLocaleString("default", { month: "long", year: "numeric" })
            : null;
          const showDateHeader = currentMonthYear !== prevMonthYear;

          return (
            <div key={attempt.id}>
              {showDateHeader && (
                <div className="relative pl-8 mb-6 mt-8 first:mt-0">
                  <div className="absolute -left-[11px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-background border-2 border-accent/30 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent/50" />
                  </div>
                  <span className="inline-block bg-accent/10 text-accent text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {currentMonthYear}
                  </span>
                </div>
              )}
              <div className="relative pl-8 mb-8 last:mb-0">
                <div className={`absolute -left-[9px] top-4 w-4 h-4 rounded-full border-2 border-white shadow-sm ${attempt.status === "COMPLETED" ? "bg-green-500" : attempt.status === "ABANDONED" ? "bg-red-400" : "bg-yellow-400"}`} />
                <div
                  onClick={() => setExpandedAttempt(expandedAttempt === attempt.id ? null : attempt.id)}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:border-accent hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{attempt.solverFirstName} {attempt.solverLastName}</h3>
                      <p className="text-sm text-gray-600 font-medium">{attempt.solverDegreeProgram} • {attempt.solverInstitution}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-2 ${attempt.status === "COMPLETED" ? "bg-green-100 text-green-700 border border-green-200" : attempt.status === "ABANDONED" ? "bg-red-100 text-red-700 border border-red-200" : "bg-yellow-100 text-yellow-700 border border-yellow-200"}`}>
                        {attempt.status}
                      </span>
                      <p className="text-xs text-gray-500 font-medium">{attemptDate.toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center bg-gray-100 text-gray-800 font-bold w-6 h-6 rounded-full text-xs">
                        {attempt.submissions.filter((s) => s.status === "SUBMITTED").length}
                      </span>
                      <span>sub-tasks submitted</span>
                    </div>
                    <span className="text-accent font-medium text-xs uppercase tracking-wide">
                      {expandedAttempt === attempt.id ? "Hide Details ▲" : "View Details ▼"}
                    </span>
                  </div>
                </div>
                {expandedAttempt === attempt.id && attempt.submissions.length > 0 && (
                  <div className="mt-4 ml-4 space-y-4">
                    {attempt.submissions.map((sub) => (
                      <div key={sub.id} className="bg-gray-50 rounded-lg border border-gray-200 p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`w-2.5 h-2.5 rounded-full ${sub.status === "SUBMITTED" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-gray-400"}`} />
                          <h4 className="font-semibold text-gray-900">{sub.subtaskTitle}</h4>
                          <span className="px-2.5 py-1 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-full ml-auto">
                            {sub.status}
                          </span>
                        </div>
                        {sub.description && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Solution Overview:</p>
                            <p className="text-sm text-gray-700 bg-white p-4 border border-gray-200 rounded-lg whitespace-pre-wrap leading-relaxed shadow-sm">
                              {sub.description}
                            </p>
                          </div>
                        )}
                        {sub.fileUrls && sub.fileUrls.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Attachments ({sub.fileUrls.length}):</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {sub.fileUrls.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-3 text-sm text-gray-700 hover:text-accent bg-white p-3 rounded-lg border border-gray-200 hover:border-accent/30 transition-all shadow-sm">
                                  <span className="text-lg">📎</span>
                                  <span className="truncate flex-1 font-medium">Attachment {i + 1}</span>
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab 5: Settings ──────────────────────────────────────────────────────────
function SettingsTab({ problem, onDelete }: { problem: ProblemResponse; onDelete: () => void }) {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 opacity-60">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Visibility Settings</h2>
          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">COMING SOON</span>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Control who can see this problem. Public problems are visible to all matching student streams, while hidden problems are only visible to you.
        </p>
        <div className="space-y-3 pointer-events-none">
          <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
            <input type="radio" name="visibility" value="public" checked disabled className="w-5 h-5" />
            <div>
              <div className="font-medium text-gray-900">Public</div>
              <div className="text-sm text-gray-600">Visible to all students in the required course</div>
            </div>
          </label>
          <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
            <input type="radio" name="visibility" value="hidden" disabled className="w-5 h-5" />
            <div>
              <div className="font-medium text-gray-900">Hidden / Draft</div>
              <div className="text-sm text-gray-600">Only visible to you (problem is not discoverable by students)</div>
            </div>
          </label>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Problem Data is Immutable</h3>
            <p className="text-sm text-blue-800">
              To preserve matching integrity and audit trail, problem details cannot be edited after validation. If significant changes are required, you must delete and re-submit the problem.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border-2 border-red-200 p-6">
        <h2 className="text-xl font-bold text-red-700 mb-2 flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Danger Zone
        </h2>
        <p className="text-sm text-gray-600 mb-6">Irreversible actions that will permanently affect this problem.</p>
        <div className="space-y-4">
          <div className="flex items-start justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Delete Problem</h3>
              <p className="text-sm text-gray-700">
                Permanently delete this problem and all associated data. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={onDelete}
              className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex-shrink-0"
            >
              Delete Problem
            </button>
          </div>
          <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Archive Problem</h3>
              <p className="text-sm text-gray-700">
                Move this problem to the archive. It will no longer be visible to students but can be restored later.
              </p>
            </div>
            <button disabled className="ml-4 px-4 py-2 bg-gray-300 text-gray-500 font-semibold rounded-lg cursor-not-allowed flex-shrink-0">
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}