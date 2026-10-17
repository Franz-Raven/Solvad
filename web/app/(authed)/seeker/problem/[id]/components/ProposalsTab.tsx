"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Loader2, GitBranch, Paperclip, X, Shield, ShieldHalf, ShieldCheck, Award, Clock, Activity } from "lucide-react";
import { evaluateProposal, getPendingProposals, getFullProposalDetails, getSubtaskCapacities, getSolverMetrics } from "../api/problem";
import type { ClaimSummaryResponse } from "@/types/attempt";
import type { SubtaskCapacity } from "../api/problem";
import type { ClaimRequestResponse } from "@/types/attempt";
import type { ProblemResponse } from "@/types/problem";
import type { SolverMetrics } from "@/types/attempt";

type SortOrder = "newest-first" | "oldest-first";

interface ProposalsTabProps {
  problem: ProblemResponse;
  onLocateInTree: (nodeId: string) => void;
}

export function ProposalsTab({ problem, onLocateInTree }: ProposalsTabProps) {
  const [proposals, setProposals] = useState<ClaimSummaryResponse[]>([]);
  const [capacities, setCapacities] = useState<SubtaskCapacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest-first");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  
  const ITEMS_PER_PAGE = 8;
  const [visibleItems, setVisibleItems] = useState<Record<string, number>>({});

  const [selectedProposal, setSelectedProposal] = useState<ClaimRequestResponse | null>(null);
  const [fetchingDetailsId, setFetchingDetailsId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  
  const [solverMetrics, setSolverMetrics] = useState<SolverMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

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
      const [rawProposals, caps] = await Promise.all([
        getPendingProposals(problem.id), // 🚀 Use endpoint that guarantees the ID
        getSubtaskCapacities(problem.id)
      ]);
      
      // 🚀 Map the raw data to perfectly match our table format, carrying the ID over!
      const mappedProposals: ClaimSummaryResponse[] = rawProposals.map(p => ({
        id: p.id,
        solver: {
            id: p.solver.id, 
            firstName: p.solver.firstName,
            lastName: p.solver.lastName,
            institution: p.solver.institution,
            profilePictureUrl: p.solver.profilePictureUrl
        },
        targetSubtaskId: p.targetSubtaskId,
        parentAttemptId: p.parentAttemptId,
        status: p.status,
        createdAt: p.createdAt,
        fileCount: p.supportingDocuments ? p.supportingDocuments.split(",").length : 0
      }));

      setProposals(mappedProposals);
      setCapacities(caps);
      
      const initialVisible: Record<string, number> = {};
      problem.subtasks.forEach(st => initialVisible[st.id] = ITEMS_PER_PAGE);
      setVisibleItems(initialVisible);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

 const handleOpenDetails = async (proposalId: string, solverId?: string) => {
    setFetchingDetailsId(proposalId);
    setSolverMetrics(null);
    setMetricsLoading(true);
    
    try {
      const heavyProposal = await getFullProposalDetails(proposalId);
      setSelectedProposal(heavyProposal);
      
      const fallback = { solutionsCompleted: 0, completionRate: 0, avgTurnaroundDays: null };
      
      // 🚀 Directly use the ID passed from the mapped table row, completely bypassing the missing backend DTO!
      const targetSolverId = solverId;
      
      if (!targetSolverId) {
        console.error("🚨 NO SOLVER ID FOUND! The table mapping failed.");
        setSolverMetrics(fallback);
      } else {
        try {
          const metrics = await getSolverMetrics(targetSolverId);
          setSolverMetrics(metrics);
        } catch (metricsErr) {
          console.error("🚨 API call to /merit/solver failed:", metricsErr);
          setSolverMetrics(fallback);
        }
      }
    } catch(err) {
      setNotification({ type: "error", message: "Failed to load full proposal details." });
    } finally {
      setFetchingDetailsId(null);
      setMetricsLoading(false);
    }
  };

  const handleEvaluation = async (proposalId: string, isApproved: boolean) => {
    setActionLoading(proposalId);
    try {
      await evaluateProposal(proposalId, isApproved);
      await fetchData(); 
      setSelectedProposal(null);
      setNotification({ type: "success", message: isApproved ? "Proposal approved and workspace created!" : "Proposal rejected successfully." });
    } catch (err: any) {
      setNotification({ type: "error", message: `Evaluation failed: ${err.message}` });
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
    const sizeClass = size === 40 ? "w-10 h-10 text-sm" : "w-12 h-12 text-lg";

    if (hasImage) {
      return (
        <div className={`${sizeClass} rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-inner`}>
          <img src={solver.profilePictureUrl} alt={solver.firstName} className="w-full h-full object-cover" onError={() => setImgErrors(prev => ({ ...prev, [id]: true }))} />
        </div>
      );
    }
    return (
      <div className={`${sizeClass} rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold shadow-inner border border-accent/20 shrink-0`}>
        {initials}
      </div>
    );
  };

  const getTierDetails = (completed: number) => {
    if (completed >= 10) return { name: "Elite Solver", icon: <Award className="w-4 h-4" fill="currentColor" />, color: "bg-emerald-100 text-emerald-900 border-emerald-400" };
    if (completed >= 5) return { name: "Proven Solver", icon: <ShieldCheck className="w-4 h-4" fill="currentColor" />, color: "bg-emerald-50 text-emerald-800 border-emerald-300" };
    if (completed >= 1) return { name: "Contributor", icon: <ShieldHalf className="w-4 h-4" />, color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    return { name: "Initiate", icon: <Shield className="w-4 h-4" />, color: "bg-slate-50 text-slate-600 border-slate-200" };
  };

  const groupedData = useMemo(() => {
    const sortedProposals = [...proposals].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === "newest-first" ? timeB - timeA : timeA - timeB;
    });

    const map = new Map<string, { id: string; title: string; limit: number; proposals: ClaimSummaryResponse[]; activeCount: number }>();
    
    capacities.forEach(cap => {
      map.set(cap.subtaskId, { 
        id: cap.subtaskId, 
        title: cap.title, 
        limit: cap.maxSolvers, 
        proposals: [], 
        activeCount: cap.activeCount 
      });
    });

    sortedProposals.forEach(p => {
      if (p.targetSubtaskId && map.has(p.targetSubtaskId)) {
        map.get(p.targetSubtaskId)!.proposals.push(p);
      }
    });
    
    return Array.from(map.values()).filter(g => g.proposals.length > 0);
  }, [proposals, capacities, sortOrder]);

  const filteredGroups = useMemo(() => {
    return groupedData.filter(g => selectedSubtaskId === "ALL" || g.id === selectedSubtaskId);
  }, [groupedData, selectedSubtaskId]);

  const filteredProposalsCount = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.proposals.length, 0);
  }, [filteredGroups]);

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">
        <div className="w-full lg:w-[320px] space-y-3 shrink-0">
          <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-4" />
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white border border-slate-100 rounded-xl shadow-sm animate-pulse"/>)}
        </div>
        <div className="w-full flex-1">
          <div className="h-6 w-48 bg-slate-200 rounded animate-pulse mb-4" />
          <div className="h-[400px] bg-white border border-slate-100 rounded-2xl shadow-sm animate-pulse"/>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl text-center font-medium shadow-sm animate-in fade-in duration-300">{error}</div>;
  }

  if (proposals.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 p-16 text-center animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">No pending requests</h3>
        <p className="text-sm text-slate-500 font-medium">When Solvers submit an approach, they will appear here for your review.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">
      
      <div className="w-full lg:w-[320px] shrink-0 space-y-2">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 ml-1">Filter by Sub-problem</h3>
        
        <button
          onClick={() => { setSelectedSubtaskId("ALL"); }}
          className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between shadow-sm active:scale-[0.99] cursor-pointer ${
            selectedSubtaskId === "ALL" 
              ? "bg-emerald-600 border-emerald-600 text-white shadow-md" 
              : "bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:shadow-md"
          }`}
        >
          <span className="font-bold text-sm">All Pending Requests</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${selectedSubtaskId === "ALL" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
            {proposals.length}
          </span>
        </button>

        {capacities.map(cap => {
          const isSelected = selectedSubtaskId === cap.subtaskId;
          const isFull = cap.activeCount >= cap.maxSolvers;
          const pendingCount = proposals.filter(p => p.targetSubtaskId === cap.subtaskId).length;

          return (
            <button
              key={cap.subtaskId}
              onClick={() => { setSelectedSubtaskId(cap.subtaskId); }}
              className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col shadow-sm active:scale-[0.99] cursor-pointer ${
                isSelected ? "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500/20" : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md"
              }`}
            >
              <div className="flex justify-between items-start gap-2 mb-2 w-full">
                <span className={`font-bold text-sm line-clamp-2 leading-snug flex-1 ${isSelected ? "text-emerald-900" : "text-slate-800"}`}>{cap.title}</span>
                {pendingCount > 0 && <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border ${isSelected ? "bg-emerald-100 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-700"}`}>{pendingCount} Pending</span>}
              </div>
              <div className="flex items-center gap-1.5 w-full">
                <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isSelected ? "bg-emerald-200" : "bg-slate-100"}`}>
                  <div className={`h-full rounded-full ${isFull ? "bg-rose-500" : "bg-accent"}`} style={{ width: `${Math.min((cap.activeCount / cap.maxSolvers) * 100, 100)}%` }} />
                </div>
                <span className={`text-[10px] font-bold tracking-wider shrink-0 ${isFull ? "text-rose-600" : isSelected ? "text-emerald-700" : "text-slate-500"}`}>
                  {isFull ? "CAPACITY FULL" : `${cap.activeCount} / ${cap.maxSolvers} ACTIVE`}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="w-full flex-1 flex flex-col min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 ml-1">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {selectedSubtaskId === "ALL" ? "Showing All Requests" : "Filtered Requests"} ({filteredProposalsCount})
          </h3>
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm w-fit">
            {(["newest-first", "oldest-first"] as SortOrder[]).map((opt) => (
              <button
                key={opt}
                onClick={() => setSortOrder(opt)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all uppercase tracking-wider cursor-pointer ${
                  sortOrder === opt
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"
                    : "bg-transparent border border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                {opt === "newest-first" ? "Newest" : "Oldest"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          {filteredGroups.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-slate-100 p-16 text-center animate-in fade-in duration-500">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No pending requests here</h3>
              <p className="text-sm text-slate-500 font-medium">There are no pending proposals matching this filter.</p>
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isCollapsed = collapsedGroups.has(group.id);
              const visibleCount = visibleItems[group.id] || ITEMS_PER_PAGE;
              const visibleProposals = group.proposals.slice(0, visibleCount);
              const hasMore = group.proposals.length > visibleCount;

              return (
                <div key={group.id} className="flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.02)] transition-colors hover:border-slate-300">
                  <button 
                    onClick={() => toggleGroup(group.id)}
                    className="flex items-center justify-between w-full p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors group/header border-b border-slate-100 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-left flex-1 min-w-0 pr-4">
                        <h3 className="font-bold text-slate-900 text-sm truncate">{group.title}</h3>
                      </div>
                    </div>
                    <svg className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${isCollapsed ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>

                  {!isCollapsed && (
                    <div className="bg-white flex flex-col h-full overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                          <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100">
                              <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[45%]">Solver</th>
                              <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[25%]">Submitted</th>
                              <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[15%]">Attachments</th>
                              <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right w-[15%]">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {visibleProposals.map(proposal => {
                              const isFetching = fetchingDetailsId === proposal.id;

                              return (
                                <tr key={proposal.id} onClick={() => handleOpenDetails(proposal.id, proposal.solver.id)} className="hover:bg-slate-50 transition-colors group cursor-pointer active:bg-slate-100">
                                  <td className="p-4">
                                    <div className="flex items-center gap-3">
                                      {renderAvatar(proposal.solver, proposal.id, 40)}
                                      <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900 truncate">
                                          {proposal.solver.firstName} {proposal.solver.lastName}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-medium truncate mb-0.5">
                                          {proposal.solver.institution || "Independent"}
                                        </p>
                                        {proposal.parentAttemptId && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation(); 
                                              onLocateInTree(proposal.parentAttemptId!);
                                            }}
                                            title="Click to view the source of this fork in the Solution Tree"
                                            className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm active:scale-95"
                                          >
                                            <GitBranch className="w-3 h-3" /> Forked Solution ➔
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-4 text-xs font-bold text-slate-600">
                                    {new Date(proposal.createdAt).toLocaleDateString()}
                                  </td>
                                  <td className="p-4">
                                    {proposal.fileCount > 0 ? (
                                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md border border-slate-200 uppercase tracking-wider">
                                         <Paperclip className="w-3 h-3"/> {proposal.fileCount} File{proposal.fileCount > 1 ? 's' : ''}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">None</span>
                                    )}
                                  </td>
                                  <td className="p-4 text-right">
                                    <button disabled={isFetching} className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-600 px-4 py-2 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 ml-auto w-fit active:scale-95 cursor-pointer">
                                      {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Review"}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      {hasMore && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-center">
                          <button 
                            onClick={() => loadMore(group.id)}
                            className="px-6 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 transition-all cursor-pointer active:scale-95 uppercase tracking-wider"
                          >
                            Load More Results
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── REVIEW MODAL ─── */}
      {selectedProposal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget && !actionLoading) setSelectedProposal(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-slate-200">
            
            <div className="px-6 py-5 border-b border-slate-200 shrink-0 bg-slate-50/80 rounded-t-2xl z-10">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-4">
                  {renderAvatar(selectedProposal.solver, `modal-${selectedProposal.id}`, 48)}
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">{selectedProposal.solver.firstName} {selectedProposal.solver.lastName}</h2>
                    <p className="text-sm text-slate-500 font-medium">{selectedProposal.solver.institution || "Independent"} • Submitted {new Date(selectedProposal.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedProposal(null)} disabled={actionLoading !== null} className="text-slate-400 hover:text-slate-700 bg-white border border-slate-200 w-10 h-10 flex items-center justify-center rounded-xl shadow-sm hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {metricsLoading && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 animate-in fade-in duration-300">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-16 bg-slate-200 rounded-xl animate-pulse border border-slate-200/60" />
                  ))}
                </div>
              )}

              {!metricsLoading && solverMetrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  {(() => {
                    const tier = getTierDetails(solverMetrics.solutionsCompleted);
                    return (
                      <div className={`p-3 rounded-xl border flex flex-col justify-center shadow-sm ${tier.color}`}>
                        <div className="flex items-center gap-1.5 mb-1 opacity-80">
                          {tier.icon}
                          <span className="text-[10px] font-bold uppercase tracking-wider">Solver Tier</span>
                        </div>
                        <span className="text-sm font-black tracking-tight">{tier.name}</span>
                      </div>
                    );
                  })()}

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 mb-1 text-slate-500">
                      <Shield className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Completed</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">{solverMetrics.solutionsCompleted}</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 mb-1 text-slate-500">
                      <Activity className="w-3.5 h-3.5 text-accent" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Reliability</span>
                    </div>
                    <span className={`text-sm font-black ${solverMetrics.completionRate >= 80 ? "text-emerald-600" : solverMetrics.completionRate >= 50 ? "text-amber-600" : "text-rose-600"}`}>
                      {solverMetrics.solutionsCompleted === 0 ? "N/A" : `${Math.round(solverMetrics.completionRate)}%`}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 mb-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Turnaround</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">
                      {solverMetrics.avgTurnaroundDays ? `${Math.round(solverMetrics.avgTurnaroundDays)} days` : "N/A"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
              <div className="mb-8 bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Full Proposed Approach
                </h4>
                <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                  {selectedProposal.proposedApproach}
                </div>
              </div>

              {selectedProposal.supportingDocuments && selectedProposal.supportingDocuments.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    Attachments
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedProposal.supportingDocuments.split(",").map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:text-accent hover:border-accent hover:bg-accent/5 hover:shadow-md transition-all group cursor-pointer active:scale-[0.98]">
                        <div className="bg-slate-100 text-slate-600 p-2.5 rounded-lg group-hover:bg-accent group-hover:text-white transition-colors border border-slate-200 group-hover:border-accent">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </div>
                        <span className="truncate flex-1">{getFilenameFromUrl(url)}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 md:p-6 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-end gap-3 rounded-b-2xl shrink-0 z-10">
              <button onClick={() => handleEvaluation(selectedProposal.id, false)} disabled={actionLoading !== null} className="w-full sm:w-auto px-6 py-2.5 text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-sm active:scale-[0.98] cursor-pointer flex justify-center">
                {actionLoading === selectedProposal.id ? "Rejecting..." : "Reject Proposal"}
              </button>
              
              {(() => {
                const sid = (selectedProposal as any).targetSubtaskId || (selectedProposal as any).subtaskId;
                const cap = capacities.find(c => c.subtaskId === sid);
                const isFull = cap && cap.activeCount >= cap.maxSolvers;
                
                return (
                  <button 
                    onClick={() => handleEvaluation(selectedProposal.id, true)} 
                    disabled={actionLoading !== null || isFull} 
                    className="w-full sm:w-auto px-6 py-2.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:bg-slate-300 shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {actionLoading === selectedProposal.id ? "Approving..." : isFull ? "Sub-problem at Capacity" : "Approve & Create Workspace"}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setNotification(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center border border-slate-100 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner ${notification.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"}`}>
              {notification.type === "success" 
                ? <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                : <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              }
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{notification.type === "success" ? "Success!" : "Action Failed"}</h3>
            <p className="text-sm text-slate-600 mb-8 font-medium leading-relaxed">{notification.message}</p>
            <button onClick={() => setNotification(null)} className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold rounded-xl transition-all border border-slate-200 shadow-sm active:scale-[0.98] cursor-pointer">
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}