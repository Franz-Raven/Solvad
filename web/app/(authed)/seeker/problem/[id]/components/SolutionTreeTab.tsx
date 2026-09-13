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

// 🚀 FIX: Enhanced auto-linker that catches raw URLs (e.g., www.github.com)
const renderWithLinks = (text?: string | null) => {
  if (!text) return "No narrative provided.";
  const urlRegex = /((?:https?:\/\/)?(?:www\.)?github\.com\/[^\s]+|https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) => {
    if (urlRegex.test(part)) {
      const href = part.startsWith("http") ? part : `https://${part}`;
      return (
        <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-800 font-bold underline underline-offset-2 break-all transition-colors" onClick={(e) => e.stopPropagation()}>
          {part}
        </a>
      );
    }
    return part;
  });
};

const getFilenameFromUrl = (url: string) => {
  try { return decodeURIComponent(url).split("/").pop() || "Attachment"; } 
  catch { return "Attachment"; }
};

// 🚀 FIX: Safely ensure links route externally even if 'https://' is omitted
const sanitizeUrl = (url: string) => {
  if (!url) return "#";
  return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
};

// 🚀 FIX: Aggressive Smart Scraper to find the GitHub link no matter what the backend named the field
const extractRepoUrl = (obj: any): string | null => {
  if (!obj) return null;
  // 1. Check standard likely property names
  const possibleKeys = ['githubUrl', 'githubLink', 'repositoryUrl', 'repoUrl', 'github', 'githubRepo', 'repositoryLink', 'sourceCodeUrl'];
  for (const key of possibleKeys) {
    if (typeof obj[key] === 'string' && obj[key].trim() !== '') return obj[key];
  }
  // 2. Fallback: Deep scan any string property containing 'github.com'
  for (const key in obj) {
    if (typeof obj[key] === 'string' && obj[key].toLowerCase().includes('github.com')) return obj[key];
  }
  return null;
};

const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

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
  const parentRec = node.parentAttemptId ? flatAttemptsList.find((a) => a.id === node.parentAttemptId) : null;
  const [activeSubIdx, setActiveSubIdx] = useState(0);
  const [viewPanel, setViewPanel] = useState<"current" | "previous">("current");

  // 🚀 FIX: Fallback to empty array to prevent fatal crashes if node.submissions is undefined
  const safeSubmissions = node.submissions || [];
  const activeSub = safeSubmissions[activeSubIdx] ?? null;
  const predecessorSub = activeSub && parentRec ? (parentRec.submissions || []).find((ps) => ps.subtaskId === activeSub.subtaskId) : null;

  const isConfidential = activeSub?.status === "DRAFT" || activeSub?.description?.includes("Confidential Workspace");

  const educationInfo = [node.degreeProgram, node.institution].filter(Boolean).join(" · ");
  const initials = `${node.solverFirstName?.[0] || ""}${node.solverLastName?.[0] || ""}`.toUpperCase() || "S";
  const submittedCount = safeSubmissions.filter((s) => s.status === "SUBMITTED").length;

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

  // Extract GitHub Links Aggressively
  const currentGithub = extractRepoUrl(activeSub) || extractRepoUrl(node);
  const prevGithub = predecessorSub ? extractRepoUrl(predecessorSub) : (parentRec ? extractRepoUrl(parentRec) : null);

  return (
    <Portal>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
          
          <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-3.5 min-w-0">
              {node.profilePictureUrl ? (
                <img src={node.profilePictureUrl} alt="" className="w-11 h-11 rounded-2xl object-cover ring-1 ring-slate-200 shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white font-semibold text-sm flex items-center justify-center shrink-0 shadow-sm">{initials}</div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-900 truncate">{node.solverFirstName} {node.solverLastName}</h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                    node.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : node.status === "ABANDONED" || node.status === "TERMINATED" ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {node.status}
                  </span>
                </div>

                {educationInfo && <p className="text-xs text-slate-500 truncate mt-0.5">{educationInfo}</p>}

                <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {attemptDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium text-slate-600"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {submittedCount} of {safeSubmissions.length} completed</span>
                  {node.parentAttemptId && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-blue-600 font-medium truncate"><GitFork className="w-3.5 h-3.5" /> from {node.parentSolverName || "Original"}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {safeSubmissions.length > 0 && (
            <div className="px-6 pt-5 pb-4 border-b border-slate-100 overflow-x-auto flex gap-3 no-scrollbar items-stretch bg-slate-50/30">
              {safeSubmissions.map((sub, idx) => {
                const isActive = activeSubIdx === idx;
                const isSubmitted = sub.status === "SUBMITTED";
                
                return (
                  <button key={sub.id} onClick={() => setActiveSubIdx(idx)} className={`flex items-start p-4 rounded-2xl transition-all border text-left shrink-0 w-[280px] sm:w-[340px] ${isActive ? "bg-white border-slate-900 shadow-sm ring-1 ring-slate-900/5" : "bg-slate-50/80 border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-sm"}`}>
                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 mr-3 ${isSubmitted ? "bg-emerald-500" : "bg-amber-500"}`} />
                    <div className="flex flex-col gap-3 flex-1 min-w-0">
                      <span className={`text-sm leading-snug ${isActive ? "text-slate-900 font-semibold" : "text-slate-600 font-medium"}`}>{sub.subtaskTitle}</span>
                      <div className="flex">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ${isActive ? isSubmitted ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                          {sub.status}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="p-6 overflow-y-auto flex-1 bg-white">
            {!activeSub ? (
              <div className="py-12 text-center text-slate-400 text-sm">No subtask selected.</div>
            ) : isConfidential ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-10 flex flex-col items-center text-center mt-2">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 mb-4"><Lock className="w-6 h-6" /></div>
                <h3 className="text-base font-semibold text-slate-900">Workspace in Draft Mode</h3>
                <p className="text-sm text-slate-500 max-w-sm mt-2 leading-relaxed">The solver is currently drafting their solution. The narrative and project attachments will become visible once the solver finalizes and locks this module.</p>
                <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200/50 text-slate-600 text-xs font-medium"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Protected by privacy policy</div>
              </div>
            ) : (
              <div className="space-y-5">
                
                {activeSub.deltaDescription && (
                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
                    <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5"><GitFork className="w-3.5 h-3.5" /> What changed from original solution</p>
                    <p className="text-sm text-blue-900/90 leading-relaxed break-words">{renderWithLinks(activeSub.deltaDescription)}</p>
                  </div>
                )}

                {predecessorSub && (
                  <div className="flex items-center p-1 bg-slate-100/80 rounded-xl w-fit">
                    <button onClick={() => setViewPanel("current")} className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${viewPanel === "current" ? "bg-white text-slate-900 shadow-sm border border-slate-200/60" : "text-slate-500 hover:text-slate-800"}`}>Current Solution</button>
                    <button onClick={() => setViewPanel("previous")} className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${viewPanel === "previous" ? "bg-white text-slate-900 shadow-sm border border-slate-200/60" : "text-slate-500 hover:text-slate-800"}`}><History className="w-3.5 h-3.5" /> {node.parentSolverName ? `Original (${node.parentSolverName})` : "Original Solution"}</button>
                  </div>
                )}

                <div key={viewPanel} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {viewPanel === "current" ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">{predecessorSub ? `${node.solverFirstName}'s Modified Narrative` : "Submitted Narrative"}</p>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{renderWithLinks(activeSub.description)}</p>

                      {currentGithub && (
                        <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Project Repository</p>
                          <a href={sanitizeUrl(currentGithub)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl text-sm font-semibold text-white hover:bg-slate-800 hover:shadow-md transition-all group">
                            <div className="p-1.5 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors"><GithubIcon className="w-4 h-4" /></div>
                            <span className="truncate flex-1">{currentGithub}</span>
                          </a>
                        </div>
                      )}

                      {activeSub.fileUrls && activeSub.fileUrls.length > 0 && (
                        <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Attachments</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {activeSub.fileUrls.map((url, idx) => {
                              const isGithub = url.toLowerCase().includes("github.com");
                              return (
                                <a key={idx} href={sanitizeUrl(url)} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 p-3 border rounded-xl text-xs font-semibold transition-all group ${isGithub ? 'bg-slate-900 border-slate-900 text-white hover:shadow-md hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-sm'}`}>
                                  <div className={`p-1.5 rounded-lg border transition-colors ${isGithub ? 'bg-white/10 border-transparent group-hover:bg-white/20' : 'bg-white border-slate-200 group-hover:border-emerald-200 group-hover:text-emerald-600'}`}>
                                    {isGithub ? <GithubIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                  </div>
                                  <span className="truncate flex-1">{isGithub ? "GitHub Repository" : getFilenameFromUrl(url)}</span>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">{node.parentSolverName ? `${node.parentSolverName}'s Original Narrative` : "Original Narrative"}</p>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed opacity-90">{renderWithLinks(predecessorSub?.description)}</p>

                      {prevGithub && (
                        <div className="mt-6 pt-5 border-t border-slate-200/60 space-y-3">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Original Repository</p>
                          <a href={sanitizeUrl(prevGithub)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl text-sm font-semibold text-white hover:bg-slate-800 hover:shadow-md transition-all group opacity-90">
                            <div className="p-1.5 bg-white/10 rounded-lg"><GithubIcon className="w-4 h-4" /></div>
                            <span className="truncate flex-1">{prevGithub}</span>
                          </a>
                        </div>
                      )}

                      {predecessorSub?.fileUrls && predecessorSub.fileUrls.length > 0 && (
                        <div className="mt-6 pt-5 border-t border-slate-200/60 space-y-3">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Original Attachments</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {predecessorSub.fileUrls.map((url, idx) => {
                              const isGithub = url.toLowerCase().includes("github.com");
                              return (
                                <a key={idx} href={sanitizeUrl(url)} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 p-3 border rounded-xl text-xs font-semibold transition-all opacity-90 ${isGithub ? 'bg-slate-900 border-slate-900 text-white hover:opacity-100' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'}`}>
                                  <div className={`p-1.5 rounded-lg border ${isGithub ? 'bg-white/10 border-transparent' : 'bg-slate-50 border-slate-100'}`}>
                                    {isGithub ? <GithubIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                  </div>
                                  <span className="truncate flex-1">{isGithub ? "GitHub Repository" : getFilenameFromUrl(url)}</span>
                                </a>
                              );
                            })}
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
  const safeSubmissions = node.submissions || [];
  return (
    <div className={`attempt-card bg-white border rounded-xl p-4 transition-all w-56 select-none ${isHighlighted ? "border-4 border-emerald-500 ring-8 ring-emerald-500/20 scale-110 bg-emerald-50/50 shadow-[0_10px_40px_-10px] shadow-emerald-500/40 z-50 relative -translate-y-2" : "border-slate-200 shadow-sm hover:border-emerald-500/40 hover:shadow-md"}`} style={{ minWidth: "224px", maxWidth: "224px" }}>
      <div className="flex items-start justify-between gap-1 mb-1">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 text-sm leading-tight truncate">{node.solverFirstName} {node.solverLastName}</p>
          <p className="text-[11px] text-slate-500 leading-snug truncate">{node.degreeProgram}</p>
          <p className="text-[10px] text-slate-400 truncate">{node.institution}</p>
        </div>
        <span className={`status-badge flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md ml-1 mt-0.5 border ${node.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : (node.status === "ABANDONED" || node.status === "TERMINATED") ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
          {node.status}
        </span>
      </div>

      {node.parentAttemptId && (
        <div className="flex items-center gap-1 mt-1.5 mb-1">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-semibold rounded-md">
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7l-2 2m2-2l2 2m4 4v-4a2 2 0 00-2-2h-6" /></svg>
            Forked from {node.parentSolverName || "Original"}
          </span>
        </div>
      )}

      <p className="text-[10px] text-slate-400 mt-2 font-medium">{attemptDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
      <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{safeSubmissions.filter((s) => s.status === "SUBMITTED").length} / {safeSubmissions.length} subtasks submitted</p>

      <div className="flex items-center justify-end mt-3">
        <button onClick={(e) => { e.stopPropagation(); onViewClick(); }} className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all w-full ${isHighlighted ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900 border border-slate-200 bg-slate-50 hover:bg-slate-100"}`}>
          View Solution ↗
        </button>
      </div>
    </div>
  );
}

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

  useEffect(() => {
    const t = setTimeout(() => setTick((n) => n + 1), 100);
    return () => clearTimeout(t);
  }, [roots]);

  useEffect(() => {
    if (highlightedAttemptId && containerRef.current) {
      setTimeout(() => {
        const el = document.getElementById(`tnode-${highlightedAttemptId}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      }, 100);
    }
  }, [highlightedAttemptId, roots]);

  function renderLevel(nodes: TreeAttemptNode[]): React.ReactNode {
    return (
      <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "24px", justifyContent: "center" }}>
        {nodes.map((node) => (
          <div key={node.id} id={`tnode-${node.id}`} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <AttemptCard node={node} onViewClick={() => onViewAttempt(node)} isHighlighted={node.id === highlightedAttemptId} />
            {node.children.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 2, height: 32, background: "#cbd5e1" }} />
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
      <div className={`tree-content ${isAnimating ? "exiting" : "entering"}`} style={{ position: "relative", padding: "32px 48px 64px 48px", zIndex: 1, minWidth: "max-content", display: "inline-block" }}>
        {roots.length === 0 ? (
          <div className="tree-empty" style={{ minWidth: "100%", position: "absolute", inset: 0 }}>
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-1">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-sm text-slate-500 font-medium">No attempts for this sub-problem yet</p>
          </div>
        ) : (
          <>
            {svgLines.length > 0 && (
              <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, overflow: "visible" }}>{svgLines}</svg>
            )}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>{renderLevel(roots)}</div>
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
  const [attempts, setAttempts] = useState<SolutionAttemptResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalNode, setModalNode] = useState<TreeAttemptNode | null>(null);

  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string>("ALL");
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayedSubtaskId, setDisplayedSubtaskId] = useState<string>("ALL");

  useEffect(() => {
    getAllAttempts(problemId).then(setAttempts).catch((err: unknown) => console.error("Failed to load attempts", err)).finally(() => setLoading(false));
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
      <div className="flex items-center justify-center py-16 bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 p-16 text-center">
        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No solutions yet</h3>
        <p className="text-slate-500 mb-6 max-w-sm mx-auto font-medium">Once solvers claim this problem and begin submitting their approaches, their progress will appear here.</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .tree-viewport { min-height: 420px; max-height: 600px; overflow: auto; position: relative; border-radius: 12px; scroll-behavior: smooth; background: radial-gradient(ellipse at 20% 50%, rgba(16,185,129,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(5,150,105,0.04) 0%, transparent 60%), #fafafa; border: 1px solid #e2e8f0; }
        .tree-viewport::before { content: ''; position: absolute; inset: 0; background-image: radial-gradient(circle, #cbd5e1 1px, transparent 1px); background-size: 24px 24px; opacity: 0.5; pointer-events: none; border-radius: 12px; }
        .tree-content { transition: opacity 0.22s ease, transform 0.22s ease; }
        .tree-content.exiting { opacity: 0; transform: translateY(8px); }
        .tree-content.entering { opacity: 1; transform: translateY(0); }
        .attempt-card { transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.18s ease; }
        .attempt-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .tree-empty { position: absolute; inset: 0; display: flex; flex-direction: column; items-center; justify-content: center; gap: 8px; }
      `}</style>

      {modalNode && <AttemptDetailModal node={modalNode} flatAttemptsList={attempts} onClose={() => setModalNode(null)} />}

      <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 p-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div style={{ flex: 1 }}>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600"><GitFork className="w-5 h-5" /></div> Solution Evolution Tree</h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">{highlightedAttemptId ? "Showing located proposal source. " : "Monitor how solvers are building upon each other's solutions. "} Click <strong className="text-slate-700">View Solution</strong> to inspect their code and documentation.</p>
          </div>

          {uniqueSubtasks.length > 1 && (
            <div className="flex items-center gap-2">
              <label htmlFor="seeker-subtask-filter" className="text-sm font-bold text-slate-700 whitespace-nowrap">Filter by Sub-problem:</label>
              <div className="relative">
                <select id="seeker-subtask-filter" value={selectedSubtaskId} onChange={(e) => handleFilterChange(e.target.value)} className="appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-sm font-medium rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-3 pr-10 py-2 outline-none transition-colors cursor-pointer" style={{ minWidth: "200px", maxWidth: "300px" }}>
                  <option value="ALL">All Sub-problems</option>
                  {uniqueSubtasks.map((st) => <option key={st.id} value={st.id}>{st.title}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 mb-5 flex-wrap bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200">
          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Legend:</span>
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" /> Completed</span>
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" /> Active</span>
          <span className="inline-flex items-center gap-1.5 text-xs text-rose-700 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" /> Abandoned / Terminated</span>
          <span className="inline-flex items-center gap-1.5 text-xs text-blue-700 font-medium"><GitFork className="w-3 h-3" /> Forked attempt</span>
          <span className="ml-auto text-xs font-bold text-slate-400 uppercase tracking-wider">{filteredAttempts.length} attempt{filteredAttempts.length !== 1 ? "s" : ""}</span>
        </div>

        <SolutionFamilyTree roots={roots} onViewAttempt={(node) => setModalNode(node)} isAnimating={isAnimating} highlightedAttemptId={highlightedAttemptId} />
      </div>
    </>
  );
}