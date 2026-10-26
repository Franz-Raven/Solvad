"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Lock, Calendar, GitBranch, Network, ChevronDown, X,
  Loader2, Columns, FileText, XCircle, GitFork, AlertCircle
} from "lucide-react";
import Portal from "@/components/portal";
import { getProblemTree, getFullAttemptDetails } from "../api/problem";
import type { TreeAttemptNode, SolutionAttemptSummary } from "@/types/attempt";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CARD = "bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 p-6 md:p-8 animate-in fade-in duration-500";

interface TreeAttemptNodeSummary extends SolutionAttemptSummary {
  children: TreeAttemptNodeSummary[];
}

function buildHierarchyTree(flatList: SolutionAttemptSummary[]): TreeAttemptNodeSummary[] {
  const map: Record<string, TreeAttemptNodeSummary> = {};
  const roots: TreeAttemptNodeSummary[] = [];
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

const getStatusBadge = (status: string) => {
  switch (status) {
    case "COMPLETED":
    case "SOLVED_OPEN_FOR_IMPROVEMENT":
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case "ACTIVE":
    case "IN_PROGRESS":
      return "text-amber-700 bg-amber-50 border-amber-200";
    case "PENDING_REVIEW":
      return "text-blue-700 bg-blue-50 border-blue-200";
    case "ABANDONED":
    case "TERMINATED":
    case "REJECTED":
      return "text-rose-700 bg-rose-50 border-rose-200";
    default:
      return "text-slate-600 bg-slate-50 border-slate-200";
  }
};

const formatStatus = (status: string) => {
  if (status === "PENDING_REVIEW") return "PENDING REVIEW";
  return status.replace(/_/g, " ");
};

const URL_SPLIT = /((?:https?:\/\/)?(?:www\.)?github\.com\/[^\s]+|https?:\/\/[^\s]+)/g;

const renderWithLinks = (text?: string | null) => {
  if (!text) return "No narrative provided.";
  return text.split(URL_SPLIT).map((part, i) => {
    if (i % 2 === 1) {
      const href = part.startsWith("http") ? part : `https://${part}`;
      return (
        <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-bold break-all transition-colors" onClick={(e) => e.stopPropagation()}>
          {part}
        </a>
      );
    }
    return part;
  });
};

const sanitizeUrl = (url: string) => (!url ? "#" : url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`);

const extractRepoUrl = (obj: any): string | null => {
  if (!obj) return null;
  const possibleKeys = ["githubUrl", "githubLink", "repositoryUrl", "repoUrl", "github", "githubRepo", "repositoryLink", "sourceCodeUrl"];
  for (const key of possibleKeys) { if (typeof obj[key] === "string" && obj[key].trim() !== "") return obj[key]; }
  for (const key in obj) { if (typeof obj[key] === "string" && obj[key].toLowerCase().includes("github.com")) return obj[key]; }
  return null;
};

const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
);

const TREE_STYLES = `
  .tree-viewport { min-height: 480px; max-height: 600px; overflow: auto; position: relative; border-radius: 16px; background-color: #f8fafc; background-image: radial-gradient(#e2e8f0 1.5px, transparent 1.5px); background-size: 24px 24px; border: 1px solid #f1f5f9; box-shadow: inset 0 2px 12px rgba(0,0,0,0.02); }
  .tree-content { transition: opacity 0.3s ease; }
  .tree-content.exiting { opacity: 0; }
  .tree-content.entering { opacity: 1; }
  .tree-empty { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
  @keyframes growDown { 0%, 100% { transform: scaleY(0); opacity: 0; } 20%, 80% { transform: scaleY(1); opacity: 1; } }
  @keyframes fadePop { 0%, 100% { transform: translateY(-10px) scale(0.95); opacity: 0; } 20%, 80% { transform: translateY(0) scale(1); opacity: 1; } }
  @keyframes expandX { 0%, 100% { transform: scaleX(0); opacity: 0;} 20%, 80% { transform: scaleX(1); opacity: 1; } }
  .node-skel { animation: fadePop 1.5s infinite ease-in-out; opacity: 0; transform-origin: top center; }
  .line-skel { animation: growDown 1.5s infinite ease-in-out; opacity: 0; transform-origin: top center; }
  .expand-x { animation: expandX 1.5s infinite ease-in-out; opacity: 0; transform-origin: center; }
`;

const SkelNode = ({ delay, w1, w2 }: { delay: number; w1: string; w2: string }) => (
  <div className="node-skel w-[256px] h-[140px] bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col p-5 relative z-10" style={{ animationDelay: `${delay}ms` }}>
    <div className={`${w1} h-4 bg-slate-200 rounded-md animate-pulse mb-2`} />
    <div className={`${w2} h-3 bg-slate-100 rounded-md animate-pulse mb-auto`} />
    <div className="flex gap-2 mt-4"><div className="w-full h-8 bg-slate-50 rounded-lg animate-pulse" /></div>
  </div>
);

const TreeSkeleton = () => (
  <div className="tree-viewport flex flex-col items-center justify-start pt-12 pb-16 w-full overflow-hidden" style={{ minHeight: "480px" }}>
    <SkelNode delay={0} w1="w-3/4" w2="w-1/2" />
    <div className="line-skel w-0.5 h-8 bg-slate-200 relative z-0" style={{ animationDelay: "150ms" }} />
    <div className="expand-x w-[288px] h-0.5 bg-slate-200 relative z-0" style={{ animationDelay: "300ms" }} />
    <div className="flex justify-between w-[288px] relative z-0">
      <div className="line-skel w-0.5 h-8 bg-slate-200" style={{ animationDelay: "450ms" }} />
      <div className="line-skel w-0.5 h-8 bg-slate-200" style={{ animationDelay: "450ms" }} />
    </div>
    <div className="flex gap-[32px] relative z-10">
      <SkelNode delay={600} w1="w-2/3" w2="w-1/3" />
      <SkelNode delay={600} w1="w-3/4" w2="w-1/2" />
    </div>
  </div>
);

function RepoLink({ url, label, muted }: { url: string; label: string; muted?: boolean }) {
  return (
    <div className="mt-6 pt-5 border-t border-slate-100">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">{label}</p>
      <a href={sanitizeUrl(url)} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 p-3 bg-slate-900 hover:bg-slate-800 rounded-xl text-sm font-bold text-white shadow-sm hover:shadow-md transition-all min-w-0 ${muted ? "opacity-90 hover:opacity-100" : ""}`}>
        <div className="p-1.5 bg-white/10 rounded-lg flex-shrink-0"><GithubIcon className="w-4 h-4" /></div>
        <span className="truncate flex-1">{url}</span>
      </a>
    </div>
  );
}

function AttemptDetailModal({
  node,
  onClose,
}: {
  node: TreeAttemptNode;
  onClose: () => void;
}) {
  const attemptDate = new Date(node.claimedAt);
  const [activeSubIdx, setActiveSubIdx] = useState(0);
  const [viewPanel, setViewPanel] = useState<"current" | "previous" | "compare">("current");

  const subs = node.submissions || [];
  const activeSub = subs[activeSubIdx] ?? null;
  const predecessorSub = activeSub && node.parentAttemptId ? { description: node.parentDescription || "No description provided." } : null;

  const isActivelyDrafting = node.status === "ACTIVE" || node.status === "IN_PROGRESS" || node.status === "CLAIMED";
  const isDiscontinued = node.status === "ABANDONED" && !activeSub?.description;

  const educationInfo = [node.degreeProgram, node.institution].filter(Boolean).join(" · ");
  const initials = `${node.solverFirstName?.[0] || ""}${node.solverLastName?.[0] || ""}`.toUpperCase() || "S";
  const parentName = node.parentSolverName || "Original";

  const currentGithub = extractRepoUrl(activeSub) || extractRepoUrl(node);
  const prevGithub = predecessorSub ? extractRepoUrl(predecessorSub) : null;

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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className={`bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 transition-all duration-300 ease-out ${viewPanel === "compare" ? "max-w-7xl" : "max-w-3xl"}`}>
          
          <div className="flex items-start justify-between p-5 md:p-6 border-b border-slate-100 flex-shrink-0 bg-white z-10 transition-all duration-300">
            <div className="flex items-start gap-4 flex-1 min-w-0 pr-4">
              {node.profilePictureUrl ? (
                <img src={node.profilePictureUrl} alt="" className="w-12 h-12 rounded-2xl object-cover ring-1 ring-slate-200 shrink-0 transition-all" />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent border border-accent/20 font-bold text-sm flex items-center justify-center shrink-0 shadow-sm transition-all">{initials}</div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1 transition-all">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">{node.solverFirstName} {node.solverLastName}</h2>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border uppercase tracking-wider ${getStatusBadge(node.status)}`}>
                    {formatStatus(node.status)}
                  </span>
                </div>
                {educationInfo && <p className="text-xs text-slate-500 font-medium transition-all">{educationInfo}</p>}

                <div className="flex items-center gap-3 mt-3 flex-wrap transition-all">
                  {node.parentAttemptId && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
                      <GitBranch className="w-3 h-3 text-slate-400" /> Forked: {parentName}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                    {attemptDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors bg-slate-50 border border-slate-100 flex-shrink-0 cursor-pointer"><X className="w-5 h-5" /></button>
          </div>

          {isActivelyDrafting ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50/50">
              <div className="w-16 h-16 bg-white rounded-full border border-slate-100 shadow-sm flex items-center justify-center mb-4"><Lock className="w-8 h-8 text-slate-400" /></div>
              <h4 className="font-bold text-slate-900 text-lg mb-1">Confidential Workspace</h4>
              <p className="text-sm text-slate-500 font-medium">The solver is actively drafting a solution.</p>
            </div>
          ) : isDiscontinued ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50/50">
              <div className="w-16 h-16 bg-white rounded-full border border-slate-100 shadow-sm flex items-center justify-center mb-4"><XCircle className="w-8 h-8 text-rose-400" /></div>
              <h4 className="font-bold text-rose-900 text-lg mb-1">Discontinued Workspace</h4>
              <p className="text-sm text-rose-700 font-medium">This attempt was discontinued and the workspace is locked.</p>
            </div>
          ) : subs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50/50">
              <div className="w-16 h-16 bg-white rounded-full border border-slate-100 shadow-sm flex items-center justify-center mb-4"><FileText className="w-8 h-8 text-slate-300" /></div>
              <p className="text-slate-500 text-sm font-medium">No subtask submissions found.</p>
            </div>
          ) : (
            <>
              {subs.length > 1 && (
                <div className="flex gap-2 px-5 md:px-6 pt-4 pb-3 border-b border-slate-100 flex-shrink-0 overflow-x-auto no-scrollbar bg-slate-50/30">
                  {subs.map((sub, idx) => (
                    <button key={sub.id} onClick={() => setActiveSubIdx(idx)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeSubIdx === idx ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"}`}>
                      <span className={`w-2 h-2 rounded-full ${sub.status === "SUBMITTED" ? "bg-emerald-500" : "bg-amber-500"}`} />
                      {sub.subtaskTitle}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-5 md:p-6 space-y-6 bg-slate-50/30">
                {!activeSub ? (
                  <p className="py-12 text-center text-slate-500 text-sm font-medium">No subtask selected.</p>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">{activeSub.subtaskTitle}</h3>
                      <span className={`flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider w-fit ${activeSub.status === "SUBMITTED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                        {activeSub.status}
                      </span>
                    </div>

                    {(node.status === "REJECTED" || node.status === "TERMINATED") && node.rejectionReason && (
                      <div className="mb-6 bg-rose-50 border border-rose-200 shadow-sm rounded-2xl p-6 animate-in fade-in duration-300">
                        <h4 className="text-[11px] font-bold text-rose-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" /> Rejection Feedback
                        </h4>
                        <div className="text-sm text-rose-900 whitespace-pre-wrap font-medium leading-relaxed">
                          {node.rejectionReason}
                        </div>
                      </div>
                    )}

                    {activeSub.deltaDescription && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 shadow-sm w-full">
                        <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-2">What changed from the parent solution</p>
                        <p className="text-sm text-slate-700 italic font-medium leading-relaxed break-words">“{renderWithLinks(activeSub.deltaDescription)}”</p>
                      </div>
                    )}

                    {predecessorSub ? (
                      <>
                        <div className="flex items-center gap-1 p-1 bg-slate-200/50 rounded-xl w-fit border border-slate-200 max-w-full overflow-x-auto no-scrollbar">
                          <button onClick={() => setViewPanel("current")} className={`px-5 py-2 text-[13px] font-bold rounded-lg transition-all truncate cursor-pointer ${viewPanel === "current" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}>Current Solution</button>
                          <button onClick={() => setViewPanel("previous")} className={`px-5 py-2 text-[13px] font-bold rounded-lg transition-all truncate cursor-pointer ${viewPanel === "previous" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}>Previous ({parentName})</button>
                          <div className="w-px h-6 bg-slate-300 mx-1"></div>
                          <button onClick={() => setViewPanel("compare")} className={`px-5 py-2 text-[13px] font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${viewPanel === "compare" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}><Columns className="w-4 h-4" /> Compare Side-by-Side</button>
                        </div>

                        <div className={`transition-all duration-300 items-start ${viewPanel === "compare" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : ""}`}>
                          {(viewPanel === "previous" || viewPanel === "compare") && (
                            <div className={`flex flex-col bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden animate-in fade-in duration-300 ${viewPanel === "compare" ? "opacity-90" : ""}`}>
                              <div className="p-5 md:p-6 pb-4 border-b border-slate-200/60 bg-slate-100 shrink-0">
                                <div className="flex items-center gap-2">
                                  {viewPanel === "compare" && <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-bold rounded uppercase shadow-sm">Before</span>}
                                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{parentName}'s Original Narrative</p>
                                </div>
                              </div>
                              <div className={`p-5 md:p-6 pt-4 ${viewPanel === "compare" ? "max-h-[60vh] overflow-y-auto overscroll-contain" : ""}`}>
                                <p className="text-sm text-slate-600 whitespace-pre-wrap break-words font-medium leading-relaxed">{renderWithLinks(predecessorSub.description)}</p>
                                {prevGithub && <RepoLink url={prevGithub} label="Original Repository" muted />}
                              </div>
                            </div>
                          )}

                          {(viewPanel === "current" || viewPanel === "compare") && (
                            <div className="flex flex-col bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden animate-in fade-in duration-300">
                              <div className="p-5 md:p-6 pb-4 border-b border-slate-100 bg-white shrink-0">
                                <div className="flex items-center gap-2">
                                  {viewPanel === "compare" && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase shadow-sm">After</span>}
                                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{node.solverFirstName}'s Modified Narrative</p>
                                </div>
                              </div>
                              <div className={`p-5 md:p-6 pt-4 ${viewPanel === "compare" ? "max-h-[60vh] overflow-y-auto overscroll-contain" : ""}`}>
                                <p className="text-sm text-slate-800 whitespace-pre-wrap break-words font-medium leading-relaxed">{renderWithLinks(activeSub.description)}</p>
                                {currentGithub && <RepoLink url={currentGithub} label="Project Repository" />}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 animate-in fade-in duration-300">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Submitted Narrative</p>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap break-words font-medium leading-relaxed">{renderWithLinks(activeSub.description)}</p>
                        {currentGithub && <RepoLink url={currentGithub} label="Project Repository" />}
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

function AttemptCard({
  node,
  onViewClick,
  isFetching,
  isHighlighted,
}: {
  node: TreeAttemptNodeSummary;
  onViewClick: () => void;
  isFetching?: boolean;
  isHighlighted?: boolean;
}) {
  const isDisabled = isFetching;

  return (
    <div
      className={`bg-white border rounded-2xl p-5 select-none relative overflow-hidden animate-in fade-in zoom-in-95 duration-500 ${
        isHighlighted ? "border-emerald-500 ring-4 ring-emerald-500/20 shadow-lg bg-emerald-50/40" : "border-slate-200 shadow-sm"
      }`}
      style={{ minWidth: "256px", maxWidth: "256px" }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 text-sm leading-tight truncate">{node.solverFirstName} {node.solverLastName}</p>
          <p className="text-[11px] text-slate-500 font-medium leading-snug truncate mt-0.5">{node.solverDegreeProgram}</p>
          <p className="text-[10px] text-slate-400 font-bold truncate mt-1">{node.solverInstitution}</p>
        </div>
        <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getStatusBadge(node.status)}`}>
          {formatStatus(node.status)}
        </span>
      </div>

      {node.parentAttemptId && (
        <div className="flex items-center mt-2 mb-1">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-md truncate max-w-full">
            <GitBranch className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="truncate">Forked: {node.parentSolverName || "Original"}</span>
          </span>
        </div>
      )}

      <div className="flex items-center justify-between mt-3 mb-4 text-[11px] font-bold text-slate-400">
        <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(node.claimedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onViewClick(); }}
        disabled={isDisabled}
        className={`w-full flex justify-center items-center gap-2 py-1.5 text-[11px] font-bold rounded-lg border transition-all shadow-sm ${
          isDisabled
            ? "bg-slate-50 text-slate-400 border-slate-200 cursor-wait" 
            : isHighlighted
              ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 active:scale-[0.98] cursor-pointer"
              : "text-slate-600 border-slate-200 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] cursor-pointer"
        }`}
      >
        {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "View Details"}
      </button>
    </div>
  );
}

function SolutionFamilyTree({
  roots,
  onViewAttempt,
  isAnimating,
  fetchingDetailsId,
  highlightedAttemptId,
}: {
  roots: TreeAttemptNodeSummary[];
  onViewAttempt: (node: TreeAttemptNodeSummary) => void;
  isAnimating: boolean;
  fetchingDetailsId: string | null;
  highlightedAttemptId?: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setTick((n) => n + 1), 100);
    return () => clearTimeout(t);
  }, [roots]);

  useEffect(() => {
    if (!highlightedAttemptId || !containerRef.current) return;
    const t = setTimeout(() => {
      const el = document.getElementById(`tnode-${highlightedAttemptId}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }, 100);
    return () => clearTimeout(t);
  }, [highlightedAttemptId, roots]);

  function renderLevel(nodes: TreeAttemptNodeSummary[]): React.ReactNode {
    return (
      <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "32px", justifyContent: "center" }}>
        {nodes.map((node) => (
          <div key={node.id} id={`tnode-${node.id}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 10 }}>
            <AttemptCard node={node} onViewClick={() => onViewAttempt(node)} isFetching={fetchingDetailsId === node.id} isHighlighted={node.id === highlightedAttemptId} />
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

    function walk(list: TreeAttemptNodeSummary[]) {
      list.forEach((node) => {
        if (node.children.length >= 2) {
          const childCards = node.children
            .map((c) => {
              const el = containerRef.current!.querySelector(`#tnode-${c.id}`) as HTMLElement | null;
              return el ? (el.children[0] as HTMLElement) : null;
            })
            .filter(Boolean) as HTMLElement[];

          if (childCards.length < 2) { walk(node.children); return; }

          const parentWrapper = containerRef.current!.querySelector(`#tnode-${node.id}`) as HTMLElement | null;
          const parentCard = parentWrapper ? (parentWrapper.children[0] as HTMLElement) : null;
          if (!parentCard) { walk(node.children); return; }

          const scroll = { x: containerRef.current!.scrollLeft, y: containerRef.current!.scrollTop };
          const toL = (r: DOMRect) => ({ cx: r.left + r.width / 2 - containerRect.left + scroll.x, top: r.top - containerRect.top + scroll.y, bottom: r.bottom - containerRect.top + scroll.y });

          const p = toL(parentCard.getBoundingClientRect());
          const cs = childCards.map((el) => toL(el.getBoundingClientRect()));
          const barY = p.bottom + 20;

          lines.push(
            <g key={`conn-${node.id}`} stroke="#e2e8f0" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1={p.cx} y1={p.bottom} x2={p.cx} y2={barY} />
              <line x1={Math.min(...cs.map((c) => c.cx))} y1={barY} x2={Math.max(...cs.map((c) => c.cx))} y2={barY} />
              {cs.map((c, i) => <line key={i} x1={c.cx} y1={barY} x2={c.cx} y2={c.top} />)}
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
      <div className={`tree-content ${isAnimating ? "exiting" : "entering"}`} style={{ padding: "48px 64px 80px 64px", position: "relative", zIndex: 1, minWidth: "max-content", display: "inline-block" }}>
        {roots.length === 0 ? (
          <div className="tree-empty" style={{ minWidth: "100%" }}>
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm"><GitFork className="w-5 h-5 text-slate-300" /></div>
            <p className="text-sm text-slate-500 font-bold mt-2">No attempts for this sub-problem yet.</p>
          </div>
        ) : (
          <>
            {svgLines.length > 0 && (
              <svg className="animate-in fade-in duration-700 delay-300" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, overflow: "visible", animationFillMode: 'both' }}>
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

interface SolutionTreeTabProps {
  problemId: string;
  highlightedAttemptId?: string | null;
}

export function SolutionTreeTab({ problemId, highlightedAttemptId }: SolutionTreeTabProps) {
  const [attempts, setAttempts] = useState<SolutionAttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isTreeReady, setIsTreeReady] = useState(false);

  const [modalNode, setModalNode] = useState<TreeAttemptNode | null>(null);
  const [fetchingDetailsId, setFetchingDetailsId] = useState<string | null>(null);

  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string>("ALL");
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayedSubtaskId, setDisplayedSubtaskId] = useState<string>("ALL");

  const loadAttempts = () => {
    setLoading(true);
    setLoadError(false);

    const fetchTree = getProblemTree(problemId);
    const skeletonTimer = new Promise(resolve => setTimeout(resolve, 1200));

    Promise.all([fetchTree, skeletonTimer])
      .then(([data]) => { setAttempts(data as SolutionAttemptSummary[]); setIsTreeReady(true); })
      .catch((err: unknown) => { console.error("Failed to load attempts", err); setLoadError(true); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAttempts(); }, [problemId]);

  useEffect(() => {
    if (highlightedAttemptId) { setSelectedSubtaskId("ALL"); setDisplayedSubtaskId("ALL"); }
  }, [highlightedAttemptId]);

  const uniqueSubtasks = useMemo(() => {
    const map = new Map<string, string>();
    attempts.forEach((a) => { if (a.targetSubtaskId && a.targetSubtaskTitle) map.set(a.targetSubtaskId, a.targetSubtaskTitle); });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [attempts]);

  const filteredAttempts = useMemo(() => {
    if (displayedSubtaskId === "ALL") return attempts;
    return attempts.filter((a) => a.targetSubtaskId === displayedSubtaskId);
  }, [attempts, displayedSubtaskId]);

  const roots = buildHierarchyTree(filteredAttempts);

  function handleFilterChange(id: string) {
    if (id === selectedSubtaskId) return;
    setSelectedSubtaskId(id);
    setIsAnimating(true);
    setTimeout(() => { setDisplayedSubtaskId(id); setIsAnimating(false); }, 220);
  }

  const handleOpenDetails = async (node: TreeAttemptNodeSummary) => {
    setFetchingDetailsId(node.id);
    try {
      const heavyAttempt = await getFullAttemptDetails(node.id);
      setModalNode({ ...heavyAttempt, children: node.children as any });
    } catch (error) { console.error("Failed to load attempt details", error); } finally { setFetchingDetailsId(null); }
  };

  const showTreeCard = loading || (!loadError && attempts.length > 0);

  return (
    <>
      <style>{TREE_STYLES}</style>

      {modalNode && (
        <AttemptDetailModal node={modalNode} onClose={() => setModalNode(null)} />
      )}

      <div className="animate-in fade-in duration-500">
        {!showTreeCard && loadError && (
          <div className={CARD + " p-12 text-center"}>
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"><Network className="w-8 h-8 text-rose-300" /></div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Couldn't load the solution tree</h3>
            <p className="text-slate-500 font-medium text-sm mb-6 max-w-sm mx-auto">Something went wrong while fetching attempts for this problem.</p>
            <button onClick={loadAttempts} className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer">Try Again</button>
          </div>
        )}

        {!showTreeCard && !loadError && attempts.length === 0 && (
          <div className={CARD + " p-12 text-center"}>
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"><Network className="w-8 h-8 text-rose-300" /></div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No solutions yet</h3>
            <p className="text-slate-500 font-medium text-sm max-w-sm mx-auto">Once solvers claim this problem and begin submitting their approaches, their progress will appear here.</p>
          </div>
        )}

        {showTreeCard && (
          <div className={CARD}>
            <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
              <div className="flex-1 min-w-[280px]">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-xl text-slate-500 border border-slate-200"><Network className="w-5 h-5" /></div>
                  Solution Evolution Tree
                </h2>
                <p className="text-sm font-medium text-slate-500 mt-2">
                  {highlightedAttemptId ? "Showing the located proposal source. " : "Monitor how solvers are building upon each other's solutions. "}
                  Click <strong className="text-slate-700">View Details</strong> to inspect their documentation.
                </p>
              </div>

              {!loading && uniqueSubtasks.length > 1 && (
                <div className="flex flex-col md:flex-row md:items-center gap-2 w-full md:w-auto md:flex-shrink-0 mt-4 md:mt-0">
                  <label htmlFor="seeker-subtask-filter" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Filter Tree:</label>
                  <div className="relative w-full md:w-72">
                    <select
                      id="seeker-subtask-filter"
                      value={selectedSubtaskId}
                      onChange={(e) => handleFilterChange(e.target.value)}
                      className="appearance-none bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent block w-full pl-4 pr-10 py-2.5 outline-none transition-all cursor-pointer shadow-sm hover:border-slate-300 truncate"
                    >
                      <option value="ALL">All Sub-problems</option>
                      {uniqueSubtasks.map((st) => (
                        <option key={st.id} value={st.id}>{st.title}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400"><ChevronDown className="w-4 h-4" /></div>
                  </div>
                </div>
              )}
            </div>

            {!isTreeReady ? (
              <div key="skeleton-view">
                <TreeSkeleton />
              </div>
            ) : (
              <div key="real-tree-view">
                <div className="flex items-center gap-x-5 gap-y-2 mb-5 flex-wrap bg-slate-50/50 px-4 py-3 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Legend</span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed</span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-bold"><span className="w-2 h-2 rounded-full bg-amber-500" /> Active</span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-rose-700 font-bold"><span className="w-2 h-2 rounded-full bg-rose-500" /> Rejected / Abandoned / Terminated</span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-bold"><GitBranch className="w-3 h-3 text-slate-400" /> Forked attempt</span>
                  <span className="ml-auto text-[11px] font-bold px-3 py-1 bg-accent/10 text-accent uppercase tracking-wider rounded-md border border-accent/20">
                    {filteredAttempts.length} attempt{filteredAttempts.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <SolutionFamilyTree
                  roots={roots}
                  onViewAttempt={handleOpenDetails}
                  isAnimating={isAnimating}
                  fetchingDetailsId={fetchingDetailsId}
                  highlightedAttemptId={highlightedAttemptId}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}