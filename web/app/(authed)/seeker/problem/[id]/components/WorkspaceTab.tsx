"use client";

import React, { useEffect, useState, useMemo } from "react";
import { getAllAttempts } from "../api/problem";
import { updateSubtaskMaxSolvers } from "../api/problem";
import type { SolutionAttemptResponse } from "@/types/attempt";
import type { ProblemResponse } from "@/types/problem";

interface WorkspaceTabProps {
  problem: ProblemResponse;
  onProblemUpdate: (updatedProblem: ProblemResponse) => void;
  onLocateInTree: (nodeId: string) => void;
}

export function WorkspaceTab({ problem, onProblemUpdate, onLocateInTree }: WorkspaceTabProps) {
  const [activeAttempts, setActiveAttempts] = useState<SolutionAttemptResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Settings State: Tracks the edited capacity limits independently for each subtask ID
  const [localLimits, setLocalLimits] = useState<Record<string, number>>({});
  const [savingSubtaskId, setSavingSubtaskId] = useState<string | null>(null);
  
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // Notification Modal State
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetchActiveWorkspaces();
    // Initialize local limits from the problem data
    const initialLimits: Record<string, number> = {};
    problem.subtasks.forEach(st => {
      initialLimits[st.id] = (st as any).maxConcurrentSolvers || 3;
    });
    setLocalLimits(initialLimits);
  }, [problem]);

  const fetchActiveWorkspaces = async () => {
    try {
      setLoading(true);
      const attemptsData = await getAllAttempts(problem.id);
      setActiveAttempts(attemptsData.filter((a: any) => a.status === "ACTIVE" || a.status === "IN_PROGRESS"));
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
      
      // Update parent problem state so the new limit propagates
      const updatedSubtasks = problem.subtasks.map(st => 
        st.id === subtaskId ? { ...st, maxConcurrentSolvers: updatedSubtask.maxConcurrentSolvers } : st
      );
      onProblemUpdate({ ...problem, subtasks: updatedSubtasks });
      
      setNotification({ type: "success", message: "Sub-problem capacity updated successfully!" });
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to update limit." });
      // Revert limit back to original on failure
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
        <div className={`${sizeClass} rounded-full overflow-hidden bg-gray-100 shrink-0 border border-secondary/10 shadow-inner`}>
          <img
            src={solver.profilePictureUrl}
            alt={`${solver.firstName} ${solver.lastName}`}
            className="w-full h-full object-cover"
            onError={() => setImgErrors(prev => ({ ...prev, [id]: true }))}
          />
        </div>
      );
    }

    return (
      <div className={`${sizeClass} rounded-full bg-linear-to-br from-secondary/20 to-accent/20 flex items-center justify-center text-secondary font-bold ${textSize} shadow-inner border border-secondary/10 shrink-0`}>
        {initials}
      </div>
    );
  };

  const groupedData = useMemo(() => {
    const map = new Map<string, { id: string; title: string; active: SolutionAttemptResponse[]; originalLimit: number }>();
    
    problem.subtasks.forEach(st => {
      map.set(st.id, { 
        id: st.id, 
        title: st.title, 
        active: [], 
        originalLimit: (st as any).maxConcurrentSolvers || 3 
      });
    });

    activeAttempts.forEach(a => {
      if (a.targetSubtaskId && map.has(a.targetSubtaskId)) {
        map.get(a.targetSubtaskId)!.active.push(a);
      }
    });
    
    return Array.from(map.values());
  }, [activeAttempts, problem.subtasks]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading active workspaces...</p>
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Active Solvers Dashboard</h2>
        <p className="text-xs text-gray-500 mb-4">Monitor solvers and manage capacity limits per sub-problem.</p>
      </div>

      {/* ── Grouped Active Workspaces ── */}
      <div className="space-y-4">
        {groupedData.map((group) => {
          const isCollapsed = collapsedGroups.has(group.id);
          const currentLimit = localLimits[group.id] || group.originalLimit;
          const activeCount = group.active.length;
          const isFull = activeCount >= group.originalLimit;
          const isSaving = savingSubtaskId === group.id;
          const hasUnsavedChanges = currentLimit !== group.originalLimit;

          return (
            <div key={group.id} className="flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-all hover:border-gray-300">
              {/* Accordion Header */}
              <button 
                onClick={() => toggleGroup(group.id)}
                className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors group/header border-b border-gray-100"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 group-hover/header:text-accent shadow-sm transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-gray-900 text-sm max-w-2xl truncate">{group.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${isFull ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                        {activeCount} / {group.originalLimit} Capacity
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {group.active.length > 0 && (
                    <div className="flex -space-x-2">
                      {group.active.map((solver, idx) => (
                        <div key={idx} title={`${solver.solverFirstName} ${solver.solverLastName}`}>
                          {renderAvatar({ firstName: solver.solverFirstName, lastName: solver.solverLastName, profilePictureUrl: solver.profilePictureUrl }, `header-${group.id}-${solver.id}`, 32)}
                        </div>
                      ))}
                    </div>
                  )}
                  <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isCollapsed ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </button>

              {!isCollapsed && (
                <div className="bg-white flex flex-col">
                  {/* 🚀 Per-Subtask Capacity Controller */}
                  <div className="bg-slate-50/50 border-b border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Sub-problem Capacity</h4>
                      {activeCount > 0 && currentLimit === activeCount && (
                         <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1 font-medium">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                           Minimum limit locked to protect {activeCount} active solver{activeCount > 1 ? 's' : ''}.
                         </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm shrink-0 w-fit">
                      <button 
                        onClick={() => updateLocalLimit(group.id, Math.max(activeCount || 1, currentLimit - 1))}
                        disabled={currentLimit <= Math.max(activeCount || 1, 1) || isSaving}
                        className={`w-7 h-7 flex items-center justify-center rounded font-bold transition-colors ${
                          currentLimit <= Math.max(activeCount || 1, 1) 
                            ? 'bg-gray-50 text-gray-300 cursor-not-allowed' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-sm text-gray-900">{currentLimit}</span>
                      <button 
                        onClick={() => updateLocalLimit(group.id, currentLimit + 1)}
                        disabled={isSaving}
                        className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors disabled:opacity-50"
                      >
                        +
                      </button>
                      <div className="w-px h-6 bg-gray-200 mx-1" />
                      <button 
                        onClick={() => handleUpdateLimit(group.id, currentLimit)}
                        disabled={!hasUnsavedChanges || isSaving}
                        className={`px-3 py-1 text-xs font-semibold rounded transition-colors disabled:cursor-not-allowed w-[70px] ${
                          hasUnsavedChanges 
                            ? "bg-accent hover:bg-secondary text-white" 
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>

                  {/* Active Solvers Grid */}
                  <div className="p-5">
                    {group.active.length === 0 ? (
                      <div className="py-8 text-center flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-xl">
                        <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        <p className="text-sm text-gray-500 font-medium">No active solvers for this sub-problem.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.active.map((solver, idx) => (
                          <div key={idx} className="flex flex-col gap-4 bg-gray-50 border border-gray-200 p-4 rounded-xl hover:shadow-md transition-all hover:border-accent/30 group">
                            <div className="flex items-start gap-3">
                              {renderAvatar({ firstName: solver.solverFirstName, lastName: solver.solverLastName, profilePictureUrl: solver.profilePictureUrl }, `card-${solver.id}`, 40)}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-gray-900 truncate">{solver.solverFirstName} {solver.solverLastName}</p>
                                <p className="text-[11px] text-gray-500 truncate">{solver.institution}</p>
                                <p className="text-[10px] text-gray-400 mt-1">Claimed: {new Date(solver.claimedAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => onLocateInTree(solver.id)}
                              className="w-full mt-auto py-2 px-3 bg-white group-hover:bg-accent group-hover:text-white text-gray-700 font-medium rounded-lg text-[11px] transition-colors border border-gray-200 group-hover:border-accent flex justify-center items-center gap-1.5 shadow-sm"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7l-2 2m2-2l2 2m4 4v-4a2 2 0 00-2-2h-6" /></svg>
                              Locate in Tree
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

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
            <h3 className="text-xl font-bold text-gray-900 mb-2">{notification.type === "success" ? "Success!" : "Action Rejected"}</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">{notification.message}</p>
            <button onClick={() => setNotification(null)} className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold rounded-xl transition-colors border border-gray-200 shadow-sm">
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}