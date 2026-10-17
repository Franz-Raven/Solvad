"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Loader2, X, Shield, ShieldHalf, ShieldCheck, Award, Clock, Activity, Search, ChevronLeft, ChevronRight, CheckCircle, Paperclip } from "lucide-react";
import { getPendingSolutions, evaluateSolution } from "../api/problem";
import { getSolverMetrics } from "../api/problem";
import type { SolutionAttemptResponse, SolverMetrics } from "@/types/attempt";
import type { ProblemResponse } from "@/types/problem";
import { useAuth } from "@/context/auth-context";

type SortOrder = "newest-first" | "oldest-first";

interface ReviewSolutionsTabProps {
  problem: ProblemResponse;
}

export function ReviewSolutionsTab({ problem }: ReviewSolutionsTabProps) {
  const [solutions, setSolutions] = useState<SolutionAttemptResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortOrder, setSortOrder] = useState<SortOrder>("newest-first");
  const [searchQuery, setSearchQuery] = useState("");
  
  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedSolution, setSelectedSolution] = useState<SolutionAttemptResponse | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [solverMetrics, setSolverMetrics] = useState<SolverMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  useEffect(() => { fetchData(); }, [problem.id]);

  useEffect(() => {
    if (selectedSolution) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedSolution]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getPendingSolutions(problem.id);
      setSolutions(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch solutions");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = async (solution: SolutionAttemptResponse) => {
    setSelectedSolution(solution);
    setSolverMetrics(null);
    setMetricsLoading(true);
    
    try {
      if (solution.solverId) {
        // You might need to import apiRequest and call `/merit/solver/${solution.solverId}` directly if getSolverMetrics is unavailable
        const { apiRequest } = await import("@/lib/api");
        const metrics = await apiRequest<SolverMetrics>(`/merit/solver/${solution.solverId}`);
        setSolverMetrics(metrics);
      } else {
        setSolverMetrics({ solutionsCompleted: 0, completionRate: 0, avgTurnaroundDays: null });
      }
    } catch(err) {
      setSolverMetrics({ solutionsCompleted: 0, completionRate: 0, avgTurnaroundDays: null });
    } finally {
      setMetricsLoading(false);
    }
  };

  const handleEvaluation = async (attemptId: string, isApproved: boolean) => {
    setActionLoading(attemptId);
    try {
      await evaluateSolution(attemptId, isApproved);
      await fetchData(); 
      setSelectedSolution(null);
      setNotification({ type: "success", message: isApproved ? "Solution approved! Merit awarded to solver." : "Solution rejected and returned to solver." });
    } catch (err: any) {
      setNotification({ type: "error", message: `Evaluation failed: ${err.message}` });
    } finally {
      setActionLoading(null);
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

  const filteredData = useMemo(() => {
    return solutions
      .filter(s => `${s.solverFirstName} ${s.solverLastName}`.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        const timeA = new Date(a.updatedAt).getTime();
        const timeB = new Date(b.updatedAt).getTime();
        return sortOrder === "newest-first" ? timeB - timeA : timeA - timeB;
      });
  }, [solutions, sortOrder, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const visibleSolutions = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="w-full flex flex-col space-y-4 animate-in fade-in duration-500">
        <div className="h-10 bg-slate-200 rounded-lg w-64 animate-pulse"/>
        <div className="h-[400px] bg-white border border-slate-100 rounded-2xl shadow-sm animate-pulse"/>
      </div>
    );
  }

  if (error) {
    return <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl text-center font-medium shadow-sm animate-in fade-in duration-300">{error}</div>;
  }

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
          Pending Solutions ({filteredData.length})
        </h3>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <div className="relative w-full sm:w-64 shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search solvers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm w-full sm:w-auto justify-center sm:justify-start">
            {(["newest-first", "oldest-first"] as SortOrder[]).map((opt) => (
              <button
                key={opt}
                onClick={() => setSortOrder(opt)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all uppercase tracking-wider ${sortOrder === opt ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm" : "bg-transparent border border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
              >
                {opt === "newest-first" ? "Newest" : "Oldest"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 p-16 text-center animate-in fade-in duration-500">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">You're all caught up!</h3>
          <p className="text-sm text-slate-500 font-medium">There are no solutions waiting for your review.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.02)] transition-colors hover:border-slate-300">
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
                {visibleSolutions.map(sol => {
                  const isFetching = actionLoading === sol.id;
                  
                  return (
                  <tr key={sol.id} onClick={() => handleOpenDetails(sol)} className="hover:bg-slate-50 transition-colors group cursor-pointer active:bg-slate-100">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {sol.profilePictureUrl ? (
                           <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                             <img src={sol.profilePictureUrl} alt={sol.solverFirstName} className="w-full h-full object-cover" />
                           </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200 shrink-0">
                            {sol.solverFirstName[0]}{sol.solverLastName[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{sol.solverFirstName} {sol.solverLastName}</p>
                          <p className="text-[10px] text-slate-500 font-medium truncate">{sol.institution || "Independent"}</p>
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
          
          {totalPages > 1 && (
            <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-2">
                Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length)} of {filteredData.length}
              </span>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-bold text-slate-700 px-3 py-1 bg-slate-50 rounded">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── REVIEW SOLUTION MODAL ─── */}
      {selectedSolution && (
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  {(() => {
                    const tier = getTierDetails(solverMetrics.solutionsCompleted);
                    return (
                      <div className={`p-3 rounded-xl border flex flex-col justify-center shadow-sm transition-colors ${tier.color}`}>
                        <div className="flex items-center gap-1.5 mb-1 opacity-80"><span className="text-[10px] font-bold uppercase tracking-wider">Solver Tier</span></div>
                        <span className="text-sm font-black tracking-tight flex items-center gap-2">{tier.icon} {tier.name}</span>
                      </div>
                    );
                  })()}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center transition-all">
                    <div className="flex items-center gap-1.5 mb-1 text-slate-500">
                      <Shield className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Completed</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">{solverMetrics.solutionsCompleted}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center transition-all">
                    <div className="flex items-center gap-1.5 mb-1 text-slate-500">
                      <Activity className="w-3.5 h-3.5 text-accent" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Reliability</span>
                    </div>
                    <span className={`text-sm font-black ${solverMetrics.solutionsCompleted === 0 ? "text-slate-900" : solverMetrics.completionRate >= 80 ? "text-emerald-600" : solverMetrics.completionRate >= 50 ? "text-amber-600" : "text-rose-600"}`}>{solverMetrics.solutionsCompleted === 0 ? "N/A" : `${Math.round(solverMetrics.completionRate)}%`}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center transition-all">
                    <div className="flex items-center gap-1.5 mb-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Turnaround</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">{solverMetrics.avgTurnaroundDays ? `${Math.round(solverMetrics.avgTurnaroundDays)} days` : "N/A"}</span>
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
                  {selectedSolution.submissions && selectedSolution.submissions.length > 0 
                    ? selectedSolution.submissions[selectedSolution.submissions.length - 1].description 
                    : "No text provided."}
                </div>
              </div>
              
              {selectedSolution.submissions && selectedSolution.submissions.length > 0 && selectedSolution.submissions[selectedSolution.submissions.length - 1].fileUrls && selectedSolution.submissions[selectedSolution.submissions.length - 1].fileUrls.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    Attachments
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedSolution.submissions[selectedSolution.submissions.length - 1].fileUrls.map((url, idx) => (
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

            <div className="p-5 border-t border-slate-200 bg-white flex justify-end gap-3 rounded-b-2xl">
              <button onClick={() => handleEvaluation(selectedSolution.id, false)} disabled={actionLoading !== null} className="px-6 py-2.5 text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer">
                {actionLoading === selectedSolution.id ? "Rejecting..." : "Reject Solution"}
              </button>
              <button onClick={() => handleEvaluation(selectedSolution.id, true)} disabled={actionLoading !== null} className="px-6 py-2.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer">
                {actionLoading === selectedSolution.id ? "Approving..." : "Approve Solution"}
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setNotification(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 text-center border border-slate-100 max-w-sm">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner ${notification.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"}`}>
              {notification.type === "success" 
                ? <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                : <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              }
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{notification.type === "success" ? "Success!" : "Action Complete"}</h3>
            <p className="text-sm text-slate-600 mb-6">{notification.message}</p>
            <button onClick={() => setNotification(null)} className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-200 cursor-pointer active:scale-95">Continue</button>
          </div>
        </div>
      )}
    </div>
  );
}