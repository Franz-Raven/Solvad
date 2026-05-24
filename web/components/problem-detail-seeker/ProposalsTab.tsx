"use client";

import React, { useEffect, useState } from "react";
// Adjust this import path based on where you defined these API calls
import { getPendingProposals, evaluateProposal } from "@/lib/api/problem"; 
import type { ClaimRequestResponse } from "@/types/attempt";

interface ProposalsTabProps {
  problemId: string;
}

export function ProposalsTab({ problemId }: ProposalsTabProps) {
  const [proposals, setProposals] = useState<ClaimRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal State
  const [selectedProposal, setSelectedProposal] = useState<ClaimRequestResponse | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingProposals();
  }, [problemId]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedProposal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedProposal]);

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
      // Remove the evaluated proposal from the UI and close modal
      setProposals((prev) => prev.filter((p) => p.id !== proposalId));
      setSelectedProposal(null);
    } catch (err: any) {
      alert(`Evaluation failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading proposals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center font-medium shadow-sm">
        {error}
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">No pending proposals</h3>
        <p className="text-sm text-gray-500">When Solvers submit an approach, they will appear here for your review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Pending Proposals</h3>
          <p className="text-sm text-gray-500 mt-1">
            Review approaches and approve up to 3 concurrent Solvers.
          </p>
        </div>
        <div className="bg-secondary/10 text-secondary px-4 py-2 rounded-lg font-bold border border-secondary/20 shadow-sm">
          {proposals.length} Pending
        </div>
      </div>

      {/* Grid Layout for Scalability */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {proposals.map((proposal) => {
          const fileCount = proposal.supportingDocuments 
            ? proposal.supportingDocuments.split(",").length 
            : 0;

          return (
            <div 
              key={proposal.id} 
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col h-full group"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center text-secondary font-bold text-sm shadow-inner flex-shrink-0">
                    {proposal.solver.firstName.charAt(0)}{proposal.solver.lastName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {proposal.solver.firstName} {proposal.solver.lastName}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">{proposal.solver.institution || "Independent Solver"}</p>
                  </div>
                </div>
              </div>

              {/* Card Body (Truncated Preview) */}
              <div className="p-5 flex-1 flex flex-col">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Approach Summary
                </p>
                <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
                  {proposal.proposedApproach}
                </p>
                
                {/* Meta Tags */}
                <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-50">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {new Date(proposal.createdAt).toLocaleDateString()}
                  </span>
                  {fileCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-100">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                      {fileCount} {fileCount === 1 ? 'File' : 'Files'}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="p-4 pt-0">
                <button
                  onClick={() => setSelectedProposal(proposal)}
                  className="w-full py-2.5 px-4 bg-gray-50 hover:bg-secondary hover:text-white text-gray-700 font-medium rounded-lg text-sm transition-colors border border-gray-200 hover:border-secondary flex justify-center items-center gap-2"
                >
                  Review Full Proposal
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── REVIEW MODAL ─── */}
      {selectedProposal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget && !actionLoading) setSelectedProposal(null); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-gray-50/50 rounded-t-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {selectedProposal.solver.firstName.charAt(0)}{selectedProposal.solver.lastName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedProposal.solver.firstName} {selectedProposal.solver.lastName}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedProposal.solver.institution} • Submitted on {new Date(selectedProposal.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProposal(null)}
                disabled={actionLoading !== null}
                className="text-gray-400 hover:text-gray-700 bg-white border border-gray-200 p-2 rounded-full shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1">
              
              <div className="mb-8">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Full Proposed Approach
                </h4>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {selectedProposal.proposedApproach}
                </div>
              </div>

              {selectedProposal.supportingDocuments && selectedProposal.supportingDocuments.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    Attachments
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedProposal.supportingDocuments.split(",").map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:text-secondary hover:border-secondary hover:shadow-md transition-all group"
                      >
                        <div className="bg-blue-50 text-blue-600 p-2 rounded-md group-hover:bg-secondary/10 group-hover:text-secondary transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </div>
                        <span className="truncate font-medium flex-1">
                          {getFilenameFromUrl(url)}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3 rounded-b-2xl flex-shrink-0">
              <button
                onClick={() => handleEvaluation(selectedProposal.id, false)}
                disabled={actionLoading !== null}
                className="px-6 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {actionLoading === selectedProposal.id ? "Rejecting..." : "Reject Proposal"}
              </button>
              <button
                onClick={() => handleEvaluation(selectedProposal.id, true)}
                disabled={actionLoading !== null}
                className="px-6 py-2.5 text-white bg-secondary hover:bg-accent rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                {actionLoading === selectedProposal.id ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Approving...</>
                ) : (
                  "Approve & Create Workspace"
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}