"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProblemById } from "@/lib/api/problem";
import { getMyAttempt, abandonClaim, submitFullAttempt } from "@/lib/api/attempts";
import type { ProblemResponse } from "@/types/problem";
import type { SolutionAttemptResponse } from "@/types/attempt";
import { SubtaskForm } from "@/components/solver-workspace/SubtaskForm";


type ModalType = "abandon" | "submit" | null;

export default function SolverWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const problemId = params.id as string;
  

  const [problem, setProblem] = useState<ProblemResponse | null>(null);
  const [attempt, setAttempt] = useState<SolutionAttemptResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubtaskId, setActiveSubtaskId] = useState<string | null>(null);
  
  const [isAbandoning, setIsAbandoning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  

  const fetchWorkspace = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const probData = await getProblemById(problemId);
      setProblem(probData);

      let attemptData: SolutionAttemptResponse | null = null;
      try {
        attemptData = await getMyAttempt(problemId);
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
        attemptData = await getMyAttempt(problemId);
      }
      setAttempt(attemptData);

      setActiveSubtaskId(prev => {
        const target = attemptData.targetSubtaskId
            ? probData.subtasks.find((s) => s.id === attemptData.targetSubtaskId)
            : probData.subtasks[0];
          if (!prev && target) {
            return target.id;
          }
        return prev;
      });
      
    } catch (err: any) {
      setError(err.message || "Failed to load workspace data.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [problemId]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  useEffect(() => {
    if (activeModal) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [activeModal]);

  const executeAbandon = async () => {
  setIsAbandoning(true);
  try {
    await abandonClaim(attempt!.id); // pass attempt.id, not problemId
    router.push("/solver/dashboard");
  } catch (err: any) {
    setError(err.message || "Failed to abandon claim");
    setIsAbandoning(false);
    setActiveModal(null);
  }
};

  const executeFinalSubmit = async () => {
    if (!attempt) return;
    setIsSubmitting(true);
    try {
      await submitFullAttempt(attempt.id);
      router.push("/solver/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to submit final solution");
      setIsSubmitting(false);
      setActiveModal(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium text-sm">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !problem || !attempt) {
    
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Workspace Unavailable</h2>
          <p className="text-gray-600 mb-6 text-sm">{error || "Make sure you have an active claim."}</p>
          <Link href="/solver/dashboard" className="w-full inline-block px-4 py-2 bg-accent text-white rounded-lg hover:bg-secondary transition-colors font-medium">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const workspaceSubtasks = attempt.targetSubtaskId
    ? problem.subtasks.filter((s) => s.id === attempt.targetSubtaskId)
    : problem.subtasks;

  const submittedCount = attempt.submissions.filter((s) => s.status === "SUBMITTED").length;
  const activeSubtask = problem.subtasks.find((s) => s.id === activeSubtaskId);
  const existingSubmission = activeSubtask ? attempt.submissions.find((s) => s.subtaskId === activeSubtask.id) : undefined;
  



  const isForked = !!attempt.parentAttemptId; 

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* ── Custom Confirmation Modals ── */}
      {activeModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${activeModal === 'abandon' ? 'bg-red-100 text-red-600' : 'bg-accent/10 text-accent'}`}>
                {activeModal === 'abandon' ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                {activeModal === 'abandon' ? "Abandon Workspace?" : "Submit Final Project?"}
              </h2>
              
              <p className="text-gray-600 text-center text-sm">
                {activeModal === 'abandon' 
                  ? "Are you sure you want to abandon this problem? It will become available for other solvers immediately."
                  : "Are you sure you want to submit your final solution? You won't be able to edit this attempt anymore."}
              </p>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setActiveModal(null)}
                disabled={isAbandoning || isSubmitting}
                className="flex-1 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={activeModal === 'abandon' ? executeAbandon : executeFinalSubmit}
                disabled={isAbandoning || isSubmitting}
                className={`flex-1 px-4 py-2.5 text-white font-semibold rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2 ${
                  activeModal === 'abandon' ? 'bg-red-600 hover:bg-red-700' : 'bg-accent hover:bg-secondary'
                }`}
              >
                {(isAbandoning || isSubmitting) && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {activeModal === 'abandon' ? (isAbandoning ? 'Abandoning...' : 'Yes, Abandon') : (isSubmitting ? 'Submitting...' : 'Yes, Submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <Link href={`/solver/problem/${problemId}`} className="text-sm font-medium text-gray-500 hover:text-accent flex items-center gap-1.5 transition-colors whitespace-nowrap">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Details
            </Link>
            <div className="h-4 w-px bg-gray-300" />
            <h1 className="text-base font-bold text-gray-900 truncate">
              {problem.title}
            </h1>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2 text-sm font-medium">
              <span className="text-gray-500">Progress:</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${submittedCount === problem.subtasks.length ? 'bg-green-100 text-green-700' : 'bg-accent/10 text-accent'}`}>
                {submittedCount} / {workspaceSubtasks.length}
              </span>
            </div>
            <button
              onClick={() => setActiveModal('abandon')}
              disabled={isAbandoning || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              Abandon
            </button>
            <button
              onClick={() => setActiveModal('submit')}
              disabled={isSubmitting || isAbandoning || submittedCount === 0}
              className="px-5 py-2 text-sm font-semibold bg-secondary hover:bg-accent text-white rounded-lg transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              Submit Project
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8 flex flex-col lg:flex-row gap-8">
        
        <aside className="lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-bold text-gray-900">Task Modules</h2>
              <p className="text-xs text-gray-500 mt-1">Complete at least one to finish.</p>
            </div>
            <div className="divide-y divide-gray-50 p-2">
              {workspaceSubtasks.map((subtask, index) => {
                const submission = attempt.submissions.find((s) => s.subtaskId === subtask.id);
                const isActive = subtask.id === activeSubtaskId;
                const isSubmitted = submission?.status === "SUBMITTED";
                const isDraft = submission?.status === "DRAFT";

                return (
                  <button
                    key={subtask.id}
                    onClick={() => setActiveSubtaskId(subtask.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-start gap-3 my-1 ${
                      isActive
                        ? "bg-accent/5 ring-1 ring-accent/20 shadow-sm"
                        : "hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 transition-colors ${
                      isSubmitted ? "bg-green-100 text-green-700 ring-1 ring-green-200" :
                      isDraft ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200" :
                      isActive ? "bg-accent text-white shadow-md" : "bg-gray-100 text-gray-500"
                    }`}>
                      {isSubmitted ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : index + 1}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <p className={`text-sm font-semibold truncate ${isActive ? 'text-accent' : 'text-gray-900'}`}>
                        {subtask.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider truncate">
                          {subtask.departmentFocus}
                        </p>
                        {isDraft && !isSubmitted && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Draft saved" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="flex-1 min-w-0">
          {activeSubtask ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-md">
                    Module {workspaceSubtasks.findIndex((s) => s.id === activeSubtask.id) + 1}
                  </span>
                  <span className="px-3 py-1 bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-wider rounded-md">
                    {activeSubtask.departmentFocus}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">{activeSubtask.title}</h2>
                <p className="text-gray-600 leading-relaxed">{activeSubtask.description}</p>
              </div>
              
              <SubtaskForm
                attemptId={attempt.id}
                subtask={activeSubtask}
                existingDescription={existingSubmission?.description ?? ""}
                existingDelta={existingSubmission?.deltaDescription ?? ""}
                existingFiles={existingSubmission?.fileUrls ?? []}
                submissionId={existingSubmission?.id}
                isSubmitted={existingSubmission?.status === "SUBMITTED"}
                isForked={isForked}
                
                // USE THE EXACT FIELD NAMES FROM YOUR JSON PAYLOAD
                parentDescription={attempt.parentDescription ?? undefined}
                parentFiles={attempt.parentFileUrls ?? []}
                
                onSuccess={() => fetchWorkspace(false)} 
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-white rounded-2xl border border-dashed border-gray-300 p-12">
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-gray-500 font-medium">Select a module from the left to begin working.</p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}