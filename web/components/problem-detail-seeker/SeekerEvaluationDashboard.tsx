"use client";

import React, { useEffect, useState } from "react";
import { getPendingProposals, evaluateProposal } from "@/lib/api/problem";
import type { ClaimRequestResponse } from "@/types/attempt";

interface EvaluationDashboardProps {
  problemId: string;
}

export default function SeekerEvaluationDashboard({ problemId }: EvaluationDashboardProps) {
  const [proposals, setProposals] = useState<ClaimRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingProposals();
  }, [problemId]);

  const fetchPendingProposals = async () => {
    try {
      const data = await getPendingProposals(problemId);
      setProposals(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch proposals");
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluation = async (proposalId: string, isApproved: boolean) => {
    setActionLoading(proposalId);
    try {
      await evaluateProposal(proposalId, isApproved);
      // Remove the evaluated proposal from the UI
      setProposals((prev) => prev.filter((p) => p.id !== proposalId));
    } catch (err: any) {
      alert(`Evaluation failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Helper to extract a clean filename from the Cloudinary URL
  const getFilenameFromUrl = (url: string) => {
    try {
      const decoded = decodeURIComponent(url);
      const parts = decoded.split("/");
      return parts[parts.length - 1] || "Attachment";
    } catch {
      return "Attachment";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex justify-center">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">{error}</div>;
  }

  if (proposals.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500 font-medium">No pending proposals right now.</p>
        <p className="text-sm text-gray-400 mt-1">When Solvers submit an approach, they will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">Pending Solver Proposals</h3>
        <p className="text-sm text-gray-500 mt-1">
          Review approaches and approve up to 3 concurrent Solvers to work on this problem.
        </p>
      </div>

      <div className="space-y-4">
        {proposals.map((proposal) => (
          <div key={proposal.id} className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm transition-all hover:shadow-md">
            
            {/* Header: Solver Info & Date */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                  {proposal.solver.firstName.charAt(0)}{proposal.solver.lastName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{proposal.solver.firstName} {proposal.solver.lastName}</h4>
                  <p className="text-xs text-gray-500">Submitted {new Date(proposal.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            
            {/* Proposed Approach Text */}
            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 mb-4 whitespace-pre-wrap border border-gray-100">
              <strong className="block text-gray-900 mb-2">Proposed Approach:</strong>
              {proposal.proposedApproach}
            </div>

            {/* Clickable Attachments Section */}
            {proposal.supportingDocuments && proposal.supportingDocuments.length > 0 && (
              <div className="mb-5">
                <strong className="block text-sm font-semibold text-gray-900 mb-2">Supporting Documents:</strong>
                <div className="flex flex-wrap gap-2">
                  {proposal.supportingDocuments.split(",").map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-secondary hover:bg-gray-50 hover:border-secondary transition-colors shadow-sm group"
                    >
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-secondary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="truncate max-w-[200px] font-medium">{getFilenameFromUrl(url)}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                onClick={() => handleEvaluation(proposal.id, false)}
                disabled={actionLoading === proposal.id}
                className="px-5 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => handleEvaluation(proposal.id, true)}
                disabled={actionLoading === proposal.id}
                className="px-5 py-2 text-white bg-secondary hover:bg-accent rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {actionLoading === proposal.id ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Approving...</>
                ) : (
                  "Approve Workspace"
                )}
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}