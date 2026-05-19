"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProblemById, updateProblemStatus, deleteProblem } from "@/lib/api/problem";
import type { ProblemResponse } from "@/types/problem";

import { ProblemTab } from "@/components/problem-detail-seeker/ProblemTab";
import { AuditTimelineTab } from "@/components/problem-detail-seeker/AuditTimelineTab";
import { SettingsTab } from "@/components/problem-detail-seeker/SettingsTab";
import { SolutionTreeTab } from "@/components/problem-detail-seeker/SolutionTreeTab";
import { PlaceholderTab } from "@/components/problem-detail-seeker/PlaceholderTab";

type TabType = "problem" | "insights" | "tree" | "history" | "settings";

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

          <div className="flex items-center gap-3 flex-wrap">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${STATUS_COLORS[problem.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.OPEN}`}>
              {problem.status.replace("_", " ")}
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