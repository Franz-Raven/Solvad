"use client";

import { useState, useEffect } from "react";
import { submitProposal } from "@/lib/api/attempts";
import type { ProposalRequest } from "@/types/attempt";

interface SubmitProposalModalProps {
  problemId: string;
  parentAttemptId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SubmitProposalModal({
  problemId,
  parentAttemptId,
  onClose,
  onSuccess,
}: SubmitProposalModalProps) {
  const [proposedApproach, setProposedApproach] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden"; // Prevent background scrolling
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: ProposalRequest = {
        proposedApproach,
        parentAttemptId: parentAttemptId || undefined,
        supportingDocuments: [], // Cloudinary implementation can be added here later if Seekers require attachments upfront
      };

      await submitProposal(problemId, payload);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to submit proposal. You may already have a pending proposal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        // Close if clicking the backdrop
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 p-6 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header matching dashboard aesthetic */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-accent/20 to-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0">
             <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
             </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Submit Solution Proposal
          </h2>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Outline how you plan to approach this problem. The Seeker will review this before granting you an active workspace.
          {parentAttemptId && (
            <span className="block mt-2 font-medium text-accent bg-accent/10 px-3 py-1.5 rounded-md border border-accent/20">
              You are proposing to build upon an existing solution.
            </span>
          )}
        </p>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Proposed Approach
            </label>
            <textarea
              required
              rows={6}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 resize-none text-sm"
              placeholder="I will approach this by initially mapping out the database schema, then..."
              value={proposedApproach}
              onChange={(e) => setProposedApproach(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !proposedApproach.trim()}
              className="px-5 py-2.5 bg-secondary hover:bg-accent text-white font-semibold rounded-lg transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</>
              ) : (
                "Submit Proposal"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}