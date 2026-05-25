"use client";

import React, { useEffect, useState, useMemo } from "react";
import { getAllAttempts } from "@/lib/api/attempts";
import { updateProblemMaxSolvers } from "@/lib/api/problem"; // Ensure this is exported in your api file
import type { SolutionAttemptResponse } from "@/types/attempt";
import type { ProblemResponse } from "@/types/problem";

interface WorkspaceTabProps {
  problem: ProblemResponse;
  onProblemUpdate: (updatedProblem: ProblemResponse) => void;
  onLocateInTree: (nodeId: string) => void; // <--- ADD THIS
}

export function WorkspaceTab({ problem, onProblemUpdate, onLocateInTree }: WorkspaceTabProps) {
  const [activeAttempts, setActiveAttempts] = useState<SolutionAttemptResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Settings State
  const [maxSolvers, setMaxSolvers] = useState(problem.maxConcurrentSolvers || 3);
  const [isSavingLimit, setIsSavingLimit] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // Notification Modal State
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetchActiveWorkspaces();
  }, [problem.id]);

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

  const handleUpdateMaxLimit = async () => {
    setIsSavingLimit(true);
    try {
      await updateProblemMaxSolvers(problem.id, maxSolvers);
      // Update parent state so other tabs know about the new limit
      onProblemUpdate({ ...problem, maxConcurrentSolvers: maxSolvers });
      setNotification({ type: "success", message: "Concurrent solver limit updated successfully!" });
    } catch (err: any) {
      setNotification({ type: "error", message: "Failed to update limit: " + err.message });
      setMaxSolvers(problem.maxConcurrentSolvers || 3);
    } finally {
      setIsSavingLimit(false);
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

  const renderAvatar = (
    solver: { firstName: string; lastName: string; profilePictureUrl?: string },
    id: string,
    size: number = 40
  ) => {
    const hasImage = solver.profilePictureUrl && !imgErrors[id];
    const initials = `${solver.firstName.charAt(0)}${solver.lastName.charAt(0)}`;
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

    // Fallback initials
    return (
      <div className={`${sizeClass} rounded-full bg-linear-to-br from-secondary/20 to-accent/20 flex items-center justify-center text-secondary font-bold ${textSize} shadow-inner border border-secondary/10 shrink-0`}>
        {initials}
      </div>
    );
  };

  const groupedData = useMemo(() => {
    const map = new Map<string, { id: string; title: string; active: SolutionAttemptResponse[] }>();
    
    problem.subtasks.forEach(st => {
      map.set(st.id, { id: st.id, title: st.title, active: [] });
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
      {/* ── Settings Banner: Max Concurrent Solvers ── */}
      <div className="bg-linear-to-r from-accent/10 to-secondary/10 rounded-xl border border-accent/20 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            Sub-problem Capacity
          </h3>
          <p className="text-sm text-gray-600 mt-1 max-w-lg">
            Control the maximum number of Solvers allowed to actively work on a single sub-problem at the same time.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm shrink-0">
          <button 
            onClick={() => setMaxSolvers(Math.max(1, maxSolvers - 1))}
            className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors"
          >
            -
          </button>
          <span className="w-8 text-center font-bold text-lg text-gray-900">{maxSolvers}</span>
          <button 
            onClick={() => setMaxSolvers(maxSolvers + 1)}
            className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors"
          >
            +
          </button>
          <div className="w-px h-8 bg-gray-200 mx-1" />
          <button 
            onClick={handleUpdateMaxLimit}
            disabled={maxSolvers === problem.maxConcurrentSolvers || isSavingLimit}
            className="px-4 py-1.5 bg-accent hover:bg-secondary text-white font-semibold rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingLimit ? "Saving..." : "Save Limit"}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Active Solvers Dashboard</h2>
        <p className="text-xs text-gray-500 mb-4">Monitor solvers currently operating in generated workspaces.</p>
      </div>

      {/* ── Grouped Active Workspaces ── */}
      <div className="space-y-4">
        {groupedData.map((group) => {
          const isCollapsed = collapsedGroups.has(group.id);
          const isFull = group.active.length >= maxSolvers;

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
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${isFull ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                        {group.active.length} / {maxSolvers} Capacity
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {group.active.length > 0 && (
                    <div className="flex -space-x-2">
                      {group.active.map((solver, idx) => {
                        const avatarId = `header-${group.id}-${solver.id}`;
                        return (
                          <div key={idx} title={`${solver.solverFirstName} ${solver.solverLastName}`}>
                            {renderAvatar(
                              { firstName: solver.solverFirstName, lastName: solver.solverLastName, profilePictureUrl: solver.profilePictureUrl },
                              avatarId,
                              32
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isCollapsed ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </button>

              {!isCollapsed && (
                <div className="p-5 bg-white">
                  {group.active.length === 0 ? (
                    <p className="text-sm text-gray-500 font-medium text-center py-4">No active solvers for this sub-problem.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.active.map((solver, idx) => (
                        <div key={idx} className="flex flex-col gap-4 bg-gray-50 border border-gray-200 p-4 rounded-xl hover:shadow-sm transition-all hover:border-accent/30">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold border border-secondary/20 shrink-0">
                              {solver.solverFirstName.charAt(0)}{solver.solverLastName.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-gray-900 truncate">{solver.solverFirstName} {solver.solverLastName}</p>
                              <p className="text-[11px] text-gray-500 truncate">{solver.institution}</p>
                              <p className="text-[10px] text-gray-400 mt-1">Claimed: {new Date(solver.claimedAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => onLocateInTree(solver.id)}
                            className="w-full mt-auto py-2 px-3 bg-white hover:bg-accent hover:text-white text-gray-700 font-medium rounded-lg text-[11px] transition-colors border border-gray-200 hover:border-accent flex justify-center items-center gap-1.5 shadow-sm"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7l-2 2m2-2l2 2m4 4v-4a2 2 0 00-2-2h-6" />
                            </svg>
                            Locate in Tree
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── NOTIFICATION MODAL ─── */}
      {notification && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setNotification(null)}>
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