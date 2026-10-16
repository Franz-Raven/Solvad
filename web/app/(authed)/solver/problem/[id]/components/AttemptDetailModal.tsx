"use client";

import { useState, useEffect } from "react";
import { Lock, XCircle, FileText, X, GitBranch, Columns } from "lucide-react";
import Portal from "@/components/portal";
import type { TreeAttemptNode } from "@/types/attempt";

interface AttemptDetailModalProps {
  node: TreeAttemptNode;
  isAlreadyClaimed: boolean;
  isUnavailable: boolean;
  onForkRequest: (attemptId: string, subtaskId: string) => void;
  onClose: () => void;
}

export function AttemptDetailModal({
  node,
  isAlreadyClaimed,
  isUnavailable,
  onForkRequest,
  onClose,
}: AttemptDetailModalProps) {
  const attemptDate = new Date(node.claimedAt);

  const [activeSubIdx, setActiveSubIdx] = useState(0);
  
  const [viewPanel, setViewPanel] = useState<"current" | "previous" | "compare">("current");

  const activeSub = node.submissions[activeSubIdx] ?? null;

  const predecessorSub = activeSub && node.parentAttemptId ? {
    description: node.parentDescription || "No description provided.",
    fileUrls: node.parentFileUrls || []
  } : null;

  const initials = `${node.solverFirstName?.[0] || ""}${node.solverLastName?.[0] || ""}`.toUpperCase() || "S";

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
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div 
          className={`bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 transition-all duration-300 ease-out ${
            viewPanel === "compare" ? "max-w-7xl" : "max-w-3xl"
          }`}
        >
          
          {/* ── Header ── */}
          <div className="flex items-start justify-between p-5 md:p-6 border-b border-slate-100 flex-shrink-0 bg-white z-10 transition-all duration-300">
            <div className="flex items-start gap-4 flex-1 min-w-0 pr-4">
              
              {node.profilePictureUrl ? (
                <img
                  src={node.profilePictureUrl}
                  alt=""
                  className="w-12 h-12 rounded-2xl object-cover ring-1 ring-slate-200 shrink-0 transition-all"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent border border-accent/20 font-bold text-sm flex items-center justify-center shrink-0 shadow-sm transition-all">
                  {initials}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight transition-all">
                    {node.solverFirstName} {node.solverLastName}
                  </h2>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border uppercase tracking-wider ${
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
                <p className="text-xs text-slate-500 font-medium transition-all">
                  {node.degreeProgram} · {node.institution}
                </p>
                
                <div className="flex items-center gap-3 mt-3 flex-wrap transition-all">
                  {node.parentAttemptId && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
                      <GitBranch className="w-3 h-3 text-slate-400" />
                      Forked: {node.parentSolverName || "Original"}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                    {attemptDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0">
              {node.status === "COMPLETED" && !isAlreadyClaimed && !isUnavailable && (
                <button
                  onClick={() => {
                    onForkRequest(node.id, node.targetSubtaskId!);
                    onClose();
                  }}
                  className="hidden md:inline-flex px-4 py-2 bg-accent hover:bg-accent/90 text-white text-sm font-bold rounded-xl transition-all shadow-sm items-center gap-2"
                >
                  Build Upon Solution ➔
                </button>
              )}
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors bg-slate-50 border border-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── Content Area ── */}
          {node.status === "ACTIVE" || node.status === "IN_PROGRESS" || node.status === "CLAIMED" ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50/50">
              <div className="w-16 h-16 bg-white rounded-full border border-slate-100 shadow-sm flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-slate-400" />
              </div>
              <h4 className="font-bold text-slate-900 text-lg mb-1">Confidential Workspace</h4>
              <p className="text-sm text-slate-500 font-medium">The solver is actively drafting a solution.</p>
            </div>
          ) : node.status === "ABANDONED" || node.status === "TERMINATED" ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50/50">
              <div className="w-16 h-16 bg-white rounded-full border border-slate-100 shadow-sm flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-rose-400" />
              </div>
              <h4 className="font-bold text-rose-900 text-lg mb-1">Discontinued Workspace</h4>
              <p className="text-sm text-rose-700 font-medium">This attempt was discontinued and the workspace is locked.</p>
            </div>
          ) : node.submissions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50/50">
              <div className="w-16 h-16 bg-white rounded-full border border-slate-100 shadow-sm flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 text-sm font-medium">No subtask submissions found.</p>
            </div>
          ) : (
            <>
              {/* Subtask Tabs */}
              {node.submissions.length > 1 && (
                <div className="flex gap-2 px-5 md:px-6 pt-4 pb-3 border-b border-slate-100 flex-shrink-0 flex-wrap bg-slate-50/30">
                  {node.submissions.map((sub, idx) => (
                    <button
                      key={sub.id}
                      onClick={() => setActiveSubIdx(idx)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        activeSubIdx === idx
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      {sub.subtaskTitle}
                    </button>
                  ))}
                </div>
              )}

              {/* Detail Panel */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-5 md:p-6 space-y-6 bg-slate-50/30">
                {activeSub && (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                        {activeSub.subtaskTitle}
                      </h3>
                      <span className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1 bg-white border border-slate-200 text-slate-500 rounded-md uppercase tracking-wider w-fit">
                        {activeSub.status}
                      </span>
                    </div>

                    {activeSub.deltaDescription && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 shadow-sm w-full">
                        <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-2">
                          What changed from the parent solution
                        </p>
                        <p className="text-sm text-slate-700 italic font-medium leading-relaxed break-words">
                          "{activeSub.deltaDescription}"
                        </p>
                      </div>
                    )}

                    {predecessorSub ? (
                      <>
                        <div className="flex items-center gap-1 p-1 bg-slate-200/50 rounded-xl w-fit border border-slate-200">
                          <button
                            onClick={() => setViewPanel("current")}
                            className={`px-5 py-2 text-[13px] font-bold rounded-lg transition-all cursor-pointer ${
                              viewPanel === "current"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            }`}
                          >
                            Current Solution
                          </button>
                          <button
                            onClick={() => setViewPanel("previous")}
                            className={`px-5 py-2 text-[13px] font-bold rounded-lg transition-all cursor-pointer ${
                              viewPanel === "previous"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            }`}
                          >
                            Previous ({node.parentSolverName || "Original"})
                          </button>
                          <div className="w-px h-6 bg-slate-300 mx-1"></div>
                          <button
                            onClick={() => setViewPanel("compare")}
                            className={`px-5 py-2 text-[13px] font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                              viewPanel === "compare"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            }`}
                          >
                            <Columns className="w-4 h-4" /> Compare Side-by-Side
                          </button>
                        </div>

                        {/* 🚀 FIXED LAYOUT: Headers isolated from the scrolling content area */}
                        <div className={`transition-all duration-300 items-start ${viewPanel === "compare" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : ""}`}>
                          
                          {/* PREVIOUS/LEFT PANEL */}
                          {(viewPanel === "previous" || viewPanel === "compare") && (
                            <div className={`flex flex-col bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden animate-in fade-in duration-300 ${viewPanel === "compare" ? "opacity-90" : ""}`}>
                              
                              {/* 🚀 Header permanently fixed to top of card */}
                              <div className="p-5 md:p-6 pb-4 border-b border-slate-200/60 bg-slate-100 shrink-0">
                                <div className="flex items-center gap-2">
                                  {viewPanel === "compare" && <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-bold rounded uppercase shadow-sm">Before</span>}
                                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    {node.parentSolverName || "Original Solver"}'s Approach
                                  </p>
                                </div>
                              </div>
                              
                              {/* 🚀 Only the text container scrolls */}
                              <div className={`p-5 md:p-6 pt-4 ${viewPanel === "compare" ? "max-h-[60vh] overflow-y-auto overscroll-contain" : ""}`}>
                                <p className="text-sm text-slate-600 whitespace-pre-wrap break-words font-medium leading-relaxed">
                                  {predecessorSub.description || "No description provided."}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* CURRENT/RIGHT PANEL */}
                          {(viewPanel === "current" || viewPanel === "compare") && (
                            <div className="flex flex-col bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden animate-in fade-in duration-300">
                              
                              {/* 🚀 Header permanently fixed to top of card */}
                              <div className="p-5 md:p-6 pb-4 border-b border-slate-100 bg-white shrink-0">
                                <div className="flex items-center gap-2">
                                  {viewPanel === "compare" && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase shadow-sm">After</span>}
                                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    {node.solverFirstName}'s Approach
                                  </p>
                                </div>
                              </div>

                              {/* 🚀 Only the text container scrolls */}
                              <div className={`p-5 md:p-6 pt-4 ${viewPanel === "compare" ? "max-h-[60vh] overflow-y-auto overscroll-contain" : ""}`}>
                                <p className="text-sm text-slate-800 whitespace-pre-wrap break-words font-medium leading-relaxed">
                                  {activeSub.description || "No description provided."}
                                </p>
                              </div>
                            </div>
                          )}

                        </div>
                      </>
                    ) : (
                      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                            {node.solverFirstName}'s Approach
                        </p>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap font-medium break-words leading-relaxed">
                          {activeSub.description || "No description provided."}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {/* ── Mobile Action Footer ── */}
          {node.status === "COMPLETED" && !isAlreadyClaimed && !isUnavailable && (
            <div className="md:hidden border-t border-slate-100 p-4 bg-white">
              <button
                onClick={() => {
                  onForkRequest(node.id, node.targetSubtaskId!);
                  onClose();
                }}
                className="w-full px-4 py-3 bg-accent hover:bg-accent/90 text-white text-sm font-bold rounded-xl transition-all shadow-sm items-center justify-center gap-2 flex cursor-pointer"
              >
                Build Upon Solution ➔
              </button>
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}