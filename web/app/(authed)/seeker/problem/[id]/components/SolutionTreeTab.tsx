"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { getAllAttempts } from "../api/problem";
import type { SolutionAttemptResponse, TreeAttemptNode } from "@/types/attempt";
import { Lock, FileText, Calendar, CheckCircle2, GitFork, X, History } from "lucide-react";


function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted ? createPortal(children, document.body) : null;
}

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

  const isConfidential = activeSub?.status === "DRAFT" || activeSub?.description?.includes("Confidential Workspace");

  const educationInfo = [node.degreeProgram, node.institution].filter(Boolean).join(" · ");
  const initials = `${node.solverFirstName?.[0] || ""}${node.solverLastName?.[0] || ""}`.toUpperCase() || "S";
  const submittedCount = node.submissions.filter((s) => s.status === "SUBMITTED").length;

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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-3.5 min-w-0">
              {node.profilePictureUrl ? (
                <img
                  src={node.profilePictureUrl}
                  alt=""
                  className="w-11 h-11 rounded-2xl object-cover ring-1 ring-slate-200 shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white font-semibold text-sm flex items-center justify-center shrink-0 shadow-sm">
                  {initials}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-900 truncate">
                    {node.solverFirstName} {node.solverLastName}
                  </h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                    node.status === "COMPLETED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : node.status === "ABANDONED" || node.status === "TERMINATED"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {node.status}
                  </span>
                </div>

                {educationInfo && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">{educationInfo}</p>
                )}

                <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {attemptDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {submittedCount} of {node.submissions.length} completed
                  </span>
                  {node.parentAttemptId && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-blue-600 font-medium truncate">
                        <GitFork className="w-3.5 h-3.5" />
                        from {node.parentSolverName}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Subtask Switcher Tabs */}
          {node.submissions.length > 0 && (
            <div className="px-6 pt-5 pb-4 border-b border-slate-100 overflow-x-auto flex gap-3 no-scrollbar items-stretch bg-slate-50/30">
              {node.submissions.map((sub, idx) => {
                const isActive = activeSubIdx === idx;
                const isSubmitted = sub.status === "SUBMITTED";
                
                return (
                  <button
                    key={sub.id}
                    onClick={() => setActiveSubIdx(idx)}
                    className={`flex items-start p-4 rounded-2xl transition-all border text-left shrink-0 w-[280px] sm:w-[340px] ${
                      isActive
                        ? "bg-white border-slate-900 shadow-sm ring-1 ring-slate-900/5"
                        : "bg-slate-50/80 border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    {/* Status Dot aligned with text */}
                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 mr-3 ${
                      isSubmitted ? "bg-emerald-500" : "bg-amber-500"
                    }`} />
                    
                    {/* Title and Badge Column */}
                    <div className="flex flex-col gap-3 flex-1 min-w-0">
                      <span className={`text-sm leading-snug ${isActive ? "text-slate-900 font-semibold" : "text-slate-600 font-medium"}`}>
                        {sub.subtaskTitle}
                      </span>
                      
                      <div className="flex">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ${
                          isActive
                            ? isSubmitted 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}>
                          {sub.status}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Body Content */}
          <div className="p-6 overflow-y-auto flex-1 bg-white">
            {!activeSub ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No subtask selected.
              </div>
            ) : isConfidential ? (
              /* Confidential Lock Card */
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-10 flex flex-col items-center text-center mt-2">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 mb-4">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Workspace in Draft Mode
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mt-2 leading-relaxed">
                  The solver is currently drafting their solution. The narrative and project attachments will become visible once the solver finalizes and locks this module.
                </p>
                <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200/50 text-slate-600 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Protected by privacy policy
                </div>
              </div>
            ) : (
              /* Submitted Content */
              <div className="space-y-5">
                
                {/* Differential Highlight */}
                {activeSub.deltaDescription && (
                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
                    <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <GitFork className="w-3.5 h-3.5" /> What changed from original solution
                    </p>
                    <p className="text-sm text-blue-900/90 leading-relaxed break-words">
                      {activeSub.deltaDescription}
                    </p>
                  </div>
                )}

                {/* Predecessor Toggle (Sleek Segmented Control) */}
                {predecessorSub && (
                  <div className="flex items-center p-1 bg-slate-100/80 rounded-xl w-fit">
                    <button
                      onClick={() => setViewPanel("current")}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                        viewPanel === "current"
                          ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Current Solution
                    </button>
                    <button
                      onClick={() => setViewPanel("previous")}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                        viewPanel === "previous"
                          ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <History className="w-3.5 h-3.5" />
                      Original ({node.parentSolverName})
                    </button>
                  </div>
                )}

                {/* Content Viewer (Animated transition between current and previous) */}
                <div key={viewPanel} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {viewPanel === "current" ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                        {predecessorSub ? `${node.solverFirstName}'s Modified Narrative` : "Submitted Narrative"}
                      </p>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {activeSub.description || "No narrative provided."}
                      </p>

                      {activeSub.fileUrls && activeSub.fileUrls.length > 0 && (
                        <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Attachments
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {activeSub.fileUrls.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-white hover:shadow-sm transition-all group"
                              >
                                <div className="p-1.5 bg-white rounded-lg border border-slate-100 group-hover:text-blue-600 transition-colors">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <span className="truncate flex-1">Document {idx + 1}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                        {node.parentSolverName}'s Original Narrative
                      </p>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed opacity-90">
                        {predecessorSub?.description || "No narrative provided."}
                      </p>

                      {predecessorSub?.fileUrls && predecessorSub.fileUrls.length > 0 && (
                        <div className="mt-6 pt-5 border-t border-slate-200/60 space-y-3">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Original Attachments
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {predecessorSub.fileUrls.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 transition-all"
                              >
                                <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <span className="truncate flex-1">Original Document {idx + 1}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}

// ─── Read-only Attempt Card ───────────────────────────────────────────────────
function AttemptCard({
  node,
  onViewClick,
  isHighlighted
}: {
  node: TreeAttemptNode;
  onViewClick: () => void;
  isHighlighted?: boolean;
}) {
  const attemptDate = new Date(node.claimedAt);
  return (
    <div
      className={`attempt-card bg-white border rounded-xl p-4 transition-all w-56 select-none ${
        isHighlighted 
         ? "border-4 border-secondary ring-8 ring-secondary/30 scale-110 bg-secondary/10 shadow-[0_10px_40px_-10px] shadow-secondary/60 z-50 relative -translate-y-2"
          : "border-gray-200 shadow-sm hover:border-accent/40 hover:shadow-md"
      }`}
      style={{ minWidth: "224px", maxWidth: "224px" }}
    >
      <div className="flex items-start justify-between gap-1 mb-1">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm leading-tight truncate">
            {node.solverFirstName} {node.solverLastName}
          </p>
          <p className="text-[11px] text-gray-500 leading-snug truncate">{node.degreeProgram}</p>
          <p className="text-[10px] text-gray-400 truncate">{node.institution}</p>
        </div>
        <span className={`status-badge flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ml-1 mt-0.5 ${
          node.status === "COMPLETED"
            ? "bg-green-50 text-green-700 border-green-200"
            : (node.status === "ABANDONED" || node.status === "TERMINATED")
            ? "bg-red-50 text-red-700 border-red-200"
            : "bg-amber-50 text-amber-700 border-amber-200"
        }`}>
          {node.status}
        </span>
      </div>

      {node.parentAttemptId && (
        <div className="flex items-center gap-1 mt-1 mb-1">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-semibold rounded-full">
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

      <div className="flex items-center justify-end mt-3">
        <button
          onClick={(e) => { e.stopPropagation(); onViewClick(); }}
          className={`px-3 py-1 text-[11px] font-medium rounded-lg transition-all w-full ${
            isHighlighted 
              ? "bg-accent text-white hover:bg-secondary shadow-sm"
              : "text-gray-600 hover:text-gray-900 border border-gray-200 bg-gray-50 hover:bg-gray-100"
          }`}
        >
          View Solution ↗
        </button>
      </div>
    </div>
  );
}

// ─── Family Tree renderer ─────────────────────────────────────────────────────
function SolutionFamilyTree({
  roots,
  onViewAttempt,
  isAnimating,
  highlightedAttemptId
}: {
  roots: TreeAttemptNode[];
  onViewAttempt: (node: TreeAttemptNode) => void;
  isAnimating: boolean;
  highlightedAttemptId?: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setTick] = useState(0);

  // Trigger a re-render slightly after mount to ensure SVG lines calculate correctly
  useEffect(() => {
    const t = setTimeout(() => setTick((n) => n + 1), 100);
    return () => clearTimeout(t);
  }, [roots]);

  useEffect(() => {
    if (highlightedAttemptId && containerRef.current) {
      setTimeout(() => {
        const el = document.getElementById(`tnode-${highlightedAttemptId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        }
      }, 100);
    }
  }, [highlightedAttemptId, roots]);

  function renderLevel(nodes: TreeAttemptNode[]): React.ReactNode {
    return (
      <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "24px", justifyContent: "center" }}>
        {nodes.map((node) => (
          <div
            key={node.id}
            id={`tnode-${node.id}`}
            style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
          >
            <AttemptCard 
              node={node} 
              onViewClick={() => onViewAttempt(node)} 
              isHighlighted={node.id === highlightedAttemptId} 
            />
            {node.children.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 2, height: 32, background: "#d1d5db" }} />
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
          const barY = p.bottom + 16;
          const leftX = Math.min(...cs.map((c) => c.cx));
          const rightX = Math.max(...cs.map((c) => c.cx));

          lines.push(
            <g key={`conn-${node.id}`} stroke="#cbd5e1" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
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

  return (
    <div className="tree-viewport" ref={containerRef}>
      {/* 🚀 FIX: Added minWidth: max-content and inline-block to prevent the left-side cutoff bug */}
      <div 
        className={`tree-content ${isAnimating ? "exiting" : "entering"}`} 
        style={{ 
          position: "relative", 
          padding: "32px 48px 64px 48px", 
          zIndex: 1,
          minWidth: "max-content",
          display: "inline-block"
        }}
      >
        {roots.length === 0 ? (
          <div className="tree-empty" style={{ minWidth: "100%", position: "absolute", inset: 0 }}>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-1">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 font-medium">No attempts for this sub-problem yet</p>
          </div>
        ) : (
          <>
            {svgLines.length > 0 && (
              <svg
                style={{ 
                  position: "absolute", 
                  top: 0, 
                  left: 0, 
                  width: "100%", 
                  height: "100%", 
                  pointerEvents: "none", 
                  zIndex: 0, 
                  overflow: "visible" 
                }}
              >
                {svgLines}
              </svg>
            )}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
              {renderLevel(roots)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Solution Tree Tab ────────────────────────────────────────────────────────

interface SolutionTreeTabProps {
  problemId: string;
  highlightedAttemptId?: string | null;
}

export function SolutionTreeTab({ problemId, highlightedAttemptId }: SolutionTreeTabProps) {
  const [attempts, setAttempts] = useState<SolutionAttemptResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalNode, setModalNode] = useState<TreeAttemptNode | null>(null);

  // Filter & Animation States
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string>("ALL");
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayedSubtaskId, setDisplayedSubtaskId] = useState<string>("ALL");

  useEffect(() => {
    getAllAttempts(problemId)
      .then(setAttempts)
      .catch((err: unknown) => console.error("Failed to load attempts", err))
      .finally(() => setLoading(false));
  }, [problemId]);

  // Extract unique subtasks for the dropdown filter
  const uniqueSubtasks = useMemo(() => {
    const map = new Map<string, string>();
    attempts.forEach((a) => {
      if (a.targetSubtaskId && a.targetSubtaskTitle) {
        map.set(a.targetSubtaskId, a.targetSubtaskTitle);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [attempts]);

  // Apply the currently displayed filter
  const filteredAttempts = useMemo(() => {
    if (displayedSubtaskId === "ALL") return attempts;
    return attempts.filter((a) => a.targetSubtaskId === displayedSubtaskId);
  }, [attempts, displayedSubtaskId]);

  const roots = buildHierarchyTree(filteredAttempts);

  function handleFilterChange(id: string) {
    if (id === selectedSubtaskId) return;
    setSelectedSubtaskId(id);
    setIsAnimating(true);
    setTimeout(() => {
      setDisplayedSubtaskId(id);
      setIsAnimating(false);
    }, 220);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No solutions yet</h3>
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
          Once solvers claim this problem and begin submitting their approaches, their progress will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        /* Tree viewport — fixed height, no resize */
        .tree-viewport {
          min-height: 420px;
          max-height: 600px;
          overflow: auto;
          position: relative;
          border-radius: 12px;
          scroll-behavior: smooth; /* Enables smooth scrolling when locating a node */
          background: 
            radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.04) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(124,58,237,0.04) 0%, transparent 60%),
            #fafafa;
          border: 1px solid #e5e7eb;
        }

        /* Dot grid pattern */
        .tree-viewport::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, #d1d5db 1px, transparent 1px);
          background-size: 24px 24px;
          opacity: 0.5;
          pointer-events: none;
          border-radius: 12px;
        }

        /* Fade + lift animation for tree content */
        .tree-content {
          transition: opacity 0.22s ease, transform 0.22s ease;
        }
        .tree-content.exiting {
          opacity: 0;
          transform: translateY(8px);
        }
        .tree-content.entering {
          opacity: 1;
          transform: translateY(0);
        }

        /* Card hover lift */
        .attempt-card {
          transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.18s ease;
        }
        .attempt-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }

        /* Status badge pulse for IN_PROGRESS */
        .status-badge {
          letter-spacing: 0.02em;
        }

        /* Empty state inside viewport */
        .tree-empty {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
      `}</style>

      {modalNode && (
        <AttemptDetailModal
          node={modalNode}
          flatAttemptsList={attempts}
          onClose={() => setModalNode(null)}
        />
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div style={{ flex: 1 }}>
            <h2 className="text-xl font-bold text-gray-900">Solution Evolution Tree</h2>
            <p className="text-xs text-gray-500 mt-1">
              {highlightedAttemptId 
                ? "Showing located proposal source. " 
                : "Monitor how solvers are building upon each other's solutions. "}
              Click <strong className="text-gray-700">View Solution</strong> to inspect their code and documentation.
            </p>
          </div>

          {/* Filter Dropdown */}
          {uniqueSubtasks.length > 1 && (
            <div className="flex items-center gap-2">
              <label htmlFor="seeker-subtask-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Filter by Sub-problem:
              </label>
              <div className="relative">
                <select
                  id="seeker-subtask-filter"
                  value={selectedSubtaskId}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-accent focus:border-accent block w-full pl-3 pr-10 py-2 outline-none transition-colors cursor-pointer"
                  style={{ minWidth: "200px", maxWidth: "300px" }}
                >
                  <option value="ALL">All Sub-problems</option>
                  {uniqueSubtasks.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.title}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Legend:</span>
          <span className="inline-flex items-center gap-1.5 text-xs text-green-700">
            <span className="w-2.5 h-2.5 rounded-full bg-green-50 border border-green-200 inline-block" />
            Completed
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-50 border border-amber-200 inline-block" />
            Active
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-red-700">
            <span className="w-2.5 h-2.5 rounded-full bg-red-50 border border-red-200 inline-block" />
            Abandoned / Terminated
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-blue-700">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7l-2 2m2-2l2 2m4 4v-4a2 2 0 00-2-2h-6" />
            </svg>
            Forked attempt
          </span>
          <span className="ml-auto text-xs text-gray-400">
            {filteredAttempts.length} attempt{filteredAttempts.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Tree Render */}
        <SolutionFamilyTree 
          roots={roots} 
          onViewAttempt={(node) => setModalNode(node)} 
          isAnimating={isAnimating}
          highlightedAttemptId={highlightedAttemptId}
        />
      </div>
    </>
  );
}