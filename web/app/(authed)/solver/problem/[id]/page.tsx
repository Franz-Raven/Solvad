// app/(authed)/solver/problem/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProblemById } from "@/lib/api/problem";
import { submitSolution } from "@/lib/api/solver";
import { uploadFileToSupabase } from "@/lib/supabase";
import type { ProblemResponse } from "@/types/problem";

type TabType = "details" | "workspace";

export default function SolverProblemPage() {
  const params = useParams();
  const router = useRouter();
  const problemId = params.id as string;

  const [problem, setProblem] = useState<ProblemResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("details");

  useEffect(() => {
    loadProblem();
  }, [problemId]);

  const loadProblem = async () => {
    try {
      setLoading(true);
      const data = await getProblemById(problemId);
      setProblem(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load problem");
    } finally {
      setLoading(false);
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
      <div className="min-h-screen p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700 max-w-lg mx-auto">
          {error || "Problem not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-8 py-6">
          <Link
            href="/solver/dashboard"
            className="text-sm text-gray-600 hover:text-accent mb-4 inline-flex items-center"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
              {problem.title}
            </h1>
            <span className="px-4 py-1.5 bg-blue-100 text-blue-800 text-sm font-bold rounded-full border border-blue-200">
              {problem.status.replace("_", " ")}
            </span>
          </div>
          <p className="text-gray-600 font-medium">By {problem.organizationName}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-8 flex gap-8">
          <button
            onClick={() => setActiveTab("details")}
            className={`py-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "details" ? "border-accent text-accent" : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Problem Details
          </button>
          {/* Only show Workspace if the problem is claimed/in progress or already solved */}
          {(problem.status === "CLAIMED" || problem.status === "IN_PROGRESS" || problem.status === "SOLVED") && (
            <button
              onClick={() => setActiveTab("workspace")}
              className={`py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "workspace" ? "border-accent text-accent" : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Workspace & Submission
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-8 py-8">
        {activeTab === "details" && <ProblemDetails problem={problem} />}
        {activeTab === "workspace" && <WorkspaceTab problem={problem} onUpdate={loadProblem} />}
      </div>
    </div>
  );
}

// Basic Problem Details Component (Read-Only version of Seeker's view)
function ProblemDetails({ problem }: { problem: ProblemResponse }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Primary Problem Statement</h3>
          <p className="text-gray-900 mt-1 font-medium">{problem.primaryStatement}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Background</h3>
            <p className="text-gray-700 mt-1 text-sm">{problem.backgroundContext || "N/A"}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Constraints</h3>
            <p className="text-gray-700 mt-1 text-sm">{problem.constraints || "N/A"}</p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">AI-Decomposed Sub-tasks</h2>
      <div className="grid gap-4">
        {problem.subtasks.map((subtask, idx) => (
          <div key={subtask.id} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex gap-4">
            <div className="w-8 h-8 rounded bg-accent/10 text-accent flex items-center justify-center font-bold">
              {idx + 1}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{subtask.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{subtask.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Workspace Component where Solvers submit their solution
function WorkspaceTab({ problem, onUpdate }: { problem: ProblemResponse; onUpdate: () => void }) {
  const [details, setDetails] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (problem.status === "SOLVED" || problem.status === "CLOSED") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
        <h2 className="text-xl font-bold text-green-900 mb-2">Solution Submitted</h2>
        <p className="text-green-700">You have successfully submitted your solution for this problem. It is currently awaiting review by the Seeker.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) {
      setError("Please provide solution details.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let fileUrl = undefined;
      if (file) {
        fileUrl = await uploadFileToSupabase(file, "problem-documents"); // reusing your Supabase utility
      }

      await submitSolution(problem.id, { details, fileUrl });
      alert("Solution submitted successfully!");
      onUpdate(); // Refresh the page state to show the "✓ Solution Submitted" view
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit solution");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit Your Solution</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Solution Executive Summary & Details <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={8}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none"
            placeholder="Explain your approach, methodology, and final results..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Supporting Documentation (Optional)
          </label>
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-2">Upload code, reports, or presentation slides (PDF, ZIP, DOCX).</p>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

        <div className="pt-4 border-t border-gray-200 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !details.trim()}
            className="px-8 py-3 bg-accent hover:bg-secondary disabled:bg-accent/50 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </>
            ) : (
              "Submit Final Solution"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}