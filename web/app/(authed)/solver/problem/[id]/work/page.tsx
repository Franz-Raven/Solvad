"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProblemById } from "@/lib/api/problem";
import {
  getMyAttempt,
  saveOrSubmitSubtask,
  deleteFileFromSubmission,
  abandonClaim,
  submitFullAttempt,
  getAttemptById
} from "@/lib/api/attempts";
import type { ProblemResponse } from "@/types/problem";
import type { SolutionAttemptResponse, SubtaskSubmissionResponse } from "@/types/attempt";

type WorkState = "IDLE" | "SAVING" | "SUBMITTING" | "ABANDONING";

export default function SolverWorkPage() {
  const params = useParams();
  const router = useRouter();
  const problemId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [problem, setProblem] = useState<ProblemResponse | null>(null);
  const [attempt, setAttempt] = useState<SolutionAttemptResponse | null>(null);
  const [parentAttempt, setParentAttempt] = useState<SolutionAttemptResponse | null>(null); // <-- Add this
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workState, setWorkState] = useState<WorkState>("IDLE");

  // Which subtask is currently selected in the sidebar
  const [activeSubtaskId, setActiveSubtaskId] = useState<string | null>(null);

  // Per-subtask form state: description + pending files
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [pendingFiles, setPendingFiles] = useState<Record<string, File[]>>({});

  // Inline success/error per subtask
  const [subtaskMessages, setSubtaskMessages] = useState<
    Record<string, { type: "success" | "error"; text: string }>
  >({});

  useEffect(() => {
    loadData();
  }, [problemId]);

  // Inside your loadData function on work/page.tsx, replace the loadData implementation with this:
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const problemData = await getProblemById(problemId);
      setProblem(problemData);

      // Attempt might take a second to propagate after clicking claim
      let attemptData = null;
      try {
        attemptData = await getMyAttempt(problemId);
      } catch (e) {
        // If it throws an error immediately after routing, wait a second and retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attemptData = await getMyAttempt(problemId);
      }
      
      setAttempt(attemptData);

      // Inside loadData, right after setAttempt(attemptData);
      if (attemptData.parentAttemptId) {
        try {
          const parentData = await getAttemptById(attemptData.parentAttemptId);
          setParentAttempt(parentData);
        } catch (e) {
          console.error("Could not load parent attempt details");
        }
      }

      if (problemData.subtasks.length > 0) {
        setActiveSubtaskId(problemData.subtasks[0].id);
      }

      const descMap: Record<string, string> = {};
      attemptData.submissions.forEach((sub) => {
        descMap[sub.subtaskId] = sub.description ?? "";
      });
      setDescriptions(descMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionForSubtask = (subtaskId: string): SubtaskSubmissionResponse | undefined =>
    attempt?.submissions.find((s) => s.subtaskId === subtaskId);

  const handleDescriptionChange = (subtaskId: string, value: string) => {
    setDescriptions((prev) => ({ ...prev, [subtaskId]: value }));
  };

  const handleFileSelect = (subtaskId: string, files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setPendingFiles((prev) => ({
      ...prev,
      [subtaskId]: [...(prev[subtaskId] ?? []), ...newFiles],
    }));
  };

  const removePendingFile = (subtaskId: string, index: number) => {
    setPendingFiles((prev) => {
      const updated = [...(prev[subtaskId] ?? [])];
      updated.splice(index, 1);
      return { ...prev, [subtaskId]: updated };
    });
  };

  const handleDeleteUploadedFile = async (
    subtaskId: string,
    submissionId: string,
    fileUrl: string
  ) => {
    try {
      const updated = await deleteFileFromSubmission(submissionId, fileUrl);
      setAttempt((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          submissions: prev.submissions.map((s) =>
            s.subtaskId === subtaskId ? updated : s
          ),
        };
      });
    } catch (err) {
      setSubtaskMessages((prev) => ({
        ...prev,
        [subtaskId]: {
          type: "error",
          text: err instanceof Error ? err.message : "Failed to delete file",
        },
      }));
    }
  };

  const handleSaveOrSubmit = async (
    subtaskId: string,
    action: "SAVE_DRAFT" | "SUBMIT"
  ) => {
    if (!attempt) return;

    setWorkState(action === "SUBMIT" ? "SUBMITTING" : "SAVING");
    setSubtaskMessages((prev) => ({ ...prev, [subtaskId]: undefined as any }));

    try {
      const updated = await saveOrSubmitSubtask(
        attempt.id,
        subtaskId,
        descriptions[subtaskId] ?? "",
        action,
        pendingFiles[subtaskId] ?? []
      );

      // Clear pending files for this subtask
      setPendingFiles((prev) => ({ ...prev, [subtaskId]: [] }));

      // Update attempt submissions
      setAttempt((prev) => {
        if (!prev) return prev;
        const exists = prev.submissions.some((s) => s.subtaskId === subtaskId);
        const updatedSubmissions = exists
          ? prev.submissions.map((s) => (s.subtaskId === subtaskId ? updated : s))
          : [...prev.submissions, updated];
        return { ...prev, submissions: updatedSubmissions };
      });

      setSubtaskMessages((prev) => ({
        ...prev,
        [subtaskId]: {
          type: "success",
          text:
            action === "SUBMIT"
              ? "Submitted successfully! This subtask is now locked."
              : "Draft saved.",
        },
      }));
    } catch (err) {
      setSubtaskMessages((prev) => ({
        ...prev,
        [subtaskId]: {
          type: "error",
          text: err instanceof Error ? err.message : "Failed to save",
        },
      }));
    } finally {
      setWorkState("IDLE");
    }
  };

  const handleAbandon = async () => {
    if (!confirm("Are you sure you want to abandon this problem? It will become available for other solvers.")) return;
    setWorkState("ABANDONING");
    try {
      await abandonClaim(problemId);
      router.push("/solver/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to abandon claim");
      setWorkState("IDLE");
    }
  };

  const handleFinalSubmit = async () => {
    if (!attempt) return;
    if (!confirm("Are you sure you want to submit your final solution? You won't be able to edit this attempt anymore, and the problem will be reopened for others.")) return;
    
    setWorkState("SUBMITTING");
    try {
      await submitFullAttempt(attempt.id);
      router.push("/solver/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit final solution");
      setWorkState("IDLE");
    }
  };

  const getFileIcon = (url: string) => {
    const ext = url.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext ?? "")) return "🖼️";
    if (["pdf"].includes(ext ?? "")) return "📄";
    if (["doc", "docx"].includes(ext ?? "")) return "📝";
    return "📎";
  };

  const getFileName = (url: string) => {
    const parts = url.split("/");
    return parts[parts.length - 1] ?? url;
  };

  // -------------------------------------------------------------------------
  // Loading / Error states
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !problem || !attempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
            {error || "Workspace not available. Make sure you have an active claim."}
          </div>
          <Link href="/solver/dashboard" className="mt-4 inline-block text-accent hover:text-secondary">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const activeSubtask = problem.subtasks.find((s) => s.id === activeSubtaskId);
  const activeSubmission = activeSubtaskId
    ? getSubmissionForSubtask(activeSubtaskId)
    : undefined;
  const isActiveSubmitted = activeSubmission?.status === "SUBMITTED";

  const submittedCount = attempt.submissions.filter(
    (s) => s.status === "SUBMITTED"
  ).length;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 flex flex-col">

      {/* Top bar */}
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
              disabled={workState === "ABANDONING"}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg transition-colors disabled:opacity-50"
            >
              {workState === "ABANDONING" ? "Abandoning..." : "Abandon Problem"}
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={workState !== "IDLE" || submittedCount === 0}
              className="px-4 py-2 text-sm bg-accent hover:bg-secondary text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {workState === "SUBMITTING" ? "Submitting..." : "Finish & Submit Project"}
            </button>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-1 max-w-7xl mx-auto w-full px-6 py-6 gap-6">

        {/* LEFT: Subtask sidebar */}
        <div className="w-72 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 text-sm">Sub-tasks</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                You can solve any or all of them
              </p>
            </div>
            <div className="divide-y divide-gray-100">
              {problem.subtasks.map((subtask, index) => {
                const submission = getSubmissionForSubtask(subtask.id);
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

        {/* RIGHT: Active subtask workspace */}
        <div className="flex-1 min-w-0">
          {activeSubtask ? (
            <div className="space-y-4">

              {/* Subtask header */}
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

              {/* Submission workspace */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Your Solution</h3>
                  {isActiveSubmitted && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      Submitted — Locked
                    </span>
                  )}
                </div>

                {/* Submitted view (read-only) */}
                {isActiveSubmitted && activeSubmission ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {activeSubmission.description || (
                          <span className="text-gray-400 italic">No description provided.</span>
                        )}
                      </p>
                    </div>
                    {activeSubmission.fileUrls.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Attached Files
                        </p>
                        <div className="space-y-2">
                          {activeSubmission.fileUrls.map((url) => (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-accent/10 transition-colors"
                            >
                              <span className="text-lg">{getFileIcon(url)}</span>
                              <span className="text-sm text-gray-700 flex-1 truncate">
                                {getFileName(url)}
                              </span>
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Editable draft form */
                  <div className="space-y-4">

                    {/* --- NEW: Parent Reference Box --- */}
                    {parentAttempt && (
                      <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          <h4 className="text-sm font-semibold text-blue-900">
                            Reference: Original Solution by {parentAttempt.solverFirstName}
                          </h4>
                        </div>
                        <p className="text-sm text-blue-800/80 whitespace-pre-wrap pl-6 border-l-2 border-blue-200">
                          {parentAttempt.submissions.find(s => s.subtaskId === activeSubtaskId)?.description || "No description provided in parent solution."}
                        </p>
                        
                        {/* Show parent files if they exist */}
                        {parentAttempt.submissions.find(s => s.subtaskId === activeSubtaskId)?.fileUrls && parentAttempt.submissions.find(s => s.subtaskId === activeSubtaskId)!.fileUrls.length > 0 && (
                          <div className="mt-3 pl-6">
                            <p className="text-xs font-semibold text-blue-700 mb-1">Original Attachments:</p>
                            <div className="flex flex-wrap gap-2">
                              {parentAttempt.submissions.find(s => s.subtaskId === activeSubtaskId)!.fileUrls.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 bg-white border border-blue-200 px-2 py-1 rounded text-blue-700 hover:bg-blue-100">
                                  📎 {getFileName(url)}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {/* --- END Parent Reference Box --- */}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description / Solution Write-up
                      </label>
                      <textarea
                        value={descriptions[activeSubtask.id] ?? ""}
                        onChange={(e) =>
                          handleDescriptionChange(activeSubtask.id, e.target.value)
                        }
                        rows={8}
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground resize-none"
                        placeholder="Describe your solution approach, findings, and implementation details..."
                      />
                    </div>

                    {/* Already-uploaded files (from saved draft) */}
                    {activeSubmission && activeSubmission.fileUrls.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Uploaded Files
                        </p>
                        <div className="space-y-2">
                          {activeSubmission.fileUrls.map((url) => (
                            <div
                              key={url}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <span className="text-lg">{getFileIcon(url)}</span>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-gray-700 flex-1 truncate hover:text-accent"
                              >
                                {getFileName(url)}
                              </a>
                              <button
                                onClick={() =>
                                  handleDeleteUploadedFile(
                                    activeSubtask.id,
                                    activeSubmission.id,
                                    url
                                  )
                                }
                                className="text-red-400 hover:text-red-600 transition-colors"
                                title="Remove file"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pending (not yet uploaded) files */}
                    {(pendingFiles[activeSubtask.id] ?? []).length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Pending Upload
                        </p>
                        <div className="space-y-2">
                          {(pendingFiles[activeSubtask.id] ?? []).map((file, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                            >
                              <span className="text-lg">📎</span>
                              <span className="text-sm text-gray-700 flex-1 truncate">
                                {file.name}
                              </span>
                              <button
                                onClick={() =>
                                  removePendingFile(activeSubtask.id, i)
                                }
                                className="text-red-400 hover:text-red-600 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* File picker */}
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                        className="hidden"
                        onChange={(e) =>
                          handleFileSelect(activeSubtask.id, e.target.files)
                        }
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 border-2 border-dashed border-border hover:border-secondary text-gray-600 hover:text-secondary font-medium rounded-lg transition-all text-sm"
                      >
                        + Attach Supporting Documents / Images
                      </button>
                      <p className="text-xs text-gray-500 mt-1">
                        Images, PDFs, Word docs, ZIPs — max 20MB per file
                      </p>
                    </div>

                    {/* Inline message */}
                    {subtaskMessages[activeSubtask.id] && (
                      <div
                        className={`p-3 rounded-lg text-sm ${
                          subtaskMessages[activeSubtask.id].type === "success"
                            ? "bg-green-50 border border-green-200 text-green-700"
                            : "bg-red-50 border border-red-200 text-red-700"
                        }`}
                      >
                        {subtaskMessages[activeSubtask.id].text}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() =>
                          handleSaveOrSubmit(activeSubtask.id, "SAVE_DRAFT")
                        }
                        disabled={workState !== "IDLE"}
                        className="flex-1 px-4 py-2.5 border border-border text-foreground font-medium rounded-lg hover:bg-accent/10 transition-all disabled:opacity-50 text-sm"
                      >
                        {workState === "SAVING" ? "Saving..." : "Save Draft"}
                      </button>
                      <button
                        onClick={() =>
                          handleSaveOrSubmit(activeSubtask.id, "SUBMIT")
                        }
                        disabled={
                          workState !== "IDLE" ||
                          !(descriptions[activeSubtask.id] ?? "").trim()
                        }
                        className="flex-1 px-4 py-2.5 bg-secondary hover:bg-accent text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {workState === "SUBMITTING" ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                            Submitting...
                          </span>
                        ) : (
                          "Submit Solution ✓"
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Once submitted, this sub-task cannot be edited.
                    </p>
                  </div>
                )}
              </div>
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