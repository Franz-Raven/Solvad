"use client";

import { useState, useEffect } from "react";
import Portal from "@/components/portal";
import type { SolutionAttemptResponse, TreeAttemptNode } from "@/types/attempt";

interface AttemptDetailModalProps {
  node: TreeAttemptNode;
  flatAttemptsList: SolutionAttemptResponse[];
  isAlreadyClaimed: boolean;
  isUnavailable: boolean;
  onForkRequest: (attemptId: string) => void;
  onClose: () => void;
}

export function AttemptDetailModal({
  node,
  flatAttemptsList,
  isAlreadyClaimed,
  isUnavailable,
  onForkRequest,
  onClose,
}: AttemptDetailModalProps) {
  const attemptDate = new Date(node.claimedAt);
  const parentRec = node.parentAttemptId ? flatAttemptsList.find((a) => a.id === node.parentAttemptId) : null;

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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden border border-gray-200">
          
          <div className="flex items-start justify-between p-5 border-b border-gray-100 flex-shrink-0">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900">{node.solverFirstName} {node.solverLastName}</h2>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${node.status === "COMPLETED" ? "bg-green-100 text-green-700 border-green-200" : node.status === "ABANDONED" ? "bg-red-100 text-red-700 border-red-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"}`}>
                  {node.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{node.degreeProgram} · {node.institution}</p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {node.parentAttemptId && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-semibold rounded-full">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7l-2 2m2-2l2 2m4 4v-4a2 2 0 00-2-2h-6" /></svg>
                    Forked from {node.parentAttemptName}
                  </span>
                )}
                <span className="text-[11px] text-gray-400">{attemptDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                <span className="text-[11px] text-gray-500">{node.submissions.filter((s) => s.status === "SUBMITTED").length}/{node.submissions.length} subtasks submitted</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {node.status === "COMPLETED" && !isAlreadyClaimed && !isUnavailable && (
                <button onClick={() => { onForkRequest(node.id); onClose(); }} className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white text-sm font-semibold rounded-lg transition-all border border-blue-200">
                  Submit Proposal to Fork ➔
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
                  <button key={sub.id} onClick={() => setActiveSubIdx(idx)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${activeSubIdx === idx ? "bg-accent text-white border-accent shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-900"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sub.status === "SUBMITTED" ? activeSubIdx === idx ? "bg-white" : "bg-green-500" : activeSubIdx === idx ? "bg-white/60" : "bg-gray-300"}`} />
                    {sub.subtaskTitle}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-5 space-y-4">
                {activeSub && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activeSub.status === "SUBMITTED" ? "bg-green-500" : "bg-gray-300"}`} />
                      <span className="text-sm font-semibold text-gray-800 truncate">{activeSub.subtaskTitle}</span>
                      <span className="ml-auto flex-shrink-0 text-xs px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-500 rounded-full">{activeSub.status}</span>
                    </div>

                    {activeSub.deltaDescription && (
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">What changed from the parent solution</p>
                        <p className="text-sm text-blue-900 italic leading-relaxed break-words">{activeSub.deltaDescription}</p>
                      </div>
                    )}

                    {predecessorSub ? (
                      <>
                        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit">
                          <button onClick={() => setViewPanel("current")} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewPanel === "current" ? "bg-white text-gray-900 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-800"}`}>⏭ Current Solution</button>
                          <button onClick={() => setViewPanel("previous")} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewPanel === "previous" ? "bg-white text-gray-900 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-800"}`}>⏮ Previous ({node.parentAttemptName})</button>
                        </div>
                        {viewPanel === "current" && (
                          <div className="bg-green-50/40 border border-green-100 rounded-xl p-4">
                            <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">{node.solverFirstName}'s Solution</p>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap break-words leading-relaxed">{activeSub.description || "No description provided."}</p>
                            {activeSub.fileUrls && activeSub.fileUrls.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-green-100 space-y-1.5">
                                <p className="text-xs font-bold text-green-700 uppercase">Files</p>
                                {activeSub.fileUrls.map((url: string, idx: number) => (
                                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-green-700 hover:underline min-w-0">📎 <span className="truncate">Modified File {idx + 1}</span></a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {viewPanel === "previous" && (
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{node.parentAttemptName}'s Original</p>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap break-words leading-relaxed">{predecessorSub.description || "No description provided."}</p>
                            {predecessorSub.fileUrls && predecessorSub.fileUrls.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200 space-y-1.5">
                                <p className="text-xs font-bold text-gray-400 uppercase">Files</p>
                                {predecessorSub.fileUrls.map((url: string, idx: number) => (
                                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-500 min-w-0">📎 <span className="truncate">Original File {idx + 1}</span></a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words leading-relaxed">{activeSub.description || "No description provided."}</p>
                        {activeSub.fileUrls && activeSub.fileUrls.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-2">
                            {activeSub.fileUrls.map((url: string, idx: number) => (
                              <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-blue-500 hover:border-blue-200 transition-colors">📎 File {idx + 1}</a>
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