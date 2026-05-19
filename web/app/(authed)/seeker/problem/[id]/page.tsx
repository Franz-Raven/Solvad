"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Portal from "@/components/portal";
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

// Human-readable labels for each status
const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  SOLVED_OPEN_FOR_IMPROVEMENT: "Solved – Open for Improvement",
  COMPLETED: "Completed",
  CLOSED: "Closed",
};

// Description shown in the general confirmation modal
const STATUS_DESCRIPTIONS: Record<string, string> = {
  OPEN: "The problem will be visible to solvers and open for new claims.",
  SOLVED_OPEN_FOR_IMPROVEMENT: "The problem will be marked as solved but remain visible so solvers can continue to improve upon it.",
  COMPLETED: "The problem will be marked as fully completed and hidden from the solver browse page.",
  CLOSED: "The problem will be hidden from all solvers. You can reopen it later.",
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

  // Modal state
  // "confirm"  → general "are you sure?" modal
  // "terminate" → specific warning when a solver is still active
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"confirm" | "terminate" | null>(null);

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

  const handleStatusChangeClick = (newStatus: string) => {
  setShowStatusDropdown(false);
  setPendingStatus(newStatus);

  console.log("Current problem status:", problem?.status); // add this
  console.log("New status:", newStatus);

  const solverIsActive =
    problem?.status === "CLAIMED" || problem?.status === "IN_PROGRESS";
  const isClosingAction =
    newStatus === "COMPLETED" || newStatus === "CLOSED";

  console.log("solverIsActive:", solverIsActive); // add this

  if (isClosingAction && solverIsActive) {
    setModalMode("terminate");
  } else {
    setModalMode("confirm");
  }
};

  const cancelModal = () => {
    setPendingStatus(null);
    setModalMode(null);
  };

  // Actually call the API
  const executeStatusChange = async (status: string) => {
    try {
      const updatedProblem = await updateProblemStatus(problemId, status);
      setProblem(updatedProblem);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setPendingStatus(null);
      setModalMode(null);
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

      {/* ── General Confirmation Modal ── */}
      {modalMode === "confirm" && pendingStatus && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 text-center mb-1">Confirm Status Change</h2>
              <p className="text-sm text-gray-500 text-center mb-1">You are changing the status to</p>
              <p className="text-base font-semibold text-gray-900 text-center mb-4">
                {STATUS_LABELS[pendingStatus] ?? pendingStatus.replace(/_/g, " ")}
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-6">
                <p className="text-sm text-gray-600 text-center">
                  {STATUS_DESCRIPTIONS[pendingStatus] ?? "This will update the visibility and state of your problem."}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={cancelModal}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => executeStatusChange(pendingStatus)}
                  className="flex-1 px-4 py-2.5 bg-accent hover:bg-secondary text-white font-semibold rounded-lg transition-colors text-sm"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ── Active Solver Warning Modal ── */}
      {modalMode === "terminate" && pendingStatus && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 text-center mb-2">⚠️ Active Solver Warning</h2>
              <p className="text-sm text-gray-600 text-center mb-4">
                A solver is <strong>currently working</strong> on this problem. Setting the status to{" "}
                <strong>{STATUS_LABELS[pendingStatus] ?? pendingStatus.replace(/_/g, " ")}</strong> will
                immediately <span className="text-red-600 font-semibold">terminate their active attempt</span>.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6 space-y-1">
                <p className="text-xs text-red-700 font-semibold">This will:</p>
                <ul className="text-xs text-red-700 space-y-0.5 list-disc list-inside">
                  <li>End their attempt and mark it as <strong>Terminated</strong></li>
                  <li>Lock them out of submitting any further work</li>
                  <li>Be logged permanently in the Audit Timeline</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={cancelModal}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => executeStatusChange(pendingStatus)}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm"
                >
                  Yes, Terminate & {pendingStatus === "COMPLETED" ? "Complete" : "Close"}
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
                onClick={async () => {
                  const fresh = await getProblemById(problemId);
                  setProblem(fresh);
                  setShowStatusDropdown(!showStatusDropdown);
                }}
                className="px-4 py-2.5 bg-secondary hover:bg-accent text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
                Change Status
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showStatusDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
                  {(["OPEN", "SOLVED_OPEN_FOR_IMPROVEMENT", "COMPLETED", "CLOSED"] as const).map((status) => {
                    const isDestructive = status === "COMPLETED" || status === "CLOSED";
                    const solverIsActive =
                      problem.status === "CLAIMED" || problem.status === "IN_PROGRESS";
                    const willTerminate = isDestructive && solverIsActive;

                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusChangeClick(status)}
                        className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between gap-2 ${
                          willTerminate
                            ? "hover:bg-red-50 text-red-700"
                            : "hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        <span>{STATUS_LABELS[status]}</span>
                        {willTerminate && (
                          <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            TERMINATES SOLVER
                          </span>
                        )}
                      </button>
                    );
                  })}
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