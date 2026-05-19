"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { getAllAttempts } from "@/lib/api/attempts";
import type { SolutionAttemptResponse, TreeAttemptNode } from "@/types/attempt";

// ─── Portal helper ────────────────────────────────────────────────────────────
function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted ? createPortal(children, document.body) : null;
}

// ─── Build parent→children hierarchy ─────────────────────────────────────────
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
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-gray-100 flex-shrink-0">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900">
                  {node.solverFirstName} {node.solverLastName}
                </h2>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  node.status === "COMPLETED"
                    ? "bg-green-100 text-green-700 border-green-200"
                    : node.status === "ABANDONED"
                    ? "bg-red-100 text-red-700 border-red-200"
                    : "bg-yellow-100 text-yellow-700 border-yellow-200"
                }`}>
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
              {/* Subtask Tabs */}
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
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      sub.status === "SUBMITTED"
                        ? activeSubIdx === idx ? "bg-white" : "bg-green-500"
                        : activeSubIdx === idx ? "bg-white/60" : "bg-gray-300"
                    }`} />
                    {sub.subtaskTitle}
                  </button>
                ))}
              </div>

              {/* Body */}
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
        <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ml-1 mt-0.5 ${
          node.status === "COMPLETED"
            ? "bg-green-100 text-green-700 border-green-200"
            : node.status === "ABANDONED"
            ? "bg-red-100 text-red-700 border-red-200"
            : "bg-yellow-100 text-yellow-700 border-yellow-200"
        }`}>
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

// ─── Family Tree renderer ─────────────────────────────────────────────────────
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
            <AttemptCard node={node} onViewClick={() => onViewAttempt(node)} />
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
export function SolutionTreeTab({ problemId }: { problemId: string }) {
  const [attempts, setAttempts] = useState<SolutionAttemptResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalNode, setModalNode] = useState<TreeAttemptNode | null>(null);

  useEffect(() => {
    getAllAttempts(problemId)
      .then(setAttempts)
      .catch((err: unknown) => console.error("Failed to load attempts", err))
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
          <span className="ml-auto text-xs text-gray-400">
            {attempts.length} total attempt{attempts.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-4">
          <SolutionFamilyTree roots={roots} onViewAttempt={(node) => setModalNode(node)} />
        </div>
      </div>
    </>
  );
}