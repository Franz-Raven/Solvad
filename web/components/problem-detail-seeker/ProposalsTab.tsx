"use client";

import React, { useEffect, useState, useMemo } from "react";
import { getPendingProposals, evaluateProposal } from "@/lib/api/problem";
import { getAllAttempts } from "@/lib/api/attempts";
import type { ClaimRequestResponse, SolutionAttemptResponse } from "@/types/attempt";
import type { ProblemResponse } from "@/types/problem";

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
      await fetchData(); // Refresh data to update active counts & remove evaluated proposal
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

  const getFilenameFromUrl = (url: string) => {
    try { return decodeURIComponent(url).split("/").pop() || "Attachment"; } 
    catch { return "Attachment"; }
  };

  const renderAvatar = (solver: { firstName: string; lastName: string; profilePictureUrl?: string }, id: string, size = 40) => {
  const hasImage = solver.profilePictureUrl && !imgErrors[id];
  const initials = `${solver.firstName.charAt(0)}${solver.lastName.charAt(0)}`;
  const sizeClass = size === 40 ? "w-10 h-10" : "w-12 h-12";
  const textSize = size === 40 ? "text-sm" : "text-lg";
  console.log("solver:", solver);
  console.log("profilePictureUrl:", solver.profilePictureUrl);
  console.log("hasImage:", hasImage);

  if (hasImage) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-secondary/10 shadow-inner`}>
        <img
          src={solver.profilePictureUrl}
          alt={`${solver.firstName} ${solver.lastName}`}
          className="w-full h-full object-cover"
          onError={() => setImgErrors(prev => ({ ...prev, [id]: true }))}
        />
      </div>
    );
  }

  // Fallback: show initials
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center text-secondary font-bold ${textSize} shadow-inner border border-secondary/10 flex-shrink-0`}>
      {initials}
    </div>
  );
};

  // Group by Sub-problem
  const groupedData = useMemo(() => {
    const sortedProposals = [...proposals].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === "newest-first" ? timeB - timeA : timeA - timeB;
    });

    const map = new Map<string, { id: string; title: string; proposals: ClaimRequestResponse[]; activeCount: number }>();
    
    // Initialize map
    problem.subtasks.forEach(st => {
      map.set(st.id, { id: st.id, title: st.title, proposals: [], activeCount: 0 });
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
    
    return Array.from(map.values()).filter(g => g.proposals.length > 0); // Only show groups with pending requests
  }, [proposals, activeAttempts, sortOrder, problem.subtasks]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading pending requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center font-medium shadow-sm">
        {error}
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">No pending requests</h3>
        <p className="text-sm text-gray-500">When Solvers submit an approach, they will appear here for your review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header & Sorter Controls ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pending Requests</h2>
          <p className="text-xs text-gray-500 mt-1">Review approaches submitted by solvers.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Order:</span>
          {(["newest-first", "oldest-first"] as SortOrder[]).map((opt) => (
            <button
              key={opt}
              onClick={() => setSortOrder(opt)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                sortOrder === opt
                  ? "bg-accent text-white border-accent shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              {opt.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grouped Subtasks ── */}
      <div className="space-y-6">
        {groupedData.map((group) => {
          const isCollapsed = collapsedGroups.has(group.id);
          const maxSolvers = problem.maxConcurrentSolvers || 3;
          const isFull = group.activeCount >= maxSolvers;

          return (
            <div key={group.id} className="flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <button 
                onClick={() => toggleGroup(group.id)}
                className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors group/header border-b border-gray-100"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 group-hover/header:text-accent shadow-sm transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-gray-900 text-sm">{group.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-gray-500 font-medium">
                        {group.proposals.length} Request{group.proposals.length !== 1 ? 's' : ''}
                      </span>
                      {isFull && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                          Capacity Reached
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isCollapsed ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>

              {!isCollapsed && (
                <div className="p-5 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.proposals.map((proposal) => {
                      const fileCount = proposal.supportingDocuments ? proposal.supportingDocuments.split(",").length : 0;
                      const parentAttemptId = (proposal as any).parentAttemptId;
                      const avatarId = `avatar-${proposal.id}`;
                      

                      return (
                        <div key={proposal.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col h-full relative">
                          
                          {/* Disable overlay if limit reached */}
                          {isFull && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center rounded-xl p-4 text-center">
                              <div className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border border-amber-200 mb-2">
                                Sub-problem at Capacity
                              </div>
                              <p className="text-[10px] text-gray-600 font-medium mb-3">You must increase capacity in the Workspace tab to approve.</p>
                              <button onClick={() => setSelectedProposal(proposal)} className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50">
                                Review & Reject Only
                              </button>
                            </div>
                          )}

                          <div className="p-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                              {renderAvatar(proposal.solver, avatarId, 40)}
                              <div className="min-w-0">
                                <h4 className="font-semibold text-gray-900 truncate text-sm">{proposal.solver.firstName} {proposal.solver.lastName}</h4>
                                <p className="text-[11px] text-gray-500 truncate">{proposal.solver.institution || "Independent Solver"}</p>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 flex-1 flex flex-col">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Approach Summary</p>
                            <p className="text-sm text-gray-600 line-clamp-3 mb-3 flex-1">{proposal.proposedApproach}</p>
                            
                            {parentAttemptId && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onLocateInTree(parentAttemptId); }}
                                className="mb-3 text-[11px] font-semibold text-accent flex items-center gap-1 transition-colors w-fit border border-accent/20 bg-accent/5 px-2.5 py-1 rounded-full hover:bg-accent/10 relative z-20"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7l-2 2m2-2l2 2m4 4v-4a2 2 0 00-2-2h-6" /></svg>
                                Locate Solution They Are Building Upon ➔
                              </button>
                            )}
                            
                            <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-50 flex-wrap relative z-20">
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-100 text-gray-500 rounded-md text-[10px] font-medium">
                                {new Date(proposal.createdAt).toLocaleDateString()}
                              </span>
                              {fileCount > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary/5 text-secondary rounded-md text-[10px] font-medium border border-secondary/20">
                                  {fileCount} {fileCount === 1 ? 'File' : 'Files'}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-3 pt-0">
                            <button onClick={() => setSelectedProposal(proposal)} className="w-full py-2 px-4 bg-gray-50 hover:bg-accent hover:text-white text-gray-700 font-medium rounded-lg text-xs transition-colors border border-gray-200 hover:border-accent relative z-20">
                              Review Full Proposal
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── REVIEW MODAL ─── */}
      {selectedProposal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget && !actionLoading) setSelectedProposal(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-gray-50/50 rounded-t-2xl">
              <div className="flex items-center gap-4">
                {renderAvatar(selectedProposal.solver, `modal-${selectedProposal.id}`, 48)}
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedProposal.solver.firstName} {selectedProposal.solver.lastName}</h2>
                  <p className="text-sm text-gray-500">{selectedProposal.solver.institution} • Submitted on {new Date(selectedProposal.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <button onClick={() => setSelectedProposal(null)} disabled={actionLoading !== null} className="text-gray-400 hover:text-gray-700 bg-white border border-gray-200 p-2 rounded-full shadow-sm hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-8">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Full Proposed Approach
                </h4>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {selectedProposal.proposedApproach}
                </div>
              </div>

              {selectedProposal.supportingDocuments && selectedProposal.supportingDocuments.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    Attachments
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedProposal.supportingDocuments.split(",").map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:text-secondary hover:border-secondary hover:shadow-md transition-all group">
                        <div className="bg-secondary/10 text-secondary p-2 rounded-md group-hover:bg-secondary group-hover:text-white transition-colors border border-secondary/20">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </div>
                        <span className="truncate font-medium flex-1">{getFilenameFromUrl(url)}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 rounded-b-2xl flex-shrink-0">
              <button onClick={() => handleEvaluation(selectedProposal.id, false)} disabled={actionLoading !== null} className="px-6 py-2.5 text-red-600 bg-white hover:bg-red-50 border border-red-200 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm">
                {actionLoading === selectedProposal.id ? "Rejecting..." : "Reject Proposal"}
              </button>
              
              {/* Check if the specific subtask for THIS proposal is full */}
              {(() => {
                const sid = (selectedProposal as any).targetSubtaskId || (selectedProposal as any).subtaskId;
                const activeCount = activeAttempts.filter(a => a.targetSubtaskId === sid).length;
                const isFull = activeCount >= (problem.maxConcurrentSolvers || 3);
                
                return (
                  <button 
                    onClick={() => handleEvaluation(selectedProposal.id, true)} 
                    disabled={actionLoading !== null || isFull} 
                    className="px-6 py-2.5 text-white bg-accent hover:bg-secondary rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    {actionLoading === selectedProposal.id ? "Approving..." : isFull ? "Capacity Reached" : "Approve & Create Workspace"}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ─── NOTIFICATION MODAL ─── */}
      {notification && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setNotification(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center border border-gray-100 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner ${notification.type === "success" ? "bg-green-50 text-green-500 border border-green-100" : "bg-red-50 text-red-500 border border-red-100"}`}>
              {notification.type === "success" 
                ? <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                : <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              }
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{notification.type === "success" ? "Success!" : "Action Failed"}</h3>
            <p className="text-sm text-gray-600 mb-6">{notification.message}</p>
            <button onClick={() => setNotification(null)} className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold rounded-xl transition-colors border border-gray-200 shadow-sm">
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}