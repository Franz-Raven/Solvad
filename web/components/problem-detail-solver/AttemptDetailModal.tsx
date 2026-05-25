"use client";

import { useState, useEffect } from "react";
import Portal from "@/components/portal";
import type { SolutionAttemptResponse, TreeAttemptNode } from "@/types/attempt";

interface AttemptDetailModalProps {
  node: TreeAttemptNode;
  flatAttemptsList: SolutionAttemptResponse[];
  isAlreadyClaimed: boolean;
  isUnavailable: boolean;
  onForkRequest: (attemptId: string, subtaskId: string) => void;
  onClose: () => void;
}

export function AttemptDetailModal({
  node,
  flatAttemptsList, // Keeping this as a fallback just in case
  isAlreadyClaimed,
  isUnavailable,
  onForkRequest,
  onClose,
}: AttemptDetailModalProps) {
  const attemptDate = new Date(node.claimedAt);

  const [activeSubIdx, setActiveSubIdx] = useState(0);
  const [viewPanel, setViewPanel] = useState<"current" | "previous">("current");

  const activeSub = node.submissions[activeSubIdx] ?? null;

  // FIX: Look for parent data directly inside the node (from our backend update), 
  // then fallback to searching the flat array if needed.
  const predecessorSub = activeSub
    ? node.parentSubmissions?.find((ps) => ps.subtaskId === activeSub.subtaskId) ||
      flatAttemptsList
        .find((a) => a.id === node.parentAttemptId)
        ?.submissions.find((ps) => ps.subtaskId === activeSub.subtaskId)
    : null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    setViewPanel("current");
  }, [activeSubIdx]);

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-gray-100 flex-shrink-0">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">
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
              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                {node.degreeProgram} · {node.institution}
              </p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {node.parentAttemptId && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 border border-accent/20 text-accent text-[11px] font-bold rounded-md">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7l-2 2m2-2l2 2m4 4v-4a2 2 0 00-2-2h-6" />
                    </svg>
                    Forked from {node.parentAttemptName || "Original"}
                  </span>
                )}
                <span className="text-[11px] text-gray-400 font-medium">
                  {attemptDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                <span className="text-[11px] text-gray-500 font-medium">
                  {node.submissions.filter((s) => s.status === "SUBMITTED").length} / {node.submissions.length} subtasks submitted
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {node.status === "COMPLETED" && !isAlreadyClaimed && !isUnavailable && (
                <button
                  onClick={() => {
                    onForkRequest(node.id, node.targetSubtaskId!);
                    onClose();
                  }}
                  className="px-4 py-2 bg-accent hover:bg-accent/90 text-white text-sm font-semibold rounded-lg transition-all shadow-sm"
                >
                  Submit Proposal to Fork ➔
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
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-gray-50/50">
              <svg className="w-8 h-8 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-sm font-medium">No subtask submissions yet.</p>
            </div>
          ) : (
            <>
              {/* Cleaned up Subtask Tabs (Removed circle selectors) */}
              {node.submissions.length > 1 && (
                <div className="flex gap-2 px-5 pt-4 pb-3 border-b border-gray-100 flex-shrink-0 flex-wrap bg-gray-50/30">
                  {node.submissions.map((sub, idx) => (
                    <button
                      key={sub.id}
                      onClick={() => setActiveSubIdx(idx)}
                      className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                        activeSubIdx === idx
                          ? "bg-gray-900 text-white shadow-sm"
                          : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      {sub.subtaskTitle}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-5 space-y-5 bg-gray-50/30">
                {activeSub && (
                  <>
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-gray-900 truncate tracking-tight">
                        {activeSub.subtaskTitle}
                      </h3>
                      <span className="ml-auto flex-shrink-0 text-[11px] font-bold px-2.5 py-1 bg-white border border-gray-200 text-gray-500 rounded-md uppercase tracking-wider">
                        {activeSub.status}
                      </span>
                    </div>

                    {activeSub.deltaDescription && (
                      <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 shadow-sm">
                        <p className="text-[11px] font-bold text-accent uppercase tracking-wider mb-2">
                          What changed from the parent solution
                        </p>
                        <p className="text-sm text-gray-800 italic leading-relaxed break-words">
                          "{activeSub.deltaDescription}"
                        </p>
                      </div>
                    )}

                    {predecessorSub ? (
                      <>
                        <div className="flex items-center gap-1 p-1 bg-gray-200/50 rounded-lg w-fit border border-gray-200">
                          <button
                            onClick={() => setViewPanel("current")}
                            className={`px-4 py-1.5 text-[13px] font-bold rounded-md transition-all ${
                              viewPanel === "current"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                            }`}
                          >
                            Current Solution
                          </button>
                          <button
                            onClick={() => setViewPanel("previous")}
                            className={`px-4 py-1.5 text-[13px] font-bold rounded-md transition-all ${
                              viewPanel === "previous"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                            }`}
                          >
                            Previous ({node.parentAttemptName || "Original"})
                          </button>
                        </div>

                        {viewPanel === "current" && (
                          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                              {node.solverFirstName}'s Approach
                            </p>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
                              {activeSub.description || "No description provided."}
                            </p>
                            {activeSub.fileUrls && activeSub.fileUrls.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Attached Files</p>
                                {activeSub.fileUrls.map((url: string, idx: number) => (
                                  <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent/80 hover:underline min-w-0"
                                  >
                                    📎 <span className="truncate font-medium">Modified File {idx + 1}</span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {viewPanel === "previous" && (
                          <div className="bg-gray-100 border border-gray-200 rounded-xl p-5">
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">
                              {node.parentAttemptName || "Original Solver"}'s Approach
                            </p>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap break-words leading-relaxed">
                              {predecessorSub.description || "No description provided."}
                            </p>
                            {predecessorSub.fileUrls && predecessorSub.fileUrls.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Original Files</p>
                                {predecessorSub.fileUrls.map((url: string, idx: number) => (
                                  <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 hover:underline min-w-0"
                                  >
                                    📎 <span className="truncate font-medium">Original File {idx + 1}</span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
                          {activeSub.description || "No description provided."}
                        </p>
                        {activeSub.fileUrls && activeSub.fileUrls.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                            {activeSub.fileUrls.map((url: string, idx: number) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg text-gray-600 hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all shadow-sm"
                              >
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