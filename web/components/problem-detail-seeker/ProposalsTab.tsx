"use client";

import { useState, useEffect } from "react";
import { getPendingProposals, evaluateProposal } from "@/lib/api/problem";
import type { ClaimRequestResponse } from "@/types/attempt";

export function ProposalsTab({ problemId }: { problemId: string }) {
  const [proposals, setProposals] = useState<ClaimRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const data = await getPendingProposals(problemId);
        setProposals(data || []);
      } catch (err: any) {
        setError(err.message || "Failed to load proposals.");
      } finally {
        setLoading(false);
      }
    };
    fetchProposals();
  }, [problemId]);

  const handleEvaluate = async (proposalId: string, isApproved: boolean) => {
    setActionLoading(proposalId);
    try {
      await evaluateProposal(proposalId, isApproved);
      // Remove the evaluated proposal from the UI immediately
      setProposals(proposals.filter((p) => p.id !== proposalId));
    } catch (err: any) {
      alert(err.message || "Failed to evaluate proposal. The 3-solver limit may have been reached.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center p-12">
      <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
  
  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700 text-sm font-medium">
      {error}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pending Proposals</h2>
          <p className="text-sm text-gray-500 mt-1">Approve proposals to generate active workspaces. You may have a maximum of 3 concurrent solvers at a time.</p>
        </div>
      </div>

      {proposals.length === 0 ? (
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-16 text-center shadow-inner">
          <div className="w-20 h-20 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-5 border border-gray-100">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No pending proposals</h3>
          <p className="text-gray-500 text-sm">When solvers request to work on your problem, their proposals will appear here for your review.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {proposals.map((proposal) => (
            <div key={proposal.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:border-accent/30 transition-colors group">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h4 className="text-lg font-bold text-gray-900 group-hover:text-accent transition-colors">
                    {proposal.solver.firstName} {proposal.solver.lastName}
                  </h4>
                  <p className="text-xs font-semibold text-gray-500 tracking-wide uppercase mt-1">
                    Student Researcher
                  </p>
                </div>
                <span className="text-[11px] font-bold px-3 py-1 bg-gray-100 text-gray-500 rounded-full border border-gray-200">
                  {new Date(proposal.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 mb-6">
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Proposed Approach</h5>
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {proposal.proposedApproach}
                </p>
              </div>
              
              <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
                <button
                  onClick={() => handleEvaluate(proposal.id, false)}
                  disabled={actionLoading === proposal.id}
                  className="px-6 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 font-semibold rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleEvaluate(proposal.id, true)}
                  disabled={actionLoading === proposal.id}
                  className="px-6 py-2.5 bg-secondary hover:bg-accent text-white font-bold rounded-lg shadow-sm transition-all text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading === proposal.id ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating Workspace…</>
                  ) : (
                    "Approve & Generate Workspace ✓"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}