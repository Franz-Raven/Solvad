"use client";

import React, { useState } from "react";
import { XCircle, FileCheck, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { submitFullAttempt, abandonClaim } from "../api/workspace";
import Portal from "@/components/portal";

interface AttemptActionsProps {
  attemptId: string;
  status: string;
  onSuccess: () => void;
  isSubmitting?: boolean;
}

export function AttemptActions({ attemptId, status, onSuccess, isSubmitting }: AttemptActionsProps) {
  const [loading, setLoading] = useState<"complete" | "abandon" | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showAbandonModal, setShowAbandonModal] = useState(false);

  const handleComplete = async () => {
    setLoading("complete");
    setError(null);
    try {
      await submitFullAttempt(attemptId);
      onSuccess();
      setShowCompleteModal(false);
    } catch (err: any) {
      setError(err.message || "Failed to complete attempt");
      setLoading(null);
    }
  };

  const handleAbandon = async () => {
    setLoading("abandon");
    setError(null);
    try {
      await abandonClaim(attemptId);
      onSuccess();
      setShowAbandonModal(false);
    } catch (err: any) {
      setError(err.message || "Failed to abandon attempt");
      setLoading(null);
    }
  };

  // Lock the workspace actions if it's pending review
  if (status === "PENDING_REVIEW") {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Loader2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5 animate-spin" />
        <div>
          <h4 className="text-sm font-bold text-blue-800">Under Review</h4>
          <p className="text-xs text-blue-700 mt-1 font-medium">Your solution has been submitted and is currently waiting for Seeker approval. Editing is disabled.</p>
        </div>
      </div>
    );
  }

  // Hide actions entirely if completed, abandoned, terminated, or rejected
  if (status === "COMPLETED" || status === "ABANDONED" || status === "TERMINATED" || status === "REJECTED") return null;

  return (
    <>
      {/* 🚀 CUSTOM COMPLETE MODAL */}
      {showCompleteModal && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => !loading && setShowCompleteModal(false)}>
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100" onClick={e => e.stopPropagation()}>
              <div className="p-8">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-emerald-100 shadow-sm">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Finalize & Submit?</h2>
                 <p className="text-slate-500 font-medium text-center text-sm leading-relaxed">
                  Are you sure you want to finalize and submit this attempt for Seeker review? You will not be able to edit your solutions once submitted.
                </p>
              </div>
              
              <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button onClick={() => setShowCompleteModal(false)} disabled={loading !== null} className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-full hover:bg-slate-50 transition-colors shadow-sm text-sm cursor-pointer disabled:opacity-50">
                  Go Back
                </button>
                <button onClick={handleComplete} disabled={loading !== null} className="flex-1 px-4 py-3 bg-emerald-600 text-white font-bold rounded-full hover:bg-emerald-700 transition-colors shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] text-sm flex justify-center items-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50">
                  {loading === "complete" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Submit Now"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* 🚀 CUSTOM ABANDON MODAL WITH RANK IMPLICATIONS */}
      {showAbandonModal && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => !loading && setShowAbandonModal(false)}>
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100" onClick={e => e.stopPropagation()}>
              <div className="p-8">
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-rose-100 shadow-sm">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Abandon Workspace?</h2>
                 <p className="text-slate-500 font-medium text-center text-sm leading-relaxed">
                  Are you sure you want to abandon this problem? This action counts as a failed solution and will negatively impact your <strong className="text-slate-700">Completion Rate</strong> and overall <strong className="text-slate-700">Solver Tier</strong>.
                </p>
              </div>
              
              <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button onClick={() => setShowAbandonModal(false)} disabled={loading !== null} className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-full hover:bg-slate-50 transition-colors shadow-sm text-sm cursor-pointer disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleAbandon} disabled={loading !== null} className="flex-1 px-4 py-3 bg-rose-600 text-white font-bold rounded-full hover:bg-rose-700 transition-colors shadow-sm text-sm flex justify-center items-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50">
                  {loading === "abandon" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Abandon"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      <div className="space-y-4">
        {error && (
          <div className="text-sm text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200 font-medium">
            {error}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowCompleteModal(true)}
            disabled={loading !== null || isSubmitting}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            {loading === "complete" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
            Finalize & Submit Solution
          </button>

          <button
            onClick={() => setShowAbandonModal(true)}
            disabled={loading !== null || isSubmitting}
            className="px-6 py-3 bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            {loading === "abandon" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Abandon
          </button>
        </div>
      </div>
    </>
  );
}