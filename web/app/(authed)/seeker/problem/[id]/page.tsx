"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProblemById, updateProblemStatus, deleteProblem } from "@/lib/api/problem";
import type { ProblemResponse } from "@/types/problem";

// New imports for Module 3 (Activity Ledger)
import { getActivityFeed } from "@/lib/api/activity";
import type { ActivityLedgerResponse } from "@/types/activity";
import ActivityFeed from "@/components/activity-feed";
import DocumentUpload from "@/components/document-upload";

type TabType = "problem" | "insights" | "solvers" | "history" | "settings";

const STATUS_COLORS = {
  OPEN: "bg-blue-500 text-white",
  CLAIMED: "bg-purple-500 text-white",
  IN_PROGRESS: "bg-yellow-500 text-white",
  SOLVED: "bg-green-500 text-white",
  CLOSED: "bg-gray-500 text-white",
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

  useEffect(() => {
    loadProblem();
  }, [problemId]);

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

  const handleStatusChange = async (newStatus: string) => {
    try {
      const updatedProblem = await updateProblemStatus(problemId, newStatus);
      setProblem(updatedProblem);
      setShowStatusDropdown(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
      setShowStatusDropdown(false);
    }
  };

  const handleDeleteProblem = async () => {
    if (!confirm("Are you sure you want to delete this problem? This action cannot be undone.")) {
      return;
    }
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
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
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
          <Link
            href="/seeker/dashboard"
            className="mt-4 inline-block text-accent hover:text-secondary"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10">
      {/* Hero Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-6">
          {/* Back Button */}
          <Link
            href="/seeker/dashboard"
            className="text-sm text-gray-600 hover:text-accent mb-4 inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>

          {/* Title and Actions Row */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0 pr-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
                {problem.title}
              </h1>
            </div>

            {/* Status Action Dropdown */}
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
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
                  {["OPEN", "CLAIMED", "IN_PROGRESS", "SOLVED", "CLOSED"].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-gray-700"
                    >
                      {status.replace("_", " ")}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Badges Row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Badge */}
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${
                STATUS_COLORS[problem.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.OPEN
              }`}
            >
              {problem.status.replace("_", " ")}
            </span>

            {/* Course Badge */}
            <span className="inline-flex items-center px-3 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-medium border border-accent/20">
              Required: {problem.requiredCourse}
            </span>

            {/* Sub-tasks Count */}
            <span className="inline-flex items-center text-sm text-gray-600 font-medium">
              {problem.subtasks.length} Sub-tasks
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex gap-8">
            {[
              { id: "problem", label: "Problem Profile" },
              { id: "insights", label: "AI Insights" },
              { id: "solvers", label: "Assigned Solvers" },
              { id: "history", label: "Audit Timeline" },
              { id: "settings", label: "Settings" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
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
        {activeTab === "problem" && <ProblemTab problem={problem} />}
        {activeTab === "insights" && <PlaceholderTab title="AI Insights & Similarity" />}
        {activeTab === "solvers" && <PlaceholderTab title="Assigned Solvers" />}
        {activeTab === "history" && <HistoryTab problemId={problemId} />}
        {activeTab === "settings" && (
          <SettingsTab problem={problem} onDelete={handleDeleteProblem} />
        )}
      </div>
    </div>
  );
}

// Tab 1: Problem Profile
function ProblemTab({ problem }: { problem: ProblemResponse }) {
  return (
    <div className="space-y-6">
      {/* Core Data Sections */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Problem Blueprint
        </h2>

        <div className="space-y-6">
          {/* Background Context */}
          {problem.backgroundContext && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Background Context
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-800 leading-relaxed">{problem.backgroundContext}</p>
              </div>
            </div>
          )}

          {/* Primary Problem Statement */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Primary Problem Statement
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-gray-800 leading-relaxed font-medium">{problem.primaryStatement}</p>
            </div>
          </div>

          {/* Objectives */}
          {problem.objectives && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Objectives
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-800 leading-relaxed">{problem.objectives}</p>
              </div>
            </div>
          )}

          {/* Technical Constraints */}
          {problem.constraints && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Technical Constraints
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-800 leading-relaxed">{problem.constraints}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI-Decomposed Sub-problems */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          AI-Decomposed Sub-problems
        </h2>

        <div className="grid gap-4">
          {problem.subtasks.map((subtask, index) => (
            <div
              key={subtask.id}
              className="bg-gradient-to-r from-accent/5 to-secondary/5 rounded-lg p-5 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{subtask.title}</h3>
                    <span className="px-2 py-1 bg-secondary/10 text-secondary text-xs font-medium rounded-full">
                      {subtask.departmentFocus}
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{subtask.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attachments Section (Placeholder) */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          Attachments
        </h2>
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-600 text-sm">No attachments uploaded</p>
          <p className="text-gray-500 text-xs mt-1">File upload feature coming soon</p>
        </div>
      </div>
    </div>
  );
}

// Tab 5: Settings
function SettingsTab({
  problem,
  onDelete,
}: {
  problem: ProblemResponse;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Visibility Settings - Coming Soon */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 opacity-60">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Visibility Settings</h2>
          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
            COMING SOON
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Control who can see this problem. Public problems are visible to all matching student
          streams, while hidden problems are only visible to you.
        </p>

        <div className="space-y-3 pointer-events-none">
          <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
            <input
              type="radio"
              name="visibility"
              value="public"
              checked={true}
              disabled
              className="w-5 h-5"
            />
            <div>
              <div className="font-medium text-gray-900">Public</div>
              <div className="text-sm text-gray-600">
                Visible to all students in the required course
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
            <input
              type="radio"
              name="visibility"
              value="hidden"
              disabled
              className="w-5 h-5"
            />
            <div>
              <div className="font-medium text-gray-900">Hidden / Draft</div>
              <div className="text-sm text-gray-600">
                Only visible to you (problem is not discoverable by students)
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Data Immutability Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Problem Data is Immutable</h3>
            <p className="text-sm text-blue-800">
              To preserve matching integrity and audit trail, problem details cannot be edited
              after validation. If significant changes are required, you must delete and
              re-submit the problem.
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-md border-2 border-red-200 p-6">
        <h2 className="text-xl font-bold text-red-700 mb-2 flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Danger Zone
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Irreversible actions that will permanently affect this problem.
        </p>

        <div className="space-y-4">
          <div className="flex items-start justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Delete Problem</h3>
              <p className="text-sm text-gray-700">
                Permanently delete this problem and all associated data. This action cannot be
                undone. If you need to make changes, delete and re-submit.
              </p>
            </div>
            <button
              onClick={onDelete}
              className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex-shrink-0"
            >
              Delete Problem
            </button>
          </div>

          <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Archive Problem</h3>
              <p className="text-sm text-gray-700">
                Move this problem to the archive. It will no longer be visible to students but
                can be restored later.
              </p>
            </div>
            <button
              disabled
              className="ml-4 px-4 py-2 bg-gray-300 text-gray-500 font-semibold rounded-lg cursor-not-allowed flex-shrink-0"
            >
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tab 4: History/Audit Timeline Tab
function HistoryTab({ problemId }: { problemId: string }) {
  const [activities, setActivities] = useState<ActivityLedgerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const data = await getActivityFeed(problemId);
      setActivities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [problemId]);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Audit Timeline</h2>
        <button onClick={fetchFeed} className="text-sm text-secondary hover:text-accent font-medium">
          Refresh Feed
        </button>
      </div>

      <DocumentUpload problemId={problemId} onUploadSuccess={fetchFeed} />

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : (
          <ActivityFeed activities={activities} />
        )}
      </div>
    </div>
  );
}

// Placeholder for other tabs
function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">This feature is coming soon. Stay tuned!</p>
      </div>
    </div>
  );
}