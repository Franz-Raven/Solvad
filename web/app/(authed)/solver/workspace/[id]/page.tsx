"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Building2, ExternalLink, AlertTriangle, Loader2 } from "lucide-react";
import { getProblemById } from "../../problem/[id]/api/problem";
import { getMyAttempt, abandonClaim } from "./api/workspace";
import { getMyActiveAttempts } from "../../dashboard/api/dashboard";
import type { ProblemResponse } from "@/types/problem";
import type { SolutionAttemptResponse } from "@/types/attempt";
import { SubtaskForm } from "./component/SubtaskForm";

export default function SolverWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const problemId = params.id as string;
  
  const [problem, setProblem] = useState<ProblemResponse | null>(null);
  const [attempt, setAttempt] = useState<SolutionAttemptResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isAbandoning, setIsAbandoning] = useState(false);
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); 
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  
  const fetchWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      const probData = await getProblemById(problemId);
      setProblem(probData);

      let attemptData: SolutionAttemptResponse | undefined;
      try {
        attemptData = await getMyAttempt(problemId);
      } catch {
        const allAttempts = await getMyActiveAttempts();
        attemptData = allAttempts.find(a => 
          a.problemId === problemId && 
          (a.status === "ACTIVE" || a.status === "PENDING_REVIEW" || a.status === "REJECTED")
        );
        
        if (!attemptData) {
          throw new Error("No active attempt found.");
        }
      }
      
      setAttempt(attemptData);
    } catch (err: any) {
      setError(err.message || "Failed to load workspace data.");
    } finally {
      setLoading(false);
    }
  }, [problemId]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  useEffect(() => {
    if (showAbandonModal || showUnsavedModal) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [showAbandonModal, showUnsavedModal]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!hasUnsavedChanges) return;
      
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      
      if (anchor && anchor.href && anchor.target !== "_blank") {
        if (anchor.href === window.location.href) return; 

        e.preventDefault();
        e.stopPropagation();
        
        setPendingUrl(anchor.href);
        setShowUnsavedModal(true);
      }
    };
    
    window.addEventListener("click", handleClick, { capture: true });
    return () => window.removeEventListener("click", handleClick, { capture: true });
  }, [hasUnsavedChanges]);

  const executeAbandon = async () => {
    setIsAbandoning(true);
    try {
      setHasUnsavedChanges(false); 
      await abandonClaim(attempt!.id); 
      router.push("/solver/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to abandon claim");
      setIsAbandoning(false);
      setShowAbandonModal(false);
    }
  };

  const handleGoBack = () => {
    if (hasUnsavedChanges) {
      setPendingUrl(`/solver/dashboard?tab=workspace`);
      setShowUnsavedModal(true);
      return;
    }
    router.push(`/solver/dashboard?tab=workspace`);
  };

  const confirmLeave = () => {
    setHasUnsavedChanges(false);
    setShowUnsavedModal(false);
    if (pendingUrl) {
      router.push(pendingUrl);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col animate-in fade-in duration-500">
        <header className="bg-white/95 border-b border-slate-200 shadow-sm h-16 flex items-center px-6">
          <div className="max-w-6xl mx-auto w-full flex justify-between items-center">
            <div className="w-48 h-5 bg-slate-200 rounded-md animate-pulse" />
            <div className="w-32 h-8 bg-slate-100 rounded-lg animate-pulse" />
          </div>
        </header>
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-6">
          <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-slate-100 p-6 md:p-8 flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <div className="w-32 h-6 bg-slate-100 rounded-md animate-pulse" />
              <div className="w-3/4 h-8 bg-slate-200 rounded-md animate-pulse" />
              <div className="w-full h-24 bg-slate-50 rounded-xl animate-pulse mt-4" />
            </div>
            <div className="w-full md:w-80 h-48 bg-slate-50 rounded-2xl animate-pulse shrink-0 border border-slate-100" />
          </div>
          <div className="h-[500px] bg-white border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.02)] p-8 animate-pulse">
            <div className="w-48 h-6 bg-slate-200 rounded-md mb-8" />
            <div className="w-full h-64 bg-slate-50 rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !problem || !attempt) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-8 flex items-center justify-center animate-in fade-in duration-500">
        <div className="max-w-md w-full bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-rose-100 p-8 text-center">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-rose-100 shadow-sm">
            <AlertCircle className="w-7 h-7 text-rose-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Workspace Unavailable</h2>
          <p className="text-slate-600 mb-6 text-sm font-medium">{error || "Make sure you have an active claim."}</p>
          <Link href="/solver/dashboard?tab=workspace" className="w-full inline-block px-6 py-3.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors font-bold shadow-sm active:scale-[0.98]">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const activeSubtask = attempt.targetSubtaskId 
    ? problem.subtasks.find(s => s.id === attempt.targetSubtaskId) || problem.subtasks[0]
    : problem.subtasks[0];

  const existingSubmission = activeSubtask ? attempt.submissions.find((s) => s.subtaskId === activeSubtask.id) : undefined;
  const isForked = !!attempt.parentAttemptId; 
  
  const seekerName = attempt.seekerName || "Industry Partner";
  const seekerProfileUrl = attempt.seekerProfileUrl || null;
  const isReadOnly = attempt.status === "PENDING_REVIEW" || attempt.status === "REJECTED";

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans animate-in fade-in duration-500">
      
      {showAbandonModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-rose-50 text-rose-600 border border-rose-100 shadow-sm">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Abandon Workspace?</h2>
              <p className="text-slate-500 font-medium text-center text-sm leading-relaxed">
                Are you sure you want to abandon this problem? It will become available for other solvers immediately.
              </p>
            </div>
            
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowAbandonModal(false)} disabled={isAbandoning} className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-full hover:bg-slate-50 transition-colors shadow-sm text-sm disabled:opacity-50 cursor-pointer">
                Cancel
              </button>
              <button onClick={executeAbandon} disabled={isAbandoning} className="flex-1 px-4 py-3 text-white font-bold rounded-full transition-colors shadow-sm text-sm disabled:opacity-50 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 cursor-pointer">
                {isAbandoning && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {isAbandoning ? 'Abandoning...' : 'Yes, Abandon'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUnsavedModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-rose-50 text-rose-600 border border-rose-100 shadow-sm">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Unsaved Changes</h2>
              <p className="text-slate-500 font-medium text-center text-sm leading-relaxed">
                You have unsaved edits in your workspace. Are you sure you want to leave without saving? Your progress will be lost.
              </p>
            </div>
            
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button onClick={() => { setShowUnsavedModal(false); setPendingUrl(null); }} className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-full hover:bg-slate-50 transition-colors shadow-sm text-sm cursor-pointer">
                Keep Editing
              </button>
              <button onClick={confirmLeave} className="flex-1 px-4 py-3 text-white font-bold rounded-full transition-colors shadow-sm text-sm flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 cursor-pointer">
                Leave Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white/95 backdrop-blur border-b border-slate-200 relative z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <button onClick={handleGoBack} className="text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-emerald-600 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer">
              <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <h1 className="text-sm font-bold text-slate-900 truncate hidden sm:block">
              {problem.title}
            </h1>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            {!isReadOnly && (
              <button
                onClick={() => setShowAbandonModal(true)}
                disabled={isAbandoning}
                className="px-4 py-2 text-sm font-bold text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                Abandon Project
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-6">
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 p-6 md:p-8 flex flex-col md:flex-row gap-8">
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-emerald-100">
                {activeSubtask.departmentFocus}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subtask Module</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">{activeSubtask.title}</h2>
            <p className="text-slate-600 font-medium leading-relaxed">{activeSubtask.description}</p>
          </div>

          <div className="w-full md:w-80 bg-slate-50/50 rounded-2xl p-6 border border-slate-100 h-fit flex flex-col gap-6 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                {seekerProfileUrl ? (
                  <img src={seekerProfileUrl} alt={seekerName} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Requested By</p>
                <p className="text-sm font-bold text-slate-900 truncate" title={seekerName}>
                  {seekerName}
                </p>
              </div>
            </div>

            <Link
              href={`/solver/problem/${problemId}`}
              target="_blank"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:text-emerald-600 transition-colors shadow-sm text-xs cursor-pointer active:scale-[0.98]"
            >
              View Full Details <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 🚀 READ-ONLY BANNERS */}
        {attempt.status === "PENDING_REVIEW" && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-5 mt-2 rounded-r-xl shadow-sm flex items-start gap-4 animate-in fade-in">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-blue-900">Solution Under Review</h3>
              <p className="text-sm text-blue-700 mt-1 font-medium">
                You have submitted this workspace to the Seeker. It is currently locked and read-only until they approve or reject it.
              </p>
            </div>
          </div>
        )}

        {attempt.status === "REJECTED" && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-5 mt-2 rounded-r-xl shadow-sm flex items-start gap-4 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-rose-900">Solution Rejected</h3>
              <p className="text-sm text-rose-700 mt-1 font-medium">
                This workspace was rejected by the Seeker and is permanently locked. You can view their feedback in your History tab.
              </p>
              <Link href={`/solver/history/${attempt.id}`} className="inline-block mt-3 px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-rose-700 transition-colors">
                View Rejection Feedback
              </Link>
            </div>
          </div>
        )}

        <SubtaskForm
          attemptId={attempt.id}
          subtask={activeSubtask}
          existingDescription={existingSubmission?.description ?? ""}
          existingDelta={existingSubmission?.deltaDescription ?? ""}
          isSubmitted={existingSubmission?.status === "SUBMITTED"}
          isForked={isForked}
          parentDescription={attempt.parentDescription ?? undefined}
          onDirtyStateChange={setHasUnsavedChanges} 
          isReadOnly={isReadOnly}
        />
      </main>
    </div>
  );
}