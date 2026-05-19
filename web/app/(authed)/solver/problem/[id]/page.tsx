"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProblemById } from "@/lib/api/problem";
import { claimProblem, getMyAttempt } from "@/lib/api/attempts";
import type { ProblemResponse } from "@/types/problem";
import type { SolutionAttemptResponse } from "@/types/attempt";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-500 text-white",
  CLAIMED: "bg-purple-500 text-white",
  IN_PROGRESS: "bg-yellow-500 text-white",
  SOLVED: "bg-green-500 text-white",
  CLOSED: "bg-gray-500 text-white",
};

export default function SolverProblemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const problemId = params.id as string;

  const [problem, setProblem] = useState<ProblemResponse | null>(null);
  const [myAttempt, setMyAttempt] = useState<SolutionAttemptResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [problemId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const problemData = await getProblemById(problemId);
      setProblem(problemData);

      // Try to load solver's active attempt — it's fine if 404 (not claimed yet)
      try {
        const attemptData = await getMyAttempt(problemId);
        setMyAttempt(attemptData);
      } catch {
        setMyAttempt(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load problem");
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!problem) return;
    setClaiming(true);
    setError(null);
    try {
      const attempt = await claimProblem(problemId);
      setMyAttempt(attempt);
      // Navigate straight to the work page
      router.push(`/solver/problem/${problemId}/work`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to claim problem");
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !problem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
            {error}
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

  if (!problem) return null;

  const isAlreadyClaimed = myAttempt?.status === "ACTIVE";
  const isClosed = problem.status === "SOLVED" || problem.status === "CLOSED";
  const isUnavailable = problem.status !== "OPEN" && !isAlreadyClaimed;

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10">

      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-8 py-6">
          <Link
            href="/solver/dashboard"
            className="text-sm text-gray-600 hover:text-accent mb-4 inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>

          <div className="flex items-start justify-between mt-2">
            <div className="flex-1 min-w-0 pr-4">
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                {problem.title}
              </h1>
            </div>

            {/* CTA Button */}
            <div className="flex-shrink-0">
              {isAlreadyClaimed ? (
                <Link
                  href={`/solver/problem/${problemId}/work`}
                  className="px-6 py-2.5 bg-secondary hover:bg-accent text-white rounded-lg font-medium transition-colors shadow-sm inline-block"
                >
                  Continue Working →
                </Link>
              ) : isUnavailable ? (
                <span className="px-6 py-2.5 bg-gray-200 text-gray-500 rounded-lg font-medium cursor-not-allowed inline-block">
                  Not Available
                </span>
              ) : (
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="px-6 py-2.5 bg-secondary hover:bg-accent text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {claiming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    "Claim Problem"
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-3 flex-wrap mt-4">
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${
                STATUS_COLORS[problem.status] || STATUS_COLORS.OPEN
              }`}
            >
              {problem.status.replace("_", " ")}
            </span>
            <span className="inline-flex items-center px-3 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-medium border border-accent/20">
              {problem.requiredCourse}
            </span>
            <span className="inline-flex items-center text-sm text-gray-600 font-medium">
              {problem.subtasks.length} Sub-tasks
            </span>
            <span className="inline-flex items-center text-sm text-gray-600">
              {problem.seekerOrganization}
            </span>
          </div>

          {/* Error inline */}
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">

        {/* Already claimed banner */}
        {isAlreadyClaimed && (
          <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
              <p className="text-sm font-medium text-secondary">
                You have an active claim on this problem.
              </p>
            </div>
            <Link
              href={`/solver/problem/${problemId}/work`}
              className="text-sm font-semibold text-secondary hover:text-accent transition-colors"
            >
              Go to workspace →
            </Link>
          </div>
        )}

        {/* Problem Blueprint */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Problem Blueprint
          </h2>

          <div className="space-y-6">
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

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Primary Problem Statement
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-800 leading-relaxed font-medium">{problem.primaryStatement}</p>
              </div>
            </div>

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

            {problem.constraints && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Constraints
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
                className="bg-gradient-to-r from-accent/5 to-secondary/5 rounded-lg p-5 border border-gray-200"
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

        {/* Claim CTA at bottom */}
        {!isAlreadyClaimed && !isUnavailable && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Ready to tackle this problem?</h3>
              <p className="text-sm text-gray-600 mt-1">
                Claiming locks it for you. You can work on as many sub-tasks as you can solve.
              </p>
            </div>
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="px-8 py-3 bg-secondary hover:bg-accent text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {claiming ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Claiming...
                </>
              ) : (
                "Claim & Start Working"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}