"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Portal from "@/components/portal";
import { getProblemById } from "@/lib/api/problem";
import { claimProblem, getMyAttempt, getAllAttempts } from "@/lib/api/attempts";
import type { ProblemResponse } from "@/types/problem";
import type { SolutionAttemptResponse, TreeAttemptNode } from "@/types/attempt";

type TabType = "blueprint" | "subtasks" | "tree";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-500 text-white",
  CLAIMED: "bg-purple-500 text-white",
  IN_PROGRESS: "bg-yellow-500 text-white",
  SOLVED_OPEN_FOR_IMPROVEMENT: "bg-green-500 text-white",
  COMPLETED: "bg-gray-800 text-white",
  CLOSED: "bg-gray-500 text-white",
};

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

// ─── Build Upon Confirmation Modal ──────────────────────────────────────────
function BuildUponConfirmModal({
  node,
  claiming,
  onConfirm,
  onCancel,
}: {
  node: TreeAttemptNode;
  claiming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md"
        onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7l-2 2m2-2l2 2m4 4v-4a2 2 0 00-2-2h-6" />
            </svg>
          </div>

          <h2 className="text-lg font-bold text-gray-900 text-center mb-1">Build Upon This Solution?</h2>
          <p className="text-sm text-gray-500 text-center mb-1">You're about to fork the attempt by</p>
          <p className="text-sm font-semibold text-gray-800 text-center mb-4">
            {node.solverFirstName} {node.solverLastName}
          </p>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-5 text-xs text-blue-800 space-y-1">
            <p>• This will create a new attempt based on their work.</p>
            <p>• You'll be taken to your workspace immediately.</p>
            <p>• You can improve or expand on their submitted subtasks.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={claiming}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {claiming ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Forking…</>
              ) : "Yes, Build Upon ➔"}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

// ─── Attempt Detail Modal ────────────────────────────────────────────────────
function AttemptDetailModal({
  node,
  flatAttemptsList,
  isAlreadyClaimed,
  isUnavailable,
  claiming,
  onClaimCall,
  onClose,
}: {
  node: TreeAttemptNode;
  flatAttemptsList: SolutionAttemptResponse[];
  isAlreadyClaimed: boolean;
  isUnavailable: boolean;
  claiming: boolean;
  onClaimCall: (id?: string) => void;
  onClose: () => void;
}) {
  const attemptDate = new Date(node.claimedAt);
  const parentRec = node.parentAttemptId
    ? flatAttemptsList.find((a) => a.id === node.parentAttemptId)
    : null;

  const [activeSubIdx, setActiveSubIdx] = useState(0);
  const [viewPanel, setViewPanel] = useState<"current" | "previous">("current");
  const [showConfirm, setShowConfirm] = useState(false);

  const activeSub = node.submissions[activeSubIdx] ?? null;
  const predecessorSub = activeSub && parentRec
    ? parentRec.submissions.find((ps) => ps.subtaskId === activeSub.subtaskId)
    : null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !showConfirm) onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, showConfirm]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => { setViewPanel("current"); }, [activeSubIdx]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !showConfirm) onClose();
  };

  return (
    <>
      <Portal>
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={handleBackdropClick}
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
              <div className="flex items-center gap-2 flex-shrink-0">
                {node.status === "COMPLETED" && !isAlreadyClaimed && !isUnavailable && (
                  <button
                    onClick={() => setShowConfirm(true)}
                    disabled={claiming}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white text-sm font-semibold rounded-lg transition-all border border-blue-200"
                  >
                    Build Upon ➔
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
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
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${activeSub.status === "SUBMITTED" ? "bg-green-500" : "bg-gray-300"}`}
                        />
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

      {/* Confirmation Modal — also portaled, higher z-index */}
      {showConfirm && (
        <BuildUponConfirmModal
          node={node}
          claiming={claiming}
          onConfirm={() => { onClaimCall(node.id); onClose(); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}

// ─── Individual attempt card ─────────────────────────────────────────────────
function AttemptCard({
  node,
  isAlreadyClaimed,
  isUnavailable,
  claiming,
  onViewClick,
  onBuildUponClick,
}: {
  node: TreeAttemptNode;
  isAlreadyClaimed: boolean;
  isUnavailable: boolean;
  claiming: boolean;
  onViewClick: () => void;
  onBuildUponClick: () => void;
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

      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
        {node.status === "COMPLETED" && !isAlreadyClaimed && !isUnavailable && (
          <button
            onClick={(e) => { e.stopPropagation(); onBuildUponClick(); }}
            disabled={claiming}
            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-500 text-blue-600 hover:text-white text-[11px] font-semibold rounded-lg transition-all border border-blue-200 shadow-sm"
          >
            Build Upon ➔
          </button>
        )}
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
  flatAttemptsList,
  isAlreadyClaimed,
  isUnavailable,
  claiming,
  onClaimCall,
  onViewAttempt,
}: {
  roots: TreeAttemptNode[];
  flatAttemptsList: SolutionAttemptResponse[];
  isAlreadyClaimed: boolean;
  isUnavailable: boolean;
  claiming: boolean;
  onClaimCall: (id?: string) => void;
  onViewAttempt: (node: TreeAttemptNode) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);

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
              isAlreadyClaimed={isAlreadyClaimed}
              isUnavailable={isUnavailable}
              claiming={claiming}
            
              onBuildUponClick={() => onViewAttempt(node)} // let modal handle confirm
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

// ─── Main page ───────────────────────────────────────────────────────────────
export default function SolverProblemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const problemId = params.id as string;

  const [problem, setProblem] = useState<ProblemResponse | null>(null);
  const [myAttempt, setMyAttempt] = useState<SolutionAttemptResponse | null>(null);
  const [attempts, setAttempts] = useState<SolutionAttemptResponse[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("blueprint");
  const [modalNode, setModalNode] = useState<TreeAttemptNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadData(); }, [problemId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const problemData = await getProblemById(problemId);
      setProblem(problemData);
      try { setMyAttempt(await getMyAttempt(problemId)); } catch { setMyAttempt(null); }
      try { setAttempts(await getAllAttempts(problemId)); } catch (err) { console.error("Failed to load historical attempts", err); }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load problem");
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (parentAttemptId?: string) => {
    if (!problem) return;
    setClaiming(true);
    setError(null);
    try {
      const attempt = await claimProblem(problemId, parentAttemptId);
      setMyAttempt(attempt);
      router.push(`/solver/problem/${problemId}/work`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to claim problem");
      setClaiming(false);
    }
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">{error}</div>
          <Link href="/solver/dashboard" className="mt-4 inline-block text-accent hover:text-secondary">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (!problem) return null;

  const isAlreadyClaimed = myAttempt?.status === "ACTIVE";
  const isUnavailable = 
    problem.status !== "OPEN" && 
    problem.status !== "SOLVED_OPEN_FOR_IMPROVEMENT" && 
    !isAlreadyClaimed;
  const structuredTreeRoots = buildHierarchyTree(attempts);

  const tabs: { id: TabType; label: string }[] = [
    { id: "blueprint", label: "Problem Blueprint" },
    { id: "subtasks", label: "Sub-problems" },
    { id: "tree", label: `Solution Tree${attempts.length > 0 ? ` (${attempts.length})` : ""}` },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10">

      {/* Modal — rendered via Portal, escapes all stacking contexts */}
      {modalNode && (
        <AttemptDetailModal
          node={modalNode}
          flatAttemptsList={attempts}
          isAlreadyClaimed={isAlreadyClaimed}
          isUnavailable={isUnavailable}
          claiming={claiming}
          onClaimCall={handleClaim}
          onClose={() => setModalNode(null)}
        />
      )}

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <Link href="/solver/dashboard" className="text-sm text-gray-600 hover:text-accent mb-4 inline-flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>

          <div className="flex items-start justify-between mt-2">
            <h1 className="text-3xl font-bold text-gray-900 leading-tight flex-1 min-w-0 pr-4">
              {problem.title}
            </h1>
            <div className="flex-shrink-0">
              {isAlreadyClaimed ? (
                <Link
                  href={`/solver/problem/${problemId}/work`}
                  className="px-6 py-2.5 bg-secondary hover:bg-accent text-white rounded-lg font-medium transition-colors shadow-sm inline-block"
                >
                  Continue Working →
                </Link>
              ) : isUnavailable ? (
                <span className="px-6 py-2.5 bg-gray-200 text-gray-500 rounded-lg font-medium cursor-not-allowed inline-block">
                  Not Available
                </span>
              ) : (
                <button
                  onClick={() => handleClaim()}
                  disabled={claiming}
                  className="px-6 py-2.5 bg-secondary hover:bg-accent text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {claiming ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Claiming…</>
                  ) : "Claim Problem"}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap mt-4">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${STATUS_COLORS[problem.status] || STATUS_COLORS.OPEN}`}>
              {problem.status.replace("_", " ")}
            </span>
            <span className="inline-flex items-center px-3 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-medium border border-accent/20">
              {problem.requiredCourse}
            </span>
            <span className="inline-flex items-center text-sm text-gray-600 font-medium">
              {problem.subtasks.length} Sub-tasks
            </span>
            <span className="inline-flex items-center text-sm text-gray-600">{problem.organizationName}</span>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}
        </div>

        {/* Tab navigation */}
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

      {/* ── Page body ─────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">

        {/* Active claim banner */}
        {isAlreadyClaimed && (
          <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
              <p className="text-sm font-medium text-secondary">You have an active claim on this problem.</p>
            </div>
            <Link href={`/solver/problem/${problemId}/work`} className="text-sm font-semibold text-secondary hover:text-accent transition-colors">
              Go to workspace →
            </Link>
          </div>
        )}

        {/* ── Tab: Problem Blueprint ── */}
        {activeTab === "blueprint" && (
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
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Constraints</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-800 leading-relaxed">{problem.constraints}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: AI Sub-problems ── */}
        {activeTab === "subtasks" && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              AI-Decomposed Sub-problems
            </h2>
            <div className="grid gap-4">
              {problem.subtasks.map((subtask, index) => (
                <div key={subtask.id} className="bg-gradient-to-r from-accent/5 to-secondary/5 rounded-lg p-5 border border-gray-200">
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
        )}

        {/* ── Tab: Solution Tree ── */}
        {activeTab === "tree" && (
          <>
            {attempts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No attempts yet</h3>
                <p className="text-gray-600">Be the first to claim and solve this problem.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Solution Evolution Tree</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Each node is a solution attempt. Forked nodes branch downward from their parent — click <strong>View</strong> on any card to see details and before/after comparisons.
                  </p>
                </div>
                <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-4">
                  <SolutionFamilyTree
                    roots={structuredTreeRoots}
                    flatAttemptsList={attempts}
                    isAlreadyClaimed={isAlreadyClaimed}
                    isUnavailable={isUnavailable}
                    claiming={claiming}
                    onClaimCall={handleClaim}
                    onViewAttempt={(node) => setModalNode(node)}
                  />
                </div>
              </div>
            )}

            {/* Claim from scratch CTA */}
            {!isAlreadyClaimed && !isUnavailable && (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Start from scratch?</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Claiming locks the problem for you. You can tackle as many sub-tasks as you want.
                  </p>
                </div>
                <button
                  onClick={() => handleClaim()}
                  disabled={claiming}
                  className="px-8 py-3 bg-secondary hover:bg-accent text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {claiming ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Claiming…</>
                  ) : "Claim New Attempt"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}