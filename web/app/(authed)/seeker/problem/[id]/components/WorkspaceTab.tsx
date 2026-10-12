"use client";

import React, { useEffect, useState, useMemo } from "react";
import { getActiveWorkspaces, updateSubtaskMaxSolvers } from "../api/problem";
import type { SolutionAttemptSummary } from "@/types/attempt";
import type { ProblemResponse } from "@/types/problem";

interface WorkspaceTabProps {
  problem: ProblemResponse;
  onProblemUpdate: (updatedProblem: ProblemResponse) => void;
  onLocateInTree: (nodeId: string) => void;
}

export function WorkspaceTab({ problem, onProblemUpdate, onLocateInTree }: WorkspaceTabProps) {
  const [activeAttempts, setActiveAttempts] = useState<SolutionAttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string>("ALL");
  const [localLimits, setLocalLimits] = useState<Record<string, number>>({});
  const [savingSubtaskId, setSavingSubtaskId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetchActiveWorkspaces();
    const initialLimits: Record<string, number> = {};
    problem.subtasks.forEach(st => {
      initialLimits[st.id] = (st as any).maxConcurrentSolvers || 3;
    });
    setLocalLimits(initialLimits);
  }, [problem]);

  const fetchActiveWorkspaces = async () => {
    try {
      setLoading(true);
      const attemptsData = await getActiveWorkspaces(problem.id);
      setActiveAttempts(attemptsData);
    } catch (err: any) {
      setError(err.message || "Failed to fetch active workspaces.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLimit = async (subtaskId: string, newLimit: number) => {
    setSavingSubtaskId(subtaskId);
    try {
      const updatedSubtask = await updateSubtaskMaxSolvers(problem.id, subtaskId, newLimit);
      const updatedSubtasks = problem.subtasks.map(st => 
        st.id === subtaskId ? { ...st, maxConcurrentSolvers: updatedSubtask.maxConcurrentSolvers } : st
      );
      onProblemUpdate({ ...problem, subtasks: updatedSubtasks });
      setNotification({ type: "success", message: "Sub-problem capacity updated successfully!" });
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to update limit." });
      setLocalLimits(prev => ({
        ...prev,
        [subtaskId]: (problem.subtasks.find(st => st.id === subtaskId) as any)?.maxConcurrentSolvers || 3
      }));
    } finally {
      setSavingSubtaskId(null);
    }
  };

  const updateLocalLimit = (subtaskId: string, newLimit: number) => {
    setLocalLimits(prev => ({ ...prev, [subtaskId]: newLimit }));
  };

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const renderAvatar = (
    solver: { firstName: string; lastName: string; profilePictureUrl?: string },
    id: string,
    size: number = 40
  ) => {
    const hasImage = solver.profilePictureUrl && !imgErrors[id];
    const initials = `${solver.firstName?.charAt(0) || ""}${solver.lastName?.charAt(0) || ""}`.toUpperCase();
    const sizeClass = size === 40 ? "w-10 h-10" : "w-8 h-8";
    const textSize = size === 40 ? "text-sm" : "text-[10px]";

    if (hasImage) {
      return (
        <div className={`${sizeClass} rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-inner`}>
          <img src={solver.profilePictureUrl} alt={solver.firstName} className="w-full h-full object-cover" onError={() => setImgErrors(prev => ({ ...prev, [id]: true }))} />
        </div>
      );
    }
    return (
      <div className={`${sizeClass} rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold ${textSize} shadow-inner border border-accent/20 shrink-0`}>
        {initials}
      </div>
    );
  };

  const groupedData = useMemo(() => {
    const map = new Map<string, { id: string; title: string; active: SolutionAttemptSummary[]; originalLimit: number }>();
    problem.subtasks.forEach(st => {
      map.set(st.id, { id: st.id, title: st.title, active: [], originalLimit: (st as any).maxConcurrentSolvers || 3 });
    });
    activeAttempts.forEach(a => {
      if (a.targetSubtaskId && map.has(a.targetSubtaskId)) map.get(a.targetSubtaskId)!.active.push(a);
    });
    return Array.from(map.values());
  }, [activeAttempts, problem.subtasks]);

  const filteredGroups = useMemo(() => {
    return groupedData.filter(g => selectedSubtaskId === "ALL" || g.id === selectedSubtaskId);
  }, [groupedData, selectedSubtaskId]);

  const filteredActiveCount = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.active.length, 0);
  }, [filteredGroups]);

  // 🚀 SKELETON LOADER (Matching Proposals layout)
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

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500 items-start">
      
      {/* ── SIDEBAR: Subtask Filters ── */}
      <div className="w-full lg:w-[320px] shrink-0 space-y-2 sticky top-28">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 ml-1">Filter by Sub-problem</h3>
        
        <button
          onClick={() => { setSelectedSubtaskId("ALL"); }}
          className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between shadow-sm active:scale-[0.99] cursor-pointer ${
            selectedSubtaskId === "ALL" 
              ? "bg-accent border-accent text-white shadow-md" 
              : "bg-white border-slate-200 text-slate-700 hover:border-accent hover:shadow-md"
          }`}
        >
          <span className="font-bold text-sm">All Active Workspaces</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${selectedSubtaskId === "ALL" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
            {activeAttempts.length}
          </span>
        </button>

        {groupedData.map(group => {
          const isSelected = selectedSubtaskId === group.id;
          const isFull = group.active.length >= group.originalLimit;
          const activeCount = group.active.length;

          return (
            <button
              key={group.id}
              onClick={() => { setSelectedSubtaskId(group.id); }}
              className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col shadow-sm active:scale-[0.99] cursor-pointer ${
                isSelected ? "bg-accent/5 border-accent ring-1 ring-accent/20" : "bg-white border-slate-200 hover:border-accent/40 hover:shadow-md"
              }`}
            >
              <div className="flex justify-between items-start gap-2 mb-2 w-full">
                <span className={`font-bold text-sm line-clamp-2 leading-snug flex-1 ${isSelected ? "text-accent" : "text-slate-800"}`}>{group.title}</span>
                {activeCount > 0 && <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border ${isSelected ? "bg-accent/10 border-accent/20 text-accent" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>{activeCount} Active</span>}
              </div>
              <div className="flex items-center gap-1.5 w-full">
                <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isSelected ? "bg-accent/20" : "bg-slate-100"}`}>
                  <div className={`h-full rounded-full ${isFull ? "bg-rose-500" : "bg-accent"}`} style={{ width: `${Math.min((activeCount / group.originalLimit) * 100, 100)}%` }} />
                </div>
                <span className={`text-[10px] font-bold tracking-wider shrink-0 ${isFull ? "text-rose-600" : isSelected ? "text-accent" : "text-slate-500"}`}>
                  {isFull ? "CAPACITY FULL" : `${activeCount} / ${group.originalLimit} LIMIT`}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── MAIN AREA: Active Workspaces ── */}
      <div className="w-full flex-1 flex flex-col min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 ml-1">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {selectedSubtaskId === "ALL" ? "Showing All Workspaces" : "Filtered Workspaces"} ({filteredActiveCount})
          </h3>
        </div>

        <div className="flex-1 flex flex-col space-y-5">
          {filteredGroups.length === 0 || filteredActiveCount === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center min-h-[400px] animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Solvers</h3>
              <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                There are currently no solvers actively working on this sub-problem. 
              </p>
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isCollapsed = collapsedGroups.has(group.id);
              const currentLimit = localLimits[group.id] || group.originalLimit;
              const activeCount = group.active.length;
              const isFull = activeCount >= group.originalLimit;
              const isSaving = savingSubtaskId === group.id;
              const hasUnsavedChanges = currentLimit !== group.originalLimit;

              // Hide groups that are empty IF we are viewing all (to clean up the view)
              if (selectedSubtaskId === "ALL" && activeCount === 0) return null;

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
                    <div className="bg-white flex flex-col overflow-hidden">
                      
                      {/* 🚀 Sub-problem Capacity Controller */}
                      <div className="bg-slate-50/30 border-b border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Sub-problem Capacity</h4>
                          {activeCount > 0 && currentLimit === activeCount && (
                             <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1 font-bold">
                               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                               Minimum limit locked to protect {activeCount} active solver{activeCount > 1 ? 's' : ''}.
                             </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm shrink-0 w-fit">
                          <button 
                            onClick={() => updateLocalLimit(group.id, Math.max(activeCount || 1, currentLimit - 1))}
                            disabled={currentLimit <= Math.max(activeCount || 1, 1) || isSaving}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold transition-all ${
                              currentLimit <= Math.max(activeCount || 1, 1) 
                                ? 'bg-slate-50 text-slate-300 cursor-not-allowed' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 cursor-pointer'
                            }`}
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-bold text-sm text-slate-900">{currentLimit}</span>
                          <button 
                            onClick={() => updateLocalLimit(group.id, currentLimit + 1)}
                            disabled={isSaving}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                          >
                            +
                          </button>
                          <div className="w-px h-6 bg-slate-200 mx-1" />
                          <button 
                            onClick={() => handleUpdateLimit(group.id, currentLimit)}
                            disabled={!hasUnsavedChanges || isSaving}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm active:scale-95 ${
                              hasUnsavedChanges 
                                ? "bg-accent hover:bg-accent/90 text-white cursor-pointer" 
                                : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                            }`}
                          >
                            {isSaving ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>

                      {/* 🚀 Active Workspaces Data Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                          <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                              <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[40%]">Active Solver</th>
                              <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[20%]">Status</th>
                              <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[20%]">Claimed Date</th>
                              <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right w-[20%]">Tree Locator</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {group.active.map(solver => (
                              <tr key={solver.id} onClick={() => onLocateInTree(solver.id)} className="hover:bg-slate-50 transition-colors group cursor-pointer active:bg-slate-100">
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    {renderAvatar({ firstName: solver.solverFirstName, lastName: solver.solverLastName, profilePictureUrl: solver.profilePictureUrl }, solver.id, 32)}
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold text-slate-900 truncate">{solver.solverFirstName} {solver.solverLastName}</p>
                                      <p className="text-[10px] text-slate-500 font-medium truncate mb-0.5">{solver.solverInstitution || "Independent"}</p>
                                      {solver.parentAttemptId && (
                                         <p className="text-[10px] text-accent font-bold flex items-center gap-1 uppercase tracking-wider">
                                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7l-2 2m2-2l2 2m4 4v-4a2 2 0 00-2-2h-6" /></svg>
                                           Forked Workspace
                                         </p>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 bg-amber-50 text-amber-700 rounded-md border border-amber-200 uppercase tracking-wider">
                                     <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Drafting
                                  </span>
                                </td>
                                <td className="p-4 text-xs font-bold text-slate-600">
                                  {new Date(solver.claimedAt).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-right">
                                  <button className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 hover:border-accent hover:text-accent px-4 py-2 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 ml-auto w-fit active:scale-95 cursor-pointer">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                                    Locate
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── NOTIFICATION MODAL ─── */}
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