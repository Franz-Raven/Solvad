import React, { useEffect, useState } from 'react';

interface Proposal {
  id: string;
  solver: {
    firstName: string;
    lastName: string;
    institution: string;
  };
  proposedApproach: string;
  supportingDocuments: string | null;
  status: string;
  createdAt: string;
}

interface EvaluationDashboardProps {
  problemId: string;
  token: string;
}

export default function SeekerEvaluationDashboard({ problemId, token }: EvaluationDashboardProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingProposals();
  }, [problemId]);

  const fetchPendingProposals = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/problems/${problemId}/proposals/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch proposals');
      const data = await response.json();
      setProposals(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluation = async (proposalId: string, isApproved: boolean) => {
    setActionLoading(proposalId);
    try {
      const response = await fetch(`http://localhost:8080/api/proposals/${proposalId}/evaluate?isApproved=${isApproved}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
      }
      
      // Remove the evaluated proposal from the list
      setProposals(prev => prev.filter(p => p.id !== proposalId));
    } catch (err: any) {
      alert(`Evaluation failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="text-gray-500 animate-pulse">Loading proposals...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (proposals.length === 0) return <div className="text-gray-500 italic">No pending proposals for this problem.</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Pending Solver Proposals</h3>
      <p className="text-sm text-gray-500 mb-6">
        Approve proposals to generate active workspaces. You can have a maximum of 3 concurrent solvers.
      </p>

      <div className="space-y-4">
        {proposals.map(proposal => (
          <div key={proposal.id} className="border border-gray-200 rounded-md p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-lg">{proposal.solver.firstName} {proposal.solver.lastName}</h4>
                <p className="text-sm text-gray-500">{proposal.solver.institution}</p>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(proposal.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700 mb-4 whitespace-pre-wrap">
              <strong>Proposed Approach:</strong><br/>
              {proposal.proposedApproach}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => handleEvaluation(proposal.id, false)}
                disabled={actionLoading === proposal.id}
                className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-md text-sm font-medium transition"
              >
                Reject
              </button>
              <button
                onClick={() => handleEvaluation(proposal.id, true)}
                disabled={actionLoading === proposal.id}
                className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-md text-sm font-medium transition"
              >
                {actionLoading === proposal.id ? 'Approving...' : 'Approve Workspace'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}