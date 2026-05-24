"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";

interface Proposal {
  id: string;
  solver: {
    id: string;
    firstName: string;
    lastName: string;
    institution: string;
    degreeProgram: string;
  };
  proposedApproach: string;
  supportingDocuments: string;
  status: string;
  createdAt: string;
}

export function ProposalsTab({ problemId }: { problemId: string }) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const data = await apiRequest<Proposal[]>(`/problems/${problemId}/proposals/pending`);
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
    try {
      await apiRequest(`/proposals/${proposalId}/evaluate?isApproved=${isApproved}`, {
        method: "POST"
      });
      setProposals(proposals.filter(p => p.id !== proposalId));
    } catch (err: any) {
      alert(err.message || "Failed to evaluate proposal");
    }
  };

  if (loading) return <div className="p-4 font-inter text-gray-900">Loading proposals...</div>;
  if (error) return <div className="p-4 font-inter text-gray-900 bg-gray-100 border border-gray-300">{error}</div>;

  return (
    <div className="space-y-6 font-inter">
      <h3 className="text-xl font-bold text-gray-900">Pending Proposals</h3>
      {proposals.length === 0 ? (
        <p className="text-gray-900 bg-gray-100 p-6 border border-gray-300 text-center">
          No pending proposals at this time.
        </p>
      ) : (
        <div className="grid gap-6">
          {proposals.map((proposal) => (
            <div key={proposal.id} className="bg-white border border-gray-300 p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-bold text-gray-900">
                    {proposal.solver.firstName} {proposal.solver.lastName}
                  </h4>
                  <p className="text-sm text-gray-700">
                    {proposal.solver.degreeProgram} @ {proposal.solver.institution}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Submitted on {new Date(proposal.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="bg-gray-100 p-4 border border-gray-200 mb-6">
                <h5 className="text-sm font-bold text-gray-900 mb-2">Proposed Approach:</h5>
                <p className="text-gray-800 whitespace-pre-wrap">{proposal.proposedApproach}</p>
              </div>
              
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => handleEvaluate(proposal.id, false)}
                  className="px-4 py-2 border border-gray-900 text-gray-900 hover:bg-gray-100 font-bold transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleEvaluate(proposal.id, true)}
                  className="px-4 py-2 bg-gray-900 text-white hover:bg-black font-bold transition-colors"
                >
                  Approve & Generate Workspace
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}