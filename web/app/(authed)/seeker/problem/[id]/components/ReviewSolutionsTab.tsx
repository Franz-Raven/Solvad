"use client";

import React, { useEffect, useState } from "react";
import { Loader2, X, Shield, ShieldHalf, ShieldCheck, Award, Clock, Activity, Search, ChevronLeft, ChevronRight, CheckCircle, Paperclip } from "lucide-react";
import Portal from "@/components/portal";

import { getPendingSolutions, evaluateSolution, getAttemptDetailsById, getSubtaskCapacities, getSolverMetrics } from "../api/problem";
import type { SubtaskCapacity } from "../api/problem";
import type { SolutionAttemptResponse, SolutionAttemptSummary, PaginatedAttemptsResponse, SolverMetrics } from "@/types/attempt";
import type { ProblemResponse } from "@/types/problem";
import { useDebounce } from "@/hooks/use-debounce";

type SortOrder = "newest-first" | "oldest-first";

interface ReviewSolutionsTabProps {
  problem: ProblemResponse;
}

export function ReviewSolutionsTab({ problem }: ReviewSolutionsTabProps) {
  const [capacities, setCapacities] = useState<SubtaskCapacity[]>([]);
  const [data, setData] = useState<PaginatedAttemptsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortOrder, setSortOrder] = useState<SortOrder>("newest-first");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const [selectedSolution, setSelectedSolution] = useState<SolutionAttemptResponse | null>(null);
  const [fetchingDetailsId, setFetchingDetailsId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [solverMetrics, setSolverMetrics] = useState<SolverMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // 🚀 Rejection State for UI
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchCaps = async () => {
    try {
      const caps = await getSubtaskCapacities(problem.id);
      setCapacities(caps);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getPendingSolutions(problem.id, selectedSubtaskId, debouncedSearch, sortOrder, page - 1, 8);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to fetch solutions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCaps(); }, [problem.id]);
  useEffect(() => { setPage(1); }, [selectedSubtaskId, debouncedSearch, sortOrder]); 
  useEffect(() => { fetchData(); }, [problem.id, selectedSubtaskId, debouncedSearch, sortOrder, page]);

  useEffect(() => {
    if (selectedSolution) document.body.style.overflow = "hidden";
    else {
      document.body.style.overflow = "";
      setIsRejecting(false);
      setRejectionReason("");
    }
    return () => { document.body.style.overflow = ""; };
  }, [selectedSolution]);

  // 🚀 TS FIX: Fetch heavy details FIRST, then safely extract solverId for metrics
  const handleOpenDetails = async (summary: SolutionAttemptSummary) => {
    setFetchingDetailsId(summary.id);
    setSolverMetrics(null);
    setMetricsLoading(true);
    
    try {
      const fullAttempt = await getAttemptDetailsById(summary.id);
      setSelectedSolution(fullAttempt);

      if (fullAttempt.solverId) {
        const metrics = await getSolverMetrics(fullAttempt.solverId).catch(() => ({ solutionsCompleted: 0, completionRate: 0, avgTurnaroundDays: null }));
        setSolverMetrics(metrics as SolverMetrics);
      } else {
        setSolverMetrics({ solutionsCompleted: 0, completionRate: 0, avgTurnaroundDays: null });
      }
    } catch(err) {
      setNotification({ type: "error", message: "Failed to load full solution details." });
    } finally {
      setFetchingDetailsId(null);
      setMetricsLoading(false);
    }
  };

  const handleEvaluation = async (attemptId: string, isApproved: boolean) => {
    setActionLoading(attemptId);
    try {
      await evaluateSolution(attemptId, isApproved, isApproved ? undefined : rejectionReason);
      await Promise.all([fetchData(), fetchCaps()]); 
      setSelectedSolution(null);
      setNotification({ type: "success", message: isApproved ? "Solution approved! Merit awarded to solver." : "Solution rejected. Workspace has been terminated and feedback sent." });
    } catch (err: any) {
      setNotification({ type: "error", message: `Evaluation failed: ${err.message}` });
    } finally {
      setActionLoading(null);
      setIsRejecting(false);
      setRejectionReason("");
    }
  };

  const getTierDetails = (completed: number) => {
    if (completed >= 10) return { name: "Elite Solver", icon: <Award className="w-4 h-4" fill="currentColor" />, color: "bg-amber-50 text-amber-600 border-amber-200" };
    if (completed >= 5) return { name: "Proven Solver", icon: <ShieldCheck className="w-4 h-4" />, color: "bg-emerald-50 text-emerald-800 border-emerald-300" };
    if (completed >= 1) return { name: "Contributor", icon: <Shield className="w-4 h-4" />, color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    return { name: "Initiate", icon: <ShieldHalf className="w-4 h-4" />, color: "bg-slate-50 text-slate-500 border-slate-200" };
  };

  const getFilenameFromUrl = (url: string) => {
    try { return decodeURIComponent(url).split("/").pop() || "Attachment"; } 
    catch { return "Attachment"; }
  };

  const totalPendingAll = capacities.reduce((acc, cap) => acc + (cap.pendingReviewCount || 0), 0);

  if (loading && !data) {
    return (
      <div className="w-full flex flex-col space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-lg w-64"/>
        <div className="h-[400px] bg-white border border-slate-100 rounded-2xl shadow-sm"/>
      </div>
    );
  }

  if (error) {
    return <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl text-center font-medium shadow-sm">{error}</div>;
  }

  const submittedSubmissions = selectedSolution?.submissions?.filter(s => s.status === "SUBMITTED") || [];
  const latestSubmission = submittedSubmissions.length > 0 ? submittedSubmissions[submittedSubmissions.length - 1] : null;

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">
      
      {/* ── SIDEBAR ── */}
      <div className="w-full lg:w-[320px] shrink-0 space-y-2">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 ml-1">Filter by Sub-problem</h3>
        
        <button
          onClick={() => setSelectedSubtaskId("ALL")}
          className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between shadow-sm cursor-pointer ${
            selectedSubtaskId === "ALL" ? "bg-emerald-600 border-emerald-600 text-white shadow-md" : "bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:shadow-md"
          }`}
        >
          <span className="font-bold text-sm">All Pending Solutions</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${selectedSubtaskId === "ALL" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
            {totalPendingAll}
          </span>
        </button>

        {capacities.map(cap => {
          const isSelected = selectedSubtaskId === cap.subtaskId;
          return (
            <button
              key={cap.subtaskId}
              onClick={() => setSelectedSubtaskId(cap.subtaskId)}
              className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col shadow-sm cursor-pointer ${
                isSelected ? "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500/20" : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md"
              }`}
            >
              <div className="flex justify-between items-start gap-2 w-full">
                <span className={`font-bold text-sm line-clamp-2 leading-snug flex-1 ${isSelected ? "text-emerald-900" : "text-slate-800"}`}>{cap.title}</span>
                {cap.pendingReviewCount > 0 && <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border ${isSelected ? "bg-emerald-100 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-700"}`}>{cap.pendingReviewCount} Pending</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── MAIN AREA ── */}
      <div className="w-full flex-1 flex flex-col min-w-0">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4 ml-1">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
            {selectedSubtaskId === "ALL" ? "Showing All Solutions" : "Filtered Solutions"} ({data?.totalElements || 0})
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            <div className="relative w-full sm:w-64 shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-slate-400" /></div>
              <input type="text" placeholder="Search solvers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm" />
              {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>}
            </div>
            <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm w-full sm:w-auto justify-center sm:justify-start">
              {(["newest-first", "oldest-first"] as SortOrder[]).map((opt) => (
                <button key={opt} onClick={() => setSortOrder(opt)} className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider cursor-pointer ${sortOrder === opt ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
                  {opt === "newest-first" ? "Newest" : "Oldest"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={`transition-opacity duration-300 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
          {!data || data.attempts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-emerald-400" /></div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">You're all caught up!</h3>
              <p className="text-sm text-slate-500 font-medium">There are no solutions waiting for your review.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-slate-300">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[35%]">Solver</th>
                      <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[30%]">Sub-Problem</th>
                      <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[20%]">Submitted</th>
                      <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right w-[15%]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.attempts.map((sol: SolutionAttemptSummary) => {
                      const isFetching = fetchingDetailsId === sol.id;
                      return (
                      <tr key={sol.id} onClick={() => handleOpenDetails(sol)} className="hover:bg-slate-50 transition-colors group cursor-pointer active:bg-slate-100">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {sol.profilePictureUrl ? (
                               <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0"><img src={sol.profilePictureUrl} alt={sol.solverFirstName} className="w-full h-full object-cover" /></div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200 shrink-0">{sol.solverFirstName[0]}{sol.solverLastName[0]}</div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">{sol.solverFirstName} {sol.solverLastName}</p>
                              <p className="text-[10px] text-slate-500 font-medium truncate">{sol.solverInstitution || "Independent"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-bold text-slate-700 truncate">{sol.targetSubtaskTitle}</td>
                        <td className="p-4 text-xs font-bold text-slate-600">{new Date(sol.updatedAt).toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                          <button disabled={isFetching} className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 px-4 py-2 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 ml-auto w-fit active:scale-95 cursor-pointer">
                            {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Review"}
                          </button>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
              
              {data.totalPages > 1 && (
                <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-2">
                    Showing {(page - 1) * 8 + 1}-{Math.min(page * 8, data.totalElements)} of {data.totalElements}
                  </span>
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                    <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="text-[11px] font-bold text-slate-700 px-3 py-1 bg-slate-50 rounded">Page {page} of {data.totalPages}</span>
                    <button onClick={() => setPage(p => p + 1)} disabled={page === data.totalPages} className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL CODE ─── */}
      {selectedSolution && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget && !actionLoading) setSelectedSolution(null); }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-slate-200">
              <div className="px-6 py-5 border-b border-slate-200 shrink-0 bg-slate-50/80 rounded-t-2xl z-10">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">{selectedSolution.solverFirstName} {selectedSolution.solverLastName}'s Solution</h2>
                    <p className="text-sm text-slate-500 font-medium">Sub-Problem: {selectedSolution.targetSubtaskTitle}</p>
                  </div>
                  <button onClick={() => setSelectedSolution(null)} disabled={actionLoading !== null} className="text-slate-400 hover:text-slate-700 bg-white border border-slate-200 w-10 h-10 flex items-center justify-center rounded-xl shadow-sm hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 shrink-0">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {metricsLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 animate-pulse">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-slate-100 border border-slate-200 rounded-xl" />)}
                  </div>
                ) : solverMetrics && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    {(() => {
                      const tier = getTierDetails(solverMetrics.solutionsCompleted);
                      return (
                        <div className={`p-3 rounded-xl border flex flex-col justify-center shadow-sm ${tier.color}`}>
                          <div className="flex items-center gap-1.5 mb-1 opacity-80"><span className="text-[10px] font-bold uppercase tracking-wider">Solver Tier</span></div>
                          <span className="text-sm font-black tracking-tight flex items-center gap-2">{tier.icon} {tier.name}</span>
                        </div>
                      );
                    })()}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Completed</span>
                      <span className="text-sm font-black text-slate-900">{solverMetrics.solutionsCompleted}</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Reliability</span>
                      <span className="text-sm font-black text-emerald-600">{solverMetrics.solutionsCompleted === 0 ? "N/A" : `${Math.round(solverMetrics.completionRate)}\%`}</span> </div> <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center"> <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Turnaround</span> <span className="text-sm font-black text-slate-900">{solverMetrics.avgTurnaroundDays ? `${Math.round(solverMetrics.avgTurnaroundDays)} days` : "N/A"}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
                <div className="mb-6 bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Final Solution Description
                  </h4>
                  <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                    {latestSubmission?.description || "No text provided."}
                  </div>
                </div>
                
                {latestSubmission?.fileUrls && latestSubmission.fileUrls.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                      Attachments
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {latestSubmission.fileUrls.map((url, idx) => (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:text-accent hover:border-accent hover:bg-accent/5 hover:shadow-md transition-all group cursor-pointer active:scale-[0.98]">
                          <div className="bg-slate-100 text-slate-600 p-2.5 rounded-lg group-hover:bg-accent group-hover:text-white transition-colors border border-slate-200 group-hover:border-accent">
                            <Paperclip className="w-4 h-4" />
                          </div>
                          <span className="truncate flex-1">{getFilenameFromUrl(url)}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 🚀 REJECTION FLOW UI */}
              {!isRejecting ? (
                <div className="p-5 border-t border-slate-200 bg-white flex justify-end gap-3 rounded-b-2xl">
                  <button onClick={() => setIsRejecting(true)} disabled={actionLoading !== null} className="px-6 py-2.5 text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer">
                    Reject Solution
                  </button>
                  <button onClick={() => handleEvaluation(selectedSolution.id, true)} disabled={actionLoading !== null} className="px-6 py-2.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer">
                    {actionLoading === selectedSolution.id ? "Approving..." : "Approve Solution"}
                  </button>
                </div>
              ) : (
                <div className="p-5 border-t border-slate-200 bg-white flex flex-col gap-3 rounded-b-2xl animate-in fade-in">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-bold text-slate-700">Reason for Rejection</label>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Required</span>
                  </div>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain what is missing or incorrect to help the solver improve..."
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all resize-none shadow-sm"
                    rows={3}
                  />
                  <div className="flex justify-end gap-3 mt-2">
                    <button onClick={() => { setIsRejecting(false); setRejectionReason(""); }} className="px-6 py-2.5 text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold transition-all cursor-pointer">
                      Cancel
                    </button>
                    <button onClick={() => handleEvaluation(selectedSolution.id, false)} disabled={!rejectionReason.trim() || actionLoading !== null} className="px-6 py-2.5 text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:bg-slate-300 rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer flex items-center gap-2">
                      {actionLoading === selectedSolution.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Confirm Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Portal>
      )}

      {notification && (
        <Portal>
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setNotification(null)}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 text-center border border-slate-100 max-w-sm">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner ${notification.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"}`}>
                {notification.type === "success" ? <CheckCircle className="w-7 h-7" /> : <X className="w-7 h-7" />}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{notification.type === "success" ? "Success!" : "Action Complete"}</h3>
              <p className="text-sm text-slate-600 mb-6">{notification.message}</p>
              <button onClick={() => setNotification(null)} className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-200 cursor-pointer active:scale-95">Continue</button>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}