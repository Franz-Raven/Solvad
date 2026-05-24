"use client";

import { useState, useRef, useEffect } from "react";
import type { SolutionAttemptResponse, TreeAttemptNode } from "@/types/attempt";
import { AttemptDetailModal } from "./AttemptDetailModal";

interface SolutionTreeTabProps {
  attempts: SolutionAttemptResponse[];
  isAlreadyClaimed: boolean;
  isCompleted: boolean;        // ADD
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

  const structuredTreeRoots = buildHierarchyTree(attempts);

  // A solver with a pending/approved proposal should not see fork/claim buttons
  const hasPendingOrApproved =
  !isCompleted &&
  (myProposalStatus === "PENDING" || myProposalStatus === "APPROVED");
  const canInteract = !isAlreadyClaimed && !isUnavailable && !hasPendingOrApproved;

  useEffect(() => {
    const t = setTimeout(() => setTick((n) => n + 1), 80);
    return () => clearTimeout(t);
  }, [attempts]);

  function renderLevel(nodes: TreeAttemptNode[]): React.ReactNode {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 0,
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
              padding: "0 16px",
            }}
          >
            {/* Attempt Card */}
            <div
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-accent/40 hover:shadow-md transition-all select-none"
              style={{ minWidth: "224px", maxWidth: "224px" }}
            >
              <div className="flex items-start justify-between gap-1 mb-1">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm leading-tight truncate">
                    {node.solverFirstName} {node.solverLastName}
                  </p>
                  <p className="text-[11px] text-gray-500 leading-snug truncate">
                    {node.degreeProgram}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">
                    {node.institution}
                  </p>
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
                    <svg
                      className="w-2.5 h-2.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7v8a2 2 0 002 2h6M8 7l-2 2m2-2l2 2m4 4v-4a2 2 0 00-2-2h-6"
                      />
                    </svg>
                    Forked from {node.parentAttemptName}
                  </span>
                </div>
              )}

              <p className="text-[10px] text-gray-400 mt-1">
                {new Date(node.claimedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="text-[10px] text-gray-500 mt-1">
                {node.submissions.filter((s) => s.status === "SUBMITTED").length}{" "}
                / {node.submissions.length} subtasks submitted
              </p>

              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                {/* Only show fork button if solver can interact */}
                {node.status === "COMPLETED" && canInteract && (
                  <button
                  onClick={() => onForkRequest(node.id, node.targetSubtaskId!)}
                    className="px-2.5 py-1 bg-accent/10 hover:bg-accent text-accent hover:text-white text-[11px] font-semibold rounded-lg transition-all border border-accent/20 shadow-sm"
                  >
                    Build Upon ➔
                  </button>
                )}
                <button
                  onClick={() => setModalNode(node)}
                  className="px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-all"
                >
                  View ↗
                </button>
              </div>
            </div>

            {node.children.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
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
          const childWrappers = node.children
            .map((c) => {
              const el = containerRef.current!.querySelector(
                `#tnode-${c.id}`
              ) as HTMLElement;
              return el ? (el.children[0] as HTMLElement) : null;
            })
            .filter(Boolean) as HTMLElement[];

          if (childWrappers.length < 2) {
            walk(node.children);
            return;
          }

          const childRects = childWrappers.map((el) => el.getBoundingClientRect());
          const parentWrapper = containerRef.current!.querySelector(
            `#tnode-${node.id}`
          ) as HTMLElement;
          const parentCard = parentWrapper
            ? (parentWrapper.children[0] as HTMLElement)
            : null;
          if (!parentCard) {
            walk(node.children);
            return;
          }

          const scroll = {
            x: containerRef.current!.scrollLeft,
            y: containerRef.current!.scrollTop,
          };
          const pRect = parentCard.getBoundingClientRect();
          const toL = (r: DOMRect) => ({
            cx: r.left + r.width / 2 - containerRect.left + scroll.x,
            top: r.top - containerRect.top + scroll.y,
            bottom: r.bottom - containerRect.top + scroll.y,
          });

          const p = toL(pRect);
          const cs = childRects.map(toL);
          const barY = p.bottom + 14;

          lines.push(
            <g
              key={`conn-${node.id}`}
              stroke="#cbd5e1"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            >
              <line x1={p.cx} y1={p.bottom} x2={p.cx} y2={barY} />
              <line
                x1={Math.min(...cs.map((c) => c.cx))}
                y1={barY}
                x2={Math.max(...cs.map((c) => c.cx))}
                y2={barY}
              />
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

  return (
    <>
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

      {attempts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No attempts yet</h3>
          <p className="text-gray-600 mb-6">
            Be the first to claim and solve this problem.
          </p>
          {canInteract && (
            <button
              onClick={onClaimNew}
              className="px-6 py-2.5 bg-secondary hover:bg-accent text-white font-semibold rounded-lg transition-all shadow-sm"
            >
              Submit a Proposal
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Solution Evolution Tree
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Each node is a solution attempt. Forked nodes branch downward from
              their parent — click <strong>View</strong> to see details and
              before/after comparisons.
            </p>
          </div>
          <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-4">
            <div
              ref={containerRef}
              style={{ position: "relative", overflowX: "auto", paddingBottom: 24 }}
            >
              <svg
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  pointerEvents: "none",
                  zIndex: 0,
                  overflow: "visible",
                }}
                width={containerRef.current?.scrollWidth ?? 0}
                height={containerRef.current?.scrollHeight ?? 0}
              >
                {buildConnectorLines(structuredTreeRoots)}
              </svg>
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
                {renderLevel(structuredTreeRoots)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Claim from scratch CTA — only show if solver can interact */}
      {canInteract && attempts.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Start from scratch?</h3>
            <p className="text-sm text-gray-600 mt-1">
              You can also submit a fresh proposal without building on an existing
              solution.
            </p>
          </div>
          <button
            onClick={onClaimNew}
            className="px-8 py-3 bg-secondary hover:bg-accent text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            Submit New Proposal
          </button>
        </div>
      )}

      {/* Pending banner inside the tree tab */}
      {hasPendingOrApproved && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse mt-1 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {myProposalStatus === "PENDING"
                ? "Your proposal is pending review"
                : "Your proposal has been approved"}
            </p>
            <p className="text-xs text-amber-700 mt-1">
              {myProposalStatus === "PENDING"
                ? "The Seeker will review your proposed approach. Fork and claim buttons are hidden until a decision is made."
                : "Your workspace is being prepared. Please check your dashboard."}
            </p>
          </div>
        </div>
      )}
    </>
  );
}