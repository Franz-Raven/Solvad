"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Portal from "@/components/portal"; // Assuming you have your Portal component here, same as solver side
import { getProblemById, updateProblemStatus, deleteProblem } from "@/lib/api/problem";
import type { ProblemResponse } from "@/types/problem";
import { ProblemTab } from "@/components/problem-detail-seeker/ProblemTab";
import { AuditTimelineTab } from "@/components/problem-detail-seeker/AuditTimelineTab";
import { SettingsTab } from "@/components/problem-detail-seeker/SettingsTab";
import { SolutionTreeTab } from "@/components/problem-detail-seeker/SolutionTreeTab";
import { PlaceholderTab } from "@/components/problem-detail-seeker/PlaceholderTab";

type TabType = "problem" | "insights" | "tree" | "history" | "settings";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-500 text-white",
  CLAIMED: "bg-purple-500 text-white",
  IN_PROGRESS: "bg-yellow-500 text-white",
  SOLVED_OPEN_FOR_IMPROVEMENT: "bg-green-500 text-white",
  COMPLETED: "bg-gray-800 text-white",
  CLOSED: "bg-gray-500 text-white",
  TERMINATED: "bg-red-500 text-white",
};

export default function ProblemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const problemId = params.id as string;
  const [problem, setProblem] = useState<ProblemResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("problem");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null); // State for the warning modal

  useEffect(() => { loadProblem(); }, [problemId]);

  const loadProblem = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProblemById(problemId);
      setProblem(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load problem");
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Intercept the click. Check if we need to warn the seeker.
  const handleStatusChangeClick = (newStatus: string) => {
    setShowStatusDropdown(false);
    
    // If the problem is currently being worked on, and they are trying to close it
    if ((newStatus === "COMPLETED" || newStatus === "CLOSED") && 
        (problem?.status === "CLAIMED" || problem?.status === "IN_PROGRESS")) {
      setPendingStatus(newStatus);
    } else {
      executeStatusChange(newStatus);
    }
  };

  // Step 2: Actually execute the API call
  const executeStatusChange = async (newStatus: string) => {
    try {
      const updatedProblem = await updateProblemStatus(problemId, newStatus);
      setProblem(updatedProblem);
      setPendingStatus(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
      setPendingStatus(null);
    }
  };

  const handleDeleteProblem = async () => {
    if (!confirm("Are you sure you want to delete this problem? This action cannot be undone.")) return;
    try {
      await deleteProblem(problemId);
      router.push("/seeker/dashboard");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete problem");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
            {error || "Problem not found"}
          </div>
          <Link href="/seeker/dashboard" className="mt-4 inline-block text-accent hover:text-secondary">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: "problem",  label: "Problem Profile" },
    { id: "insights", label: "AI Insights" },
    { id: "tree",     label: "Solution Tree" },
    { id: "history",  label: "Audit Timeline" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10">
      
      {/* ── Warning Modal (Portaled) ── */}
      {pendingStatus && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 text-center mb-2">Active Solver Warning</h2>
              <p className="text-sm text-gray-600 text-center mb-6">
                There is currently a solver actively working on this problem. Changing the status to <strong>{pendingStatus}</strong> will instantly terminate their attempt. Are you sure you want to proceed?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPendingStatus(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => executeStatusChange(pendingStatus)}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm"
                >
                  Yes, Terminate Attempt
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <Link href="/seeker/dashboard" className="text-sm text-gray-600 hover:text-accent mb-4 inline-flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>

          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0 pr-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">{problem.title}</h1>
            </div>
 
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="px-4 py-2.5 bg-secondary hover:bg-accent text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
                Change Status
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showStatusDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
                  {["OPEN", "SOLVED_OPEN_FOR_IMPROVEMENT", "COMPLETED", "CLOSED"].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChangeClick(status)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-gray-700"
                    >
                      {status.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${STATUS_COLORS[problem.status] || STATUS_COLORS.OPEN}`}>
              {problem.status.replace(/_/g, " ")}
            </span>
            <span className="inline-flex items-center px-3 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-medium border border-accent/20">
              Required: {problem.requiredCourse}
            </span>
            <span className="inline-flex items-center text-sm text-gray-600 font-medium">
              {problem.subtasks.length} Sub-tasks
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-accent text-accent"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {activeTab === "problem"  && <ProblemTab problem={problem} />}
        {activeTab === "insights" && <PlaceholderTab title="AI Insights & Similarity" />}
        {activeTab === "tree"     && <SolutionTreeTab problemId={problemId} />}
        {activeTab === "history"  && <AuditTimelineTab problemId={problemId} />}
        {activeTab === "settings" && <SettingsTab problem={problem} onDelete={handleDeleteProblem} />}
      </div>
    </div>
  );
}