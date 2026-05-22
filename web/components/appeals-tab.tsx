"use client";

import { useState } from "react";
import { approveAppeal, rejectAppeal } from "@/lib/api/appeals";
import type { AppealsByStatus, Appeal } from "@/types/appeal";

interface AppealsTabProps {
  appeals: AppealsByStatus;
  onRefresh: () => void;
}

export default function AppealsTab({ appeals, onRefresh }: AppealsTabProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedAppeal, setExpandedAppeal] = useState<string | null>(null);

  const handleApprove = async (appealId: string) => {
    setActionLoading(appealId);
    try {
      await approveAppeal(appealId);
      onRefresh();
      setExpandedAppeal(null);
    } catch (error) {
      console.error("Failed to approve appeal:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (appealId: string) => {
    setActionLoading(appealId);
    try {
      await rejectAppeal(appealId);
      onRefresh();
      setExpandedAppeal(null);
    } catch (error) {
      console.error("Failed to reject appeal:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const AppealCard = ({ appeal, isClickable }: { appeal: Appeal; isClickable: boolean }) => {
    const isExpanded = expandedAppeal === appeal.id;
    const solverName = `${appeal.solverFirstName} ${appeal.solverLastName}`;

    return (
      <div
        key={appeal.id}
        onClick={() => isClickable && setExpandedAppeal(isExpanded ? null : appeal.id)}
        className={`border border-input rounded-lg p-4 transition-all ${
          isClickable ? "cursor-pointer hover:shadow-md" : ""
        } ${isExpanded ? "shadow-md bg-gray-50" : ""}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{solverName}</p>
            <p className="text-sm text-gray-600">{appeal.solverInstitution}</p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(appeal.createdAt).toLocaleDateString()}
            </p>
          </div>

          {activeTab === "approved" && (
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              Active
            </span>
          )}
          {activeTab === "rejected" && (
            <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
              Rejected
            </span>
          )}
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-4 border-t border-input pt-4">
            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">Their Approach</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border border-input">
                {appeal.message}
              </p>
            </div>

            {activeTab === "pending" && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleReject(appeal.id)}
                  disabled={actionLoading === appeal.id}
                  className="flex-1 px-4 py-2 border border-red-200 text-red-700 font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {actionLoading === appeal.id ? "Rejecting..." : "Reject"}
                </button>
                <button
                  onClick={() => handleApprove(appeal.id)}
                  disabled={actionLoading === appeal.id || appeals.approved.length >= 3}
                  className="flex-1 px-4 py-2 bg-accent hover:bg-secondary text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {appeals.approved.length >= 3
                    ? "Max (3) Approved"
                    : actionLoading === appeal.id
                      ? "Approving..."
                      : "Approve"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const getDisplayData = () => {
    switch (activeTab) {
      case "pending":
        return appeals.pending;
      case "approved":
        return appeals.approved;
      case "rejected":
        return appeals.rejected;
    }
  };

  const displayData = getDisplayData();
  const pendingCount = appeals.pending.length;
  const approvedCount = appeals.approved.length;
  const rejectedCount = appeals.rejected.length;

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-input mb-6">
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-3 px-1 font-medium text-sm transition-colors ${
            activeTab === "pending"
              ? "border-b-2 border-accent text-accent"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Pending {pendingCount > 0 && <span className="ml-1 badge badge-primary">{pendingCount}</span>}
        </button>
        <button
          onClick={() => setActiveTab("approved")}
          className={`pb-3 px-1 font-medium text-sm transition-colors ${
            activeTab === "approved"
              ? "border-b-2 border-accent text-accent"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Approved {approvedCount > 0 && <span className="ml-1 badge badge-success">{approvedCount}</span>}
        </button>
        <button
          onClick={() => setActiveTab("rejected")}
          className={`pb-3 px-1 font-medium text-sm transition-colors ${
            activeTab === "rejected"
              ? "border-b-2 border-accent text-accent"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Rejected {rejectedCount > 0 && <span className="ml-1 badge badge-error">{rejectedCount}</span>}
        </button>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {displayData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {activeTab === "pending" && "No pending appeals yet"}
              {activeTab === "approved" && "No approved appeals yet"}
              {activeTab === "rejected" && "No rejected appeals yet"}
            </p>
          </div>
        ) : (
          displayData.map((appeal) => (
            <AppealCard key={appeal.id} appeal={appeal} isClickable={activeTab === "pending"} />
          ))
        )}
      </div>

      {/* Status message when max approved */}
      {activeTab === "pending" && pendingCount > 0 && approvedCount >= 3 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          You have reached the maximum of 3 approved appeals for this problem. New pending appeals will be auto-rejected.
        </div>
      )}
    </div>
  );
}
