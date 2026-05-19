"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProblemById } from "@/lib/api/problem";
import { claimProblem, getMyAttempt, getAllAttempts } from "@/lib/api/attempts";
import type { ProblemResponse } from "@/types/problem";
import type { SolutionAttemptResponse, TreeAttemptNode } from "@/types/attempt";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-500 text-white",
  CLAIMED: "bg-purple-500 text-white",
  IN_PROGRESS: "bg-yellow-500 text-white",
  SOLVED: "bg-green-500 text-white",
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

// ─── Individual attempt card ─────────────────────────────────────────────────
function AttemptCard({
  node,
  flatAttemptsList,
  isAlreadyClaimed,
  isUnavailable,
  claiming,
  onClaimCall,
  isExpanded,
  onToggle,
}: {
  node: TreeAttemptNode;
  flatAttemptsList: SolutionAttemptResponse[];
  isAlreadyClaimed: boolean;
  isUnavailable: boolean;
  claiming: boolean;
  onClaimCall: (id?: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const attemptDate = new Date(node.claimedAt);
  const parentRec = node.parentAttemptId
    ? flatAttemptsList.find((a) => a.id === node.parentAttemptId)
    : null;

  return (
    <div className="flex flex-col items-center">
      {/* ── Card ── */}
      <div
        className={`bg-white border rounded-xl p-4 transition-all shadow-sm cursor-pointer select-none w-56
          ${isExpanded
            ? "border-blue-400 ring-2 ring-blue-100 shadow-md"
            : "border-gray-200 hover:border-blue-300 hover:shadow-md"
          }`}
        style={{ minWidth: "224px", maxWidth: "224px" }}
        onClick={onToggle}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-1 mb-1">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm leading-tight truncate">
              {node.solverFirstName} {node.solverLastName}
            </p>
            <p className="text-[11px] text-gray-500 leading-snug truncate">
              {node.solverDegreeProgram}
            </p>
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

        {/* Fork badge */}
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

        {/* Subtask count */}
        <p className="text-[10px] text-gray-500 mt-1">
          {node.submissions.filter((s) => s.status === "SUBMITTED").length} / {node.submissions.length} subtasks submitted
        </p>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          {node.status === "COMPLETED" && !isAlreadyClaimed && !isUnavailable && (
            <button
              onClick={(e) => { e.stopPropagation(); onClaimCall(node.id); }}
              disabled={claiming}
              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-500 text-blue-600 hover:text-white text-[11px] font-semibold rounded-lg transition-all border border-blue-200 shadow-sm"
            >
              {claiming ? "Forking…" : "Build Upon ➔"}
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-all"
          >
            {isExpanded ? "Hide ▲" : "View ▼"}
          </button>
        </div>
      </div>

      {/* ── Expanded detail panel ── */}
      {isExpanded && node.submissions.length > 0 && (
        <div className="mt-3 w-full max-w-2xl bg-white rounded-xl border border-blue-100 shadow-md p-4 space-y-4 z-20 relative">
          {node.submissions.map((sub) => {
            const predecessorSub = parentRec
              ? parentRec.submissions.find((ps) => ps.subtaskId === sub.subtaskId)
              : null;

            return (
              <div key={sub.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50/40">
                {/* Subtask header */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      sub.status === "SUBMITTED" ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                  <span className="font-semibold text-gray-900 text-xs">{sub.subtaskTitle}</span>
                  <span className="ml-auto text-[10px] px-2 py-0.5 bg-white border border-gray-200 text-gray-500 rounded-full">
                    {sub.status}
                  </span>
                </div>

                {/* Delta note */}
                {sub.deltaDescription && (
                  <div className="mb-2 bg-blue-50 border border-blue-100 rounded-lg p-2.5">
                    <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1">
                      🔧 Technical Delta
                    </p>
                    <p className="text-[11px] text-blue-900 italic leading-relaxed">
                      "{sub.deltaDescription}"
                    </p>
                  </div>
                )}

                {/* Before / After comparison */}
                {predecessorSub ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white rounded-lg border border-gray-200 p-2.5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                        ⏮ Before ({node.parentSolverName})
                      </p>
                      <p className="text-[11px] text-gray-600 whitespace-pre-wrap leading-relaxed">
                        {predecessorSub.description || "No description provided."}
                      </p>
                      {predecessorSub.fileUrls && predecessorSub.fileUrls.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                          <p className="text-[9px] font-bold text-gray-400 uppercase">Original files:</p>
                          {predecessorSub.fileUrls.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-blue-500 truncate"
                              onClick={(e) => e.stopPropagation()}
                            >
                              📎 <span className="truncate">Original File {idx + 1}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="bg-green-50/30 rounded-lg border border-green-100 p-2.5">
                      <p className="text-[10px] font-bold text-green-700 uppercase tracking-wide mb-1.5">
                        ⏭ After (current)
                      </p>
                      <p className="text-[11px] text-gray-800 whitespace-pre-wrap leading-relaxed font-medium">
                        {sub.description || "No description provided."}
                      </p>
                      {sub.fileUrls && sub.fileUrls.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-green-100 space-y-1">
                          <p className="text-[9px] font-bold text-green-700 uppercase">Modified files:</p>
                          {sub.fileUrls.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[11px] text-green-700 hover:underline truncate"
                              onClick={(e) => e.stopPropagation()}
                            >
                              📎 <span className="truncate">Modified File {idx + 1}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-gray-700 bg-white border border-gray-200 rounded-lg p-2.5 whitespace-pre-wrap leading-relaxed">
                      {sub.description || "No description provided."}
                    </p>
                    {sub.fileUrls && sub.fileUrls.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {sub.fileUrls.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] bg-white border border-gray-200 px-2 py-1 rounded text-gray-600 hover:text-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          >
                            📎 File {idx + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Family Tree renderer ────────────────────────────────────────────────────
// Renders nodes horizontally at each level, connects them with SVG lines
// matching the "Lodge Family" style from the reference image.
function SolutionFamilyTree({
  roots,
  flatAttemptsList,
  isAlreadyClaimed,
  isUnavailable,
  claiming,
  onClaimCall,
  expandedAttempt,
  setExpandedAttempt,
}: {
  roots: TreeAttemptNode[];
  flatAttemptsList: SolutionAttemptResponse[];
  isAlreadyClaimed: boolean;
  isUnavailable: boolean;
  claiming: boolean;
  onClaimCall: (id?: string) => void;
  expandedAttempt: string | null;
  setExpandedAttempt: (id: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);

  // Re-measure after expansion / collapse so connector lines update
  useEffect(() => {
    const t = setTimeout(() => setTick((n) => n + 1), 80);
    return () => clearTimeout(t);
  }, [expandedAttempt, roots]);

  // ── Recursive card + children renderer ──────────────────────────────────
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
              flatAttemptsList={flatAttemptsList}
              isAlreadyClaimed={isAlreadyClaimed}
              isUnavailable={isUnavailable}
              claiming={claiming}
              onClaimCall={onClaimCall}
              isExpanded={expandedAttempt === node.id}
              onToggle={() => setExpandedAttempt(expandedAttempt === node.id ? null : node.id)}
            />
            {node.children.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                {/* short vertical stem down from parent card */}
                <div style={{ width: 2, height: 28, background: "#d1d5db" }} />
                {renderLevel(node.children)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // ── Compute SVG connector lines ──────────────────────────────────────────
  function buildConnectorLines(nodes: TreeAttemptNode[]): React.ReactNode[] {
    if (!containerRef.current) return [];
    const containerRect = containerRef.current.getBoundingClientRect();
    const lines: React.ReactNode[] = [];

    function walk(nodes: TreeAttemptNode[]) {
      nodes.forEach((node) => {
        if (node.children.length >= 2) {
          // Find the first child element of each tnode (the AttemptCard wrapper div)
          const childWrappers = node.children.map((c) => {
            const el = containerRef.current!.querySelector(`#tnode-${c.id}`) as HTMLElement;
            // The first div inside is the AttemptCard container
            return el ? (el.children[0] as HTMLElement) : null;
          }).filter(Boolean) as HTMLElement[];

          if (childWrappers.length < 2) { walk(node.children); return; }

          const childRects = childWrappers.map((el) => el.getBoundingClientRect());

          // Parent card
          const parentWrapper = containerRef.current!.querySelector(`#tnode-${node.id}`) as HTMLElement;
          const parentCard = parentWrapper ? (parentWrapper.children[0] as HTMLElement) : null;
          if (!parentCard) { walk(node.children); return; }
          const pRect = parentCard.getBoundingClientRect();

          const scroll = {
            x: containerRef.current!.scrollLeft,
            y: containerRef.current!.scrollTop,
          };

          const toL = (r: DOMRect) => ({
            cx: r.left + r.width / 2 - containerRect.left + scroll.x,
            top: r.top - containerRect.top + scroll.y,
            bottom: r.bottom - containerRect.top + scroll.y,
          });

          const p = toL(pRect);
          const cs = childRects.map(toL);

          const barY = p.bottom + 14; // horizontal bar sits 14px below parent card bottom
          const leftX = Math.min(...cs.map((c) => c.cx));
          const rightX = Math.max(...cs.map((c) => c.cx));

          lines.push(
            <g key={`conn-${node.id}`} stroke="#cbd5e1" strokeWidth="1.5" fill="none" strokeLinecap="round">
              {/* vertical from parent down to bar */}
              <line x1={p.cx} y1={p.bottom} x2={p.cx} y2={barY} />
              {/* horizontal bar */}
              <line x1={leftX} y1={barY} x2={rightX} y2={barY} />
              {/* verticals down to each child */}
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

  // Measure full scroll width/height of the tree
  const treeWidth = containerRef.current?.scrollWidth ?? 0;
  const treeHeight = containerRef.current?.scrollHeight ?? 0;

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", overflowX: "auto", paddingBottom: 24 }}
    >
      {/* SVG connector overlay */}
      {svgLines.length > 0 && (
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
            zIndex: 0,
            overflow: "visible",
          }}
          width={treeWidth}
          height={treeHeight}
        >
          {svgLines}
        </svg>
      )}

      {/* Tree content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minWidth: 700,
          paddingTop: 8,
          position: "relative",
          zIndex: 1,
        }}
      >
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
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);

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

      try { setAttempts(await getAllAttempts(problemId)); }
      catch (err) { console.error("Failed to load historical attempts", err); }
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
          <Link href="/solver/dashboard" className="mt-4 inline-block text-accent hover:text-secondary">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!problem) return null;

  const isAlreadyClaimed = myAttempt?.status === "ACTIVE";
  const isUnavailable = problem.status !== "OPEN" && !isAlreadyClaimed;
  const structuredTreeRoots = buildHierarchyTree(attempts);

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10">

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-8 py-6">
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
      </div>

      {/* ── Page body ─────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">

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

        {/* Problem Blueprint */}
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

        {/* AI-Decomposed Sub-problems */}
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

        {/* ── Solution Evolution Family Tree ── */}
        {attempts.length > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Solution Evolution Tree</h2>
              <p className="text-xs text-gray-500 mt-1">
                Each node is a solution attempt. Forked nodes branch downward from their parent — click any card to see details and before/after comparisons.
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
                expandedAttempt={expandedAttempt}
                setExpandedAttempt={setExpandedAttempt}
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
      </div>
    </div>
  );
}