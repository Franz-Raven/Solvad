"use client";

import React, { useState } from "react";
import { XCircle, FileCheck, Loader2, AlertCircle } from "lucide-react";
// 🚀 FIXED: Imports correctly matched to your workspace.ts api
import { submitFullAttempt, abandonClaim } from "../api/workspace";

interface AttemptActionsProps {
  attemptId: string;
  status: string;
  onSuccess: () => void;
  isSubmitting?: boolean;
}

export function AttemptActions({ attemptId, status, onSuccess, isSubmitting }: AttemptActionsProps) {
  const [loading, setLoading] = useState<"complete" | "abandon" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    if (!window.confirm("Are you sure you want to finalize and submit this attempt for Seeker review?")) return;
    setLoading("complete");
    setError(null);
    try {
      await submitFullAttempt(attemptId);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to complete attempt");
    } finally {
      setLoading(null);
    }
  };

  const handleAbandon = async () => {
    if (!window.confirm("Are you sure you want to abandon this workspace? This cannot be undone.")) return;
    setLoading("abandon");
    setError(null);
    try {
      await abandonClaim(attemptId);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to abandon attempt");
    } finally {
      setLoading(null);
    }
  };

  // 🚀 Lock the workspace actions if it's pending review
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

  // 🚀 Hide actions entirely if completed, abandoned, terminated, or rejected
  if (status === "COMPLETED" || status === "ABANDONED" || status === "TERMINATED" || status === "REJECTED") return null;

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200 font-medium">
          {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleComplete}
          disabled={loading !== null || isSubmitting}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        >
          {loading === "complete" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
          Finalize & Submit Solution
        </button>

        <button
          onClick={handleAbandon}
          disabled={loading !== null || isSubmitting}
          className="px-6 py-3 bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        >
          {loading === "abandon" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
          Abandon
        </button>
      </div>
    </div>
  );
}