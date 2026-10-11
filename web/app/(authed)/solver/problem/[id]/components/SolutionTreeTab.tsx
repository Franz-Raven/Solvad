"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { GitFork, GitBranch, Network, ArrowRight } from "lucide-react";
import type { SolutionAttemptResponse, TreeAttemptNode } from "@/types/attempt";
import { AttemptDetailModal } from "./AttemptDetailModal";

interface SolutionTreeTabProps {
  attempts: SolutionAttemptResponse[];
  isAlreadyClaimed: boolean;
  isCompleted: boolean;
  isUnavailable: boolean;
  myProposalStatus: string | null;
  onForkRequest: (attemptId: string, subtaskId: string) => void;
  onClaimNew: () => void;
}

function buildHierarchyTree(flatList: SolutionAttemptResponse[]): TreeAttemptNode[] {
  const map: Record<string, TreeAttemptNode> = {};
  const roots: TreeAttemptNode[] = [];
  flatList.forEach((item) => {
    map[item.id] = { ...item, children: [] };
  });
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

export function SolutionTreeTab({
  attempts,
  isAlreadyClaimed,
  isCompleted,
  isUnavailable,
  myProposalStatus,
  onForkRequest,
  onClaimNew,
}: SolutionTreeTabProps) {
  const [modalNode, setModalNode] = useState<TreeAttemptNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setTick] = useState(0);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string>("ALL");
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayedSubtaskId, setDisplayedSubtaskId] = useState<string>("ALL");

  const uniqueSubtasks = useMemo(() => {
    const map = new Map<string, string>();
    attempts.forEach((a) => {
      if (a.targetSubtaskId && a.targetSubtaskTitle) {
        map.set(a.targetSubtaskId, a.targetSubtaskTitle);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [attempts]);

  const filteredAttempts = useMemo(() => {
    if (displayedSubtaskId === "ALL") return attempts;
    return attempts.filter((a) => a.targetSubtaskId === displayedSubtaskId);
  }, [attempts, displayedSubtaskId]);

  const structuredTreeRoots = buildHierarchyTree(filteredAttempts);

  const hasPendingOrApproved =
    !isCompleted &&
    (myProposalStatus === "PENDING" || myProposalStatus === "APPROVED");
  const canInteract = !isAlreadyClaimed && !isUnavailable && !hasPendingOrApproved;

  // Animate filter changes: fade out → swap → fade in
  function handleFilterChange(id: string) {
    if (id === selectedSubtaskId) return;
    setSelectedSubtaskId(id);
    setIsAnimating(true);
    setTimeout(() => {
      setDisplayedSubtaskId(id);
      setIsAnimating(false);
    }, 220);
  }

  // Force re-renders for SVG line calculations during layout shifts
  useEffect(() => {
    const t = setTimeout(() => setTick((n) => n + 1), 100);
    return () => clearTimeout(t);
  }, [filteredAttempts]);

  function renderLevel(nodes: TreeAttemptNode[]): React.ReactNode {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          gap: "32px", // Spacing between horizontal nodes
          justifyContent: "center",
        }}
      >
        {nodes.map((node) => (
          <div
            key={node.id}
            id={`tnode-${node.id}`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
              zIndex: 10,
            }}
          >
            {/* 🚀 Updated node card styling to match the unified UI */}
            <div
              className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-emerald-500/30 hover:shadow-md transition-all duration-300 select-none relative overflow-hidden"
              style={{ minWidth: "256px", maxWidth: "256px" }}
            >
              {/* Subtle hover accent block */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm leading-tight truncate group-hover:text-emerald-700 transition-colors">
                    {node.solverFirstName} {node.solverLastName}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium leading-snug truncate mt-0.5">
                    {node.degreeProgram}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold truncate mt-1">
                    {node.institution}
                  </p>
                </div>
                
                <span
                  className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                    node.status === "COMPLETED" || node.status === "SOLVED_OPEN_FOR_IMPROVEMENT"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : node.status === "ABANDONED" || node.status === "TERMINATED"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {node.status.replace(/_/g, " ")}
                </span>
              </div>

              {node.parentAttemptId && (
                <div className="flex items-center mt-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-md truncate max-w-full">
                    <GitBranch className="w-3 h-3 text-slate-400" />
                    Forked: {node.parentAttemptName}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between mt-3 mb-4 text-[10px] font-bold text-slate-400">
                <p>
                  {new Date(node.claimedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p>
                  {node.submissions.filter((s) => s.status === "SUBMITTED").length} / {node.submissions.length} SUBMISSIONS
                </p>
              </div>

              <div className="flex items-center gap-2 mt-auto">
                {node.status === "COMPLETED" && canInteract && (
                  <button
                    onClick={() => onForkRequest(node.id, node.targetSubtaskId!)}
                    className="flex-1 py-1.5 bg-accent/10 hover:bg-accent text-accent hover:text-white text-[11px] font-bold rounded-lg transition-all border border-accent/20 cursor-pointer shadow-sm group-hover:scale-[1.02]"
                  >
                    Build Upon ➔
                  </button>
                )}
                <button
                  onClick={() => setModalNode(node)}
                  className={`py-1.5 text-[11px] font-bold text-slate-600 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer ${
                    node.status === "COMPLETED" && canInteract ? 'px-3' : 'flex-1 group-hover:scale-[1.02] shadow-sm'
                  }`}
                >
                  View Details
                </button>
              </div>
            </div>

            {node.children.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 2, height: 40, background: "#e2e8f0" }} />
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
          const childWrappers = node.children
            .map((c) => {
              const el = containerRef.current!.querySelector(`#tnode-${c.id}`) as HTMLElement;
              return el ? (el.children[0] as HTMLElement) : null;
            })
            .filter(Boolean) as HTMLElement[];

          if (childWrappers.length < 2) { walk(node.children); return; }

          const childRects = childWrappers.map((el) => el.getBoundingClientRect());
          const parentWrapper = containerRef.current!.querySelector(`#tnode-${node.id}`) as HTMLElement;
          const parentCard = parentWrapper ? (parentWrapper.children[0] as HTMLElement) : null;
          if (!parentCard) { walk(node.children); return; }

          const scroll = { x: containerRef.current!.scrollLeft, y: containerRef.current!.scrollTop };
          const pRect = parentCard.getBoundingClientRect();
          const toL = (r: DOMRect) => ({
            cx: r.left + r.width / 2 - containerRect.left + scroll.x,
            top: r.top - containerRect.top + scroll.y,
            bottom: r.bottom - containerRect.top + scroll.y,
          });

          const p = toL(pRect);
          const cs = childRects.map(toL);
          const barY = p.bottom + 20; // Matches the height of the parent drop line

          lines.push(
            // 🚀 Polished SVG lines
            <g key={`conn-${node.id}`} stroke="#e2e8f0" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              {/* Vertical line down from parent */}
              <line x1={p.cx} y1={p.bottom} x2={p.cx} y2={barY} />
              {/* Horizontal bridge connecting children */}
              <line x1={Math.min(...cs.map((c) => c.cx))} y1={barY} x2={Math.max(...cs.map((c) => c.cx))} y2={barY} />
              {/* Vertical lines dropping down into children */}
              {cs.map((c, i) => <line key={i} x1={c.cx} y1={barY} x2={c.cx} y2={c.top - 20} />)}
            </g>
          );
        }
        walk(node.children);
      });
    }

    walk(nodes);
    return lines;
  }

  const svgLines = buildConnectorLines(structuredTreeRoots);

  return (
    <>
      <style>{`
        /* Tree viewport — fixed height, no resize */
        .tree-viewport {
          min-height: 480px;
          max-height: 600px;
          overflow: auto;
          position: relative;
          border-radius: 16px;
          background-color: #f8fafc;
          background-image: radial-gradient(#e2e8f0 1.5px, transparent 1.5px);
          background-size: 24px 24px;
          border: 1px solid #f1f5f9;
          box-shadow: inset 0 2px 12px rgba(0,0,0,0.02);
        }

        /* Fade animation for tree content */
        .tree-content {
          transition: opacity 0.3s ease;
        }
        .tree-content.exiting {
          opacity: 0;
        }
        .tree-content.entering {
          opacity: 1;
        }

        /* Section header */
        .tree-section-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        /* Empty state inside viewport */
        .tree-empty {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
      `}</style>

      {modalNode && (
        <AttemptDetailModal
          node={modalNode}
          flatAttemptsList={attempts}
          isAlreadyClaimed={isAlreadyClaimed}
          isUnavailable={isUnavailable || hasPendingOrApproved}
          onForkRequest={(id, subtaskId) => {
            setModalNode(null);
            onForkRequest(id, subtaskId);
          }}
          onClose={() => setModalNode(null)}
        />
      )}

      {/* 🚀 Main Fade-In Mount */}
      <div className="animate-in fade-in duration-500">
        {attempts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-12 text-center mt-4">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Network className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No attempts yet</h3>
            <p className="text-slate-500 font-medium text-sm mb-6 max-w-sm mx-auto">
              Be the first to claim and solve this problem. Your solution will become the root of this tree.
            </p>
            {canInteract && (
              <button
                onClick={onClaimNew}
                className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
              >
                Submit a Proposal <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-6 md:p-8">
            {/* Header row */}
            <div className="tree-section-header">
              <div style={{ flex: 1 }}>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-xl text-slate-500 border border-slate-200">
                    <Network className="w-5 h-5" />
                  </div>
                  Solution Evolution Tree
                </h2>
                <p className="text-sm font-medium text-slate-500 mt-2">
                  Each node is a solution attempt. Forked nodes branch downward — click <strong className="text-slate-700">View Details</strong> to see comparisons.
                </p>
              </div>

              {/* Filter Dropdown */}
              {uniqueSubtasks.length > 1 && (
                <div className="flex flex-col md:flex-row md:items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                  <label htmlFor="subtask-filter" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    Filter Tree:
                  </label>
                  <div className="relative">
                    <select
                      id="subtask-filter"
                      value={selectedSubtaskId}
                      onChange={(e) => handleFilterChange(e.target.value)}
                      className="appearance-none bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent block w-full pl-4 pr-10 py-2.5 outline-none transition-all cursor-pointer shadow-sm hover:border-slate-300"
                      style={{ minWidth: "220px", maxWidth: "100%" }}
                    >
                      <option value="ALL">All Sub-problems</option>
                      {uniqueSubtasks.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.title}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Fixed-height tree viewport */}
            <div className="tree-viewport" ref={containerRef}>
              <div
                className={`tree-content ${isAnimating ? "exiting" : "entering"}`}
                style={{
                  padding: "48px 64px 80px 64px",
                  position: "relative",
                  zIndex: 1,
                  minWidth: "max-content",
                  display: "inline-block",
                }}
              >
                {filteredAttempts.length === 0 ? (
                  <div className="tree-empty" style={{ minWidth: "100%", position: "absolute", inset: 0 }}>
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                      <GitFork className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-500 font-bold mt-2">No attempts match this filter.</p>
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
                          overflow: "visible",
                        }}
                      >
                        {svgLines}
                      </svg>
                    )}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      {renderLevel(structuredTreeRoots)}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Claim from scratch CTA */}
        {canInteract && attempts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 mt-6">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Start from scratch?</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Submit a fresh proposal without building on an existing solution.
              </p>
            </div>
            <button
              onClick={onClaimNew}
              className="w-full md:w-auto px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              Submit New Proposal <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Pending banner */}
        {hasPendingOrApproved && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4 mt-6 shadow-sm">
            <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse mt-1.5 flex-shrink-0" />
            <div>
              <p className="text-base font-bold text-amber-900">
                {myProposalStatus === "PENDING"
                  ? "Your proposal is pending review"
                  : "Your proposal has been approved"}
              </p>
              <p className="text-sm font-medium text-amber-700 mt-1.5">
                {myProposalStatus === "PENDING"
                  ? "The Seeker will review your proposed approach. Fork and claim buttons are hidden until a decision is made."
                  : "Your workspace is being prepared. Please check your dashboard."}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}