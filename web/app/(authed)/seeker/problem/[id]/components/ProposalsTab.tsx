"use client";

import React, { useEffect, useState, useMemo } from "react";
import { evaluateProposal, getPendingProposals, getAllAttempts } from "../api/problem";
import type { ClaimRequestResponse, SolutionAttemptResponse } from "@/types/attempt";
import type { ProblemResponse } from "@/types/problem"

type SortOrder = "newest-first" | "oldest-first";

interface ProposalsTabProps {
  problem: ProblemResponse;
  onLocateInTree: (nodeId: string) => void;
}

export function ProposalsTab({ problem, onLocateInTree }: ProposalsTabProps) {
  const [proposals, setProposals] = useState<ClaimRequestResponse[]>([]);
  const [activeAttempts, setActiveAttempts] = useState<SolutionAttemptResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UX States
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest-first");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  
  // Scalability: Local pagination per subtask group
  const ITEMS_PER_PAGE = 6;
  const [visibleItems, setVisibleItems] = useState<Record<string, number>>({});

  // Modal States
  const [selectedProposal, setSelectedProposal] = useState<ClaimRequestResponse | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, [problem.id]);

  useEffect(() => {
    if (selectedProposal) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedProposal]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pendingData, attemptsData] = await Promise.all([
        getPendingProposals(problem.id),
        getAllAttempts(problem.id)
      ]);
      setProposals(pendingData);
      setActiveAttempts(attemptsData.filter((a: any) => a.status === "ACTIVE" || a.status === "IN_PROGRESS"));
      
      // Initialize pagination state
      const initialVisible: Record<string, number> = {};
      problem.subtasks.forEach(st => initialVisible[st.id] = ITEMS_PER_PAGE);
      setVisibleItems(initialVisible);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluation = async (proposalId: string, isApproved: boolean) => {
    setActionLoading(proposalId);
    try {
      await evaluateProposal(proposalId, isApproved);
      await fetchData(); 
      setSelectedProposal(null);
      setNotification({ 
        type: "success", 
        message: isApproved ? "Proposal approved and workspace created!" : "Proposal rejected successfully." 
      });
    } catch (err: any) {
      setNotification({ 
        type: "error", 
        message: `Evaluation failed: ${err.message}` 
      });
    } finally {
      setActionLoading(null);
    }
  };

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const loadMore = (groupId: string) => {
    setVisibleItems(prev => ({ ...prev, [groupId]: (prev[groupId] || ITEMS_PER_PAGE) + ITEMS_PER_PAGE }));
  };

  const getFilenameFromUrl = (url: string) => {
    try { return decodeURIComponent(url).split("/").pop() || "Attachment"; } 
    catch { return "Attachment"; }
  };

  const renderAvatar = (solver: { firstName: string; lastName: string; profilePictureUrl?: string }, id: string, size = 40) => {
    const hasImage = solver.profilePictureUrl && !imgErrors[id];
    const initials = `${solver.firstName?.charAt(0) || ""}${solver.lastName?.charAt(0) || ""}`.toUpperCase();
    const sizeClass = size === 40 ? "w-10 h-10" : "w-12 h-12";
    const textSize = size === 40 ? "text-sm" : "text-lg";

    if (hasImage) {
      return (
        <div className={`${sizeClass} rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-inner`}>
          <img src={solver.profilePictureUrl} alt={`${solver.firstName} ${solver.lastName}`} className="w-full h-full object-cover" onError={() => setImgErrors(prev => ({ ...prev, [id]: true }))} />
        </div>
      );
    }
    return (
      <div className={`${sizeClass} rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold ${textSize} shadow-inner border border-emerald-100 shrink-0`}>
        {initials}
      </div>
    );
  };

  // 🚀 FIX: Map now explicitly extracts the granular subtask capacity limit
  const groupedData = useMemo(() => {
    const sortedProposals = [...proposals].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === "newest-first" ? timeB - timeA : timeA - timeB;
    });

    const map = new Map<string, { id: string; title: string; limit: number; proposals: ClaimRequestResponse[]; activeCount: number }>();
    
    problem.subtasks.forEach(st => {
      map.set(st.id, { 
        id: st.id, 
        title: st.title, 
        limit: (st as any).maxConcurrentSolvers ?? 3, 
        proposals: [], 
        activeCount: 0 
      });
    });

    sortedProposals.forEach(p => {
      const sid = (p as any).targetSubtaskId || (p as any).subtaskId;
      if (map.has(sid)) map.get(sid)!.proposals.push(p);
    });

    activeAttempts.forEach(a => {
      if (a.targetSubtaskId && map.has(a.targetSubtaskId)) {
        map.get(a.targetSubtaskId)!.activeCount++;
      }
    });
    
    return Array.from(map.values()).filter(g => g.proposals.length > 0);
  }, [proposals, activeAttempts, sortOrder, problem.subtasks]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 p-12 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading pending requests...</p>
      </div>
    );
  }

  if (error) {
    return <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl text-center font-medium shadow-sm">{error}</div>;
  }

  if (proposals.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 p-16 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">No pending requests</h3>
        <p className="text-sm text-slate-500">When Solvers submit an approach, they will appear here for your review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header & Sorter Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Pending Requests</h2>
          <p className="text-sm text-slate-500 mt-1">Review approaches submitted by solvers.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm w-fit">
          {(["newest-first", "oldest-first"] as SortOrder[]).map((opt) => (
            <button
              key={opt}
              onClick={() => setSortOrder(opt)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                sortOrder === opt
                  ? "bg-slate-100 text-slate-900 shadow-sm"
                  : "bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {opt === "newest-first" ? "Newest" : "Oldest"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grouped Subtasks ── */}
      <div className="space-y-5">
        {groupedData.map((group) => {
          const isCollapsed = collapsedGroups.has(group.id);
          const isFull = group.activeCount >= group.limit; // 🚀 FIX: Uses specific limit
          const visibleCount = visibleItems[group.id] || ITEMS_PER_PAGE;
          const visibleProposals = group.proposals.slice(0, visibleCount);
          const hasMore = group.proposals.length > visibleCount;

          return (
            <div key={group.id} className="flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.02)] transition-colors hover:border-slate-300">
              <button 
                onClick={() => toggleGroup(group.id)}
                className="flex items-center justify-between w-full p-5 bg-slate-50/50 hover:bg-slate-50 transition-colors group/header border-b border-slate-100"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover/header:text-emerald-600 shadow-sm transition-colors shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  </div>
                  <div className="text-left flex-1 min-w-0 pr-4">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{group.title}</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                        {group.proposals.length} Request{group.proposals.length !== 1 ? 's' : ''}
                      </span>
                      {isFull && (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200">
                          Capacity Reached ({group.activeCount}/{group.limit})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${isCollapsed ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>

              {!isCollapsed && (
                <div className="p-5 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {visibleProposals.map((proposal) => {
                      const fileCount = proposal.supportingDocuments ? proposal.supportingDocuments.split(",").length : 0;
                      const parentAttemptId = (proposal as any).parentAttemptId;

                      return (
                        <div key={proposal.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all flex flex-col h-full relative group">
                          
                          {/* 🚀 FIX: Cleaner, modernized lock overlay */}
                          {isFull && (
                            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center rounded-xl p-5 text-center">
                              <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-200 mb-2 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                Capacity Full
                              </div>
                              <button onClick={() => setSelectedProposal(proposal)} className="px-4 py-2 mt-2 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
                                Review & Reject Only
                              </button>
                            </div>
                          )}

                          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                            {renderAvatar(proposal.solver, `avatar-${proposal.id}`, 40)}
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-900 truncate text-sm">{proposal.solver.firstName} {proposal.solver.lastName}</h4>
                              <p className="text-[11px] text-slate-500 truncate font-medium">{proposal.solver.institution || "Independent Solver"}</p>
                            </div>
                          </div>

                          <div className="p-4 flex-1 flex flex-col">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Approach Summary</p>
                            <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-1 leading-relaxed">{proposal.proposedApproach}</p>
                            
                            {parentAttemptId && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onLocateInTree(parentAttemptId); }}
                                className="mb-4 text-[11px] font-bold text-emerald-700 flex items-center gap-1.5 transition-colors w-fit border border-emerald-200 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 relative z-20"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7l-2 2m2-2l2 2m4 4v-4a2 2 0 00-2-2h-6" /></svg>
                                Forked Solution ➔
                              </button>
                            )}
                            
                            <div className="flex items-center gap-2 mt-auto relative z-20">
                              <span className="inline-flex items-center px-2 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                {new Date(proposal.createdAt).toLocaleDateString()}
                              </span>
                              {fileCount > 0 && (
                                <span className="inline-flex items-center px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                                  {fileCount} {fileCount === 1 ? 'File' : 'Files'}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-4 pt-0">
                            <button onClick={() => setSelectedProposal(proposal)} className="w-full py-2.5 px-4 bg-slate-50 hover:bg-emerald-600 hover:text-white text-slate-700 font-bold rounded-lg text-xs transition-all border border-slate-200 hover:border-emerald-600 relative z-20 active:scale-[0.98]">
                              Review Full Proposal
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Load More Pagination Button */}
                  {hasMore && (
                    <div className="mt-6 flex justify-center">
                      <button 
                        onClick={() => loadMore(group.id)}
                        className="px-6 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-full hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                      >
                        Load More Results
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── REVIEW MODAL ─── */}
      {selectedProposal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget && !actionLoading) setSelectedProposal(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80 rounded-t-2xl">
              <div className="flex items-center gap-4">
                {renderAvatar(selectedProposal.solver, `modal-${selectedProposal.id}`, 48)}
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedProposal.solver.firstName} {selectedProposal.solver.lastName}</h2>
                  <p className="text-sm text-slate-500 font-medium">{selectedProposal.solver.institution} • Submitted {new Date(selectedProposal.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <button onClick={() => setSelectedProposal(null)} disabled={actionLoading !== null} className="text-slate-400 hover:text-slate-700 bg-white border border-slate-200 p-2.5 rounded-full shadow-sm hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-8">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Full Proposed Approach
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {selectedProposal.proposedApproach}
                </div>
              </div>

              {selectedProposal.supportingDocuments && selectedProposal.supportingDocuments.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    Attachments
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedProposal.supportingDocuments.split(",").map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md transition-all group">
                        <div className="bg-emerald-100 text-emerald-700 p-2.5 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors border border-emerald-200">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </div>
                        <span className="truncate font-semibold flex-1">{getFilenameFromUrl(url)}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50/80 flex justify-end gap-3 rounded-b-2xl shrink-0">
              <button onClick={() => handleEvaluation(selectedProposal.id, false)} disabled={actionLoading !== null} className="px-6 py-2.5 text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 shadow-sm">
                {actionLoading === selectedProposal.id ? "Rejecting..." : "Reject Proposal"}
              </button>
              
              {/* 🚀 FIX: Modal capacity logic now uses the granular subtask limit */}
              {(() => {
                const sid = (selectedProposal as any).targetSubtaskId || (selectedProposal as any).subtaskId;
                const subtask = problem.subtasks.find(st => st.id === sid);
                const limit = (subtask as any)?.maxConcurrentSolvers ?? 3;
                const activeCount = activeAttempts.filter(a => a.targetSubtaskId === sid).length;
                const isFull = activeCount >= limit;
                
                return (
                  <button 
                    onClick={() => handleEvaluation(selectedProposal.id, true)} 
                    disabled={actionLoading !== null || isFull} 
                    className="px-6 py-2.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:bg-slate-300 shadow-md hover:shadow-lg active:scale-[0.98] flex items-center gap-2"
                  >
                    {actionLoading === selectedProposal.id ? "Approving..." : isFull ? "Sub-problem at Capacity" : "Approve & Create Workspace"}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ─── NOTIFICATION MODAL ─── */}
      {notification && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setNotification(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center border border-slate-100 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner ${notification.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"}`}>
              {notification.type === "success" 
                ? <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                : <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              }
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{notification.type === "success" ? "Success!" : "Action Failed"}</h3>
            <p className="text-sm text-slate-600 mb-6 font-medium leading-relaxed">{notification.message}</p>
            <button onClick={() => setNotification(null)} className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors border border-slate-200 shadow-sm active:scale-[0.98]">
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}