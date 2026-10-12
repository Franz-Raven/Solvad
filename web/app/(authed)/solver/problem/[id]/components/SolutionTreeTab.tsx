"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { GitFork, GitBranch, Network, ArrowRight, Calendar, Loader2 } from "lucide-react";
import { getProblemTree } from "../api/problem";
import { getFullAttemptDetails } from "../api/problem";
import type { SolutionAttemptSummary, SolutionAttemptResponse, TreeAttemptNode } from "@/types/attempt";
import { AttemptDetailModal } from "./AttemptDetailModal";

interface TreeAttemptNodeSummary extends SolutionAttemptSummary {
  children: TreeAttemptNodeSummary[];
}

interface SolutionTreeTabProps {
  problemId: string;
  isAlreadyClaimed: boolean;
  isCompleted: boolean;
  isUnavailable: boolean;
  myProposalStatus: string | null;
  onForkRequest: (attemptId: string, subtaskId: string) => void;
  onClaimNew: () => void;
}

function buildHierarchyTree(flatList: SolutionAttemptSummary[]): TreeAttemptNodeSummary[] {
  const map: Record<string, TreeAttemptNodeSummary> = {};
  const roots: TreeAttemptNodeSummary[] = [];
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

const TreeSkeleton = () => (
  <div className="tree-viewport flex flex-col items-center justify-start pt-12 pb-16 w-full overflow-hidden" style={{ minHeight: '480px' }}>
    {/* 🚀 Adjusted cascade delays to be much faster (0ms -> 150ms -> 300ms -> 450ms -> 600ms) */}
    <div className="node-skel w-[256px] h-[140px] bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col p-5 relative z-10" style={{ animationDelay: '0ms' }}>
      <div className="w-3/4 h-4 bg-slate-200 rounded-md animate-pulse mb-2" />
      <div className="w-1/2 h-3 bg-slate-100 rounded-md animate-pulse mb-auto" />
      <div className="flex gap-2 mt-4">
        <div className="w-full h-8 bg-slate-50 rounded-lg animate-pulse" />
        <div className="w-full h-8 bg-slate-50 rounded-lg animate-pulse" />
      </div>
    </div>
    
    <div className="line-skel w-0.5 h-8 bg-slate-200 relative z-0" style={{ animationDelay: '150ms' }} />
    <div className="expand-x w-[288px] h-0.5 bg-slate-200 relative z-0" style={{ animationDelay: '300ms' }} />
    
    <div className="flex justify-between w-[288px] relative z-0">
      <div className="line-skel w-0.5 h-8 bg-slate-200" style={{ animationDelay: '450ms' }} />
      <div className="line-skel w-0.5 h-8 bg-slate-200" style={{ animationDelay: '450ms' }} />
    </div>
    
    <div className="flex gap-[32px] relative z-10">
      <div className="node-skel w-[256px] h-[140px] bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col p-5" style={{ animationDelay: '600ms' }}>
        <div className="w-2/3 h-4 bg-slate-200 rounded-md animate-pulse mb-2" />
      </div>
      <div className="node-skel w-[256px] h-[140px] bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col p-5" style={{ animationDelay: '600ms' }}>
        <div className="w-3/4 h-4 bg-slate-200 rounded-md animate-pulse mb-2" />
      </div>
    </div>
  </div>
);

export function SolutionTreeTab({
  problemId,
  isAlreadyClaimed,
  isCompleted,
  isUnavailable,
  myProposalStatus,
  onForkRequest,
  onClaimNew,
}: SolutionTreeTabProps) {
  const [attempts, setAttempts] = useState<SolutionAttemptSummary[]>([]);
  const [isTreeReady, setIsTreeReady] = useState(false);
  
  const [modalNode, setModalNode] = useState<TreeAttemptNode | null>(null);
  const [fetchingDetailsId, setFetchingDetailsId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [, setTick] = useState(0);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string>("ALL");
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayedSubtaskId, setDisplayedSubtaskId] = useState<string>("ALL");

  useEffect(() => {
    const fetchTree = getProblemTree(problemId);
    const skeletonTimer = new Promise(resolve => setTimeout(resolve, 1200));

    Promise.all([fetchTree, skeletonTimer])
      .then(([data]) => {
        setAttempts(data as SolutionAttemptSummary[]);
        setIsTreeReady(true);
      })
      .catch(err => console.error(err));
  }, [problemId]);

  const uniqueSubtasks = useMemo(() => {
    const map = new Map<string, string>();
    attempts.forEach((a) => {
      if (a.targetSubtaskId && a.targetSubtaskTitle) map.set(a.targetSubtaskId, a.targetSubtaskTitle);
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [attempts]);

  const filteredAttempts = useMemo(() => {
    if (displayedSubtaskId === "ALL") return attempts;
    return attempts.filter((a) => a.targetSubtaskId === displayedSubtaskId);
  }, [attempts, displayedSubtaskId]);

  const structuredTreeRoots = buildHierarchyTree(filteredAttempts);

  const hasPendingOrApproved = !isCompleted && (myProposalStatus === "PENDING" || myProposalStatus === "APPROVED");
  const canInteract = !isAlreadyClaimed && !isUnavailable && !hasPendingOrApproved;

  function handleFilterChange(id: string) {
    if (id === selectedSubtaskId) return;
    setSelectedSubtaskId(id);
    setIsAnimating(true);
    setTimeout(() => {
      setDisplayedSubtaskId(id);
      setIsAnimating(false);
    }, 220);
  }

  useEffect(() => {
    const t = setTimeout(() => setTick((n) => n + 1), 100);
    return () => clearTimeout(t);
  }, [filteredAttempts, isTreeReady]);

  const handleOpenDetails = async (node: TreeAttemptNodeSummary) => {
    setFetchingDetailsId(node.id);
    try {
      const heavyAttempt = await getFullAttemptDetails(node.id);
      setModalNode({
        ...heavyAttempt,
        children: node.children as any 
      });
    } catch (error) {
      console.error("Failed to load attempt details", error);
    } finally {
      setFetchingDetailsId(null);
    }
  };

  function renderLevel(nodes: TreeAttemptNodeSummary[]): React.ReactNode {
    return (
      <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "32px", justifyContent: "center" }}>
        {nodes.map((node) => (
          <div key={node.id} id={`tnode-${node.id}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 10 }}>
            {/* 🚀 FIX: Removed all hover/group highlighting classes. It is now a static card except for the buttons. */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm select-none relative overflow-hidden animate-in fade-in zoom-in-95 duration-500" style={{ minWidth: "256px", maxWidth: "256px" }}>
              
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm leading-tight truncate">
                    {node.solverFirstName} {node.solverLastName}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium leading-snug truncate mt-0.5">
                    {node.solverDegreeProgram}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold truncate mt-1">
                    {node.solverInstitution}
                  </p>
                </div>
                
                <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                    node.status === "COMPLETED" || node.status === "SOLVED_OPEN_FOR_IMPROVEMENT" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : node.status === "ABANDONED" || node.status === "TERMINATED" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {node.status.replace(/_/g, " ")}
                </span>
              </div>

              {node.parentAttemptId && (
                <div className="flex items-center mt-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-md truncate max-w-full">
                    <GitBranch className="w-3 h-3 text-slate-400" /> Forked: {node.parentSolverName}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between mt-3 mb-4 text-[11px] font-bold text-slate-400">
                <p className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(node.claimedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>

              <div className="flex items-center gap-2 mt-auto">
                {node.status === "COMPLETED" && canInteract && (
                  <button onClick={() => onForkRequest(node.id, node.targetSubtaskId!)} className="flex-1 py-1.5 bg-accent/10 hover:bg-accent text-accent hover:text-white text-[11px] font-bold rounded-lg transition-all border border-accent/20 cursor-pointer shadow-sm active:scale-[0.98]">
                    Build Upon ➔
                  </button>
                )}
                <button 
                  onClick={() => handleOpenDetails(node)} 
                  disabled={fetchingDetailsId === node.id}
                  className={`py-1.5 text-[11px] font-bold border rounded-lg transition-all flex justify-center items-center gap-1 shadow-sm active:scale-[0.98] cursor-pointer ${
                    fetchingDetailsId === node.id ? 'bg-slate-100 text-slate-400 border-slate-200' : 'text-slate-600 border-slate-200 bg-slate-50 hover:bg-slate-100 hover:text-slate-900'
                  } ${node.status === "COMPLETED" && canInteract ? 'px-3' : 'flex-1'}`}
                >
                  {fetchingDetailsId === node.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "View Details"}
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

  function buildConnectorLines(nodes: TreeAttemptNodeSummary[]): React.ReactNode[] {
    if (!containerRef.current) return [];
    const containerRect = containerRef.current.getBoundingClientRect();
    const lines: React.ReactNode[] = [];

    function walk(nodes: TreeAttemptNodeSummary[]) {
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

          const scroll = { x: containerRef.current!.scrollLeft, y: containerRef.current!.scrollTop };
          const toL = (r: DOMRect) => ({ cx: r.left + r.width / 2 - containerRect.left + scroll.x, top: r.top - containerRect.top + scroll.y, bottom: r.bottom - containerRect.top + scroll.y });

          const p = toL(parentCard.getBoundingClientRect());
          const cs = childRects.map(toL);
          const barY = p.bottom + 20;

          lines.push(
            <g key={`conn-${node.id}`} stroke="#e2e8f0" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1={p.cx} y1={p.bottom} x2={p.cx} y2={barY} />
              <line x1={Math.min(...cs.map((c) => c.cx))} y1={barY} x2={Math.max(...cs.map((c) => c.cx))} y2={barY} />
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

  return (
    <>
      <style>{`
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
        .tree-content { transition: opacity 0.3s ease; }
        .tree-content.exiting { opacity: 0; }
        .tree-content.entering { opacity: 1; }
        .tree-section-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
        
        /* 🚀 FIX: Faster, tighter loops matching the cascade timing for a clean visual */
        @keyframes growDown {
          0%, 100% { transform: scaleY(0); opacity: 0; }
          20%, 80% { transform: scaleY(1); opacity: 1; }
        }
        @keyframes fadePop {
          0%, 100% { transform: translateY(-10px) scale(0.95); opacity: 0; }
          20%, 80% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes expandX {
          0%, 100% { transform: scaleX(0); opacity: 0;}
          20%, 80% { transform: scaleX(1); opacity: 1; }
        }
        
        /* 🚀 FIX: Changed duration to 1.5s for a snappier, repeating loop */
        .node-skel { animation: fadePop 1.5s infinite ease-in-out; opacity: 0; transform-origin: top center; }
        .line-skel { animation: growDown 1.5s infinite ease-in-out; opacity: 0; transform-origin: top center; }
        .expand-x { animation: expandX 1.5s infinite ease-in-out; opacity: 0; transform-origin: center; }
      `}</style>

      {modalNode && (
        <AttemptDetailModal
          node={modalNode}
          isAlreadyClaimed={isAlreadyClaimed}
          isUnavailable={isUnavailable || hasPendingOrApproved}
          onForkRequest={(id, subtaskId) => {
            setModalNode(null);
            onForkRequest(id, subtaskId);
          }}
          onClose={() => setModalNode(null)}
        />
      )}

      <div className="animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
        {canInteract && attempts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 transition-all hover:shadow-md">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Want to start from scratch?</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Submit a fresh proposal instead of branching off an existing solution.</p>
            </div>
            <button onClick={onClaimNew} className="w-full md:w-auto px-8 py-3 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer">
              Submit New Proposal <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        

        {isTreeReady && attempts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-12 text-center mt-4 animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Network className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No attempts yet</h3>
            <p className="text-slate-500 font-medium text-sm mb-6 max-w-sm mx-auto">Be the first to claim and solve this problem. Your solution will become the root of this tree.</p>
            {canInteract && (
              <button onClick={onClaimNew} className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer inline-flex items-center gap-2 active:scale-[0.98]">
                Submit a Proposal <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 p-6 md:p-8">
            <div className="tree-section-header">
              <div style={{ flex: 1 }}>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-xl text-slate-500 border border-slate-200"><Network className="w-5 h-5" /></div>
                  Solution Evolution Tree
                </h2>
                <p className="text-sm font-medium text-slate-500 mt-2">Each node is a solution attempt. Click <strong className="text-slate-700">View Details</strong> to load the full history.</p>
              </div>

              {uniqueSubtasks.length > 1 && (
                <div className="flex flex-col md:flex-row md:items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                  <label htmlFor="subtask-filter" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Filter Tree:</label>
                  <select id="subtask-filter" value={selectedSubtaskId} onChange={(e) => handleFilterChange(e.target.value)} className="appearance-none bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent block w-full px-4 py-2.5 outline-none cursor-pointer shadow-sm hover:border-slate-300">
                    <option value="ALL">All Sub-problems</option>
                    {uniqueSubtasks.map((st) => <option key={st.id} value={st.id}>{st.title}</option>)}
                  </select>
                </div>
              )}
            </div>

            {!isTreeReady ? (
              <div key="skeleton-view">
                <TreeSkeleton />
              </div>
            ) : (
              <div key="real-tree-view" className="tree-viewport" ref={containerRef}>
                <div className={`tree-content ${isAnimating ? "exiting" : "entering"}`} style={{ padding: "48px 64px 80px 64px", position: "relative", zIndex: 1, minWidth: "max-content", display: "inline-block" }}>
                  {buildConnectorLines(structuredTreeRoots).length > 0 && (
                    <svg className="animate-in fade-in duration-700 delay-300" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, overflow: "visible", animationFillMode: 'both' }}>
                      {buildConnectorLines(structuredTreeRoots)}
                    </svg>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
                    {renderLevel(structuredTreeRoots)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}