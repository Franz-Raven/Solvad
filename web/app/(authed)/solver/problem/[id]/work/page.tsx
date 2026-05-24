"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProblemById } from "@/lib/api/problem";
import { getMyAttempt, abandonClaim, submitFullAttempt } from "@/lib/api/attempts";
import type { ProblemResponse } from "@/types/problem";
import type { SolutionAttemptResponse } from "@/types/attempt";import { SubtaskForm } from "@/components/solver-workspace/SubtaskForm";

export default function SolverWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const problemId = params.id as string;

  const [problem, setProblem] = useState<ProblemResponse | null>(null);
  const [attempt, setAttempt] = useState<SolutionAttemptResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubtaskId, setActiveSubtaskId] = useState<string | null>(null);
  const [isAbandoning, setIsAbandoning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        setLoading(true);

        const probData = await getProblemById(problemId);
        setProblem(probData);

        let attemptData: SolutionAttemptResponse | null = null;
        try {
          attemptData = await getMyAttempt(problemId);
        } catch {
          await new Promise((r) => setTimeout(r, 1000));
          attemptData = await getMyAttempt(problemId);
        }
        setAttempt(attemptData);

        if (probData.subtasks.length > 0) {
          setActiveSubtaskId(probData.subtasks[0].id);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load workspace data.");
      } finally {
        setLoading(false);
      }
    };

    loadWorkspace();
  }, [problemId]);

  const handleAbandon = async () => {
    if (
      !confirm(
        "Are you sure you want to abandon this problem? It will become available for other solvers."
      )
    )
      return;
    setIsAbandoning(true);
    try {
      await abandonClaim(problemId);
      router.push("/solver/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to abandon claim");
      setIsAbandoning(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!attempt) return;
    if (
      !confirm(
        "Are you sure you want to submit your final solution? You won't be able to edit this attempt anymore, and the problem will be reopened for others."
      )
    )
      return;
    setIsSubmitting(true);
    try {
      await submitFullAttempt(attempt.id);
      router.push("/solver/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to submit final solution");
      setIsSubmitting(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Error ──
  if (error || !problem || !attempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
            {error || "Workspace not available. Make sure you have an active claim."}
          </div>
          <Link
            href="/solver/dashboard"
            className="mt-4 inline-block text-accent hover:text-secondary"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const submittedCount = attempt.submissions.filter((s) => s.status === "SUBMITTED").length;
  const activeSubtask = problem.subtasks.find((s) => s.id === activeSubtaskId);
  const existingSubmission = activeSubtask
    ? attempt.submissions.find((s) => s.subtaskId === activeSubtask.id)
    : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 flex flex-col">

      {/* ── Top Bar ── */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/solver/problem/${problemId}`}
              className="text-sm text-gray-600 hover:text-accent inline-flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Problem Details
            </Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-base font-semibold text-gray-900 truncate max-w-xs md:max-w-lg">
              {problem.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {submittedCount}/{problem.subtasks.length} submitted
            </span>
            <button
              onClick={handleAbandon}
              disabled={isAbandoning || isSubmitting}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg transition-colors disabled:opacity-50"
            >
              {isAbandoning ? "Abandoning..." : "Abandon Problem"}
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={isSubmitting || isAbandoning || submittedCount === 0}
              className="px-4 py-2 text-sm bg-accent hover:bg-secondary text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Finish & Submit Project"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Two-Column Layout ── */}
      <div className="flex flex-1 max-w-7xl mx-auto w-full px-6 py-6 gap-6">

        {/* LEFT: Subtask Sidebar */}
        <div className="w-72 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 text-sm">Sub-tasks</h2>
              <p className="text-xs text-gray-500 mt-0.5">You can solve any or all of them</p>
            </div>
            <div className="divide-y divide-gray-100">
              {problem.subtasks.map((subtask, index) => {
                const submission = attempt.submissions.find((s) => s.subtaskId === subtask.id);
                const isActive = subtask.id === activeSubtaskId;
                const isSubmitted = submission?.status === "SUBMITTED";
                const isDraft = submission?.status === "DRAFT";

                return (
                  <button
                    key={subtask.id}
                    onClick={() => setActiveSubtaskId(subtask.id)}
                    className={`w-full text-left p-4 transition-colors ${
                      isActive
                        ? "bg-accent/10 border-l-2 border-accent"
                        : "hover:bg-gray-50 border-l-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                          isSubmitted
                            ? "bg-green-500 text-white"
                            : isDraft
                            ? "bg-yellow-400 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {isSubmitted ? "✓" : index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 leading-tight">
                          {subtask.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {subtask.departmentFocus}
                        </p>
                        {isSubmitted && (
                          <span className="inline-block mt-1 text-xs text-green-600 font-medium">
                            Submitted ✓
                          </span>
                        )}
                        {isDraft && (
                          <span className="inline-block mt-1 text-xs text-yellow-600 font-medium">
                            Draft saved
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Active Subtask Workspace */}
        <div className="flex-1 min-w-0">
          {activeSubtask ? (
            <div className="space-y-4">
              {/* Subtask header card */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                    {problem.subtasks.findIndex((s) => s.id === activeSubtask.id) + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-gray-900">{activeSubtask.title}</h2>
                      <span className="px-2 py-1 bg-secondary/10 text-secondary text-xs font-medium rounded-full">
                        {activeSubtask.departmentFocus}
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{activeSubtask.description}</p>
                  </div>
                </div>
              </div>

              {/* SubtaskForm */}
              <SubtaskForm
                key={activeSubtask.id}
                attemptId={attempt.id}
                subtask={activeSubtask}
                existingDescription={existingSubmission?.description ?? ""}
                existingDelta={existingSubmission?.deltaDescription ?? ""}
                isSubmitted={existingSubmission?.status === "SUBMITTED"}
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
              <p className="text-gray-500">Select a sub-task from the sidebar to begin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}