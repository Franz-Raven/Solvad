"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import Portal from "@/components/portal";
import { generateScope, createProblem } from "./api/submit";
import type { ProblemPayload, SubProblem, EnhancedProblem } from "@/types/problem";
import ProblemFormFields from "./components/ProblemFormFields";
import FileAttachmentUploader from "./components/FileAttachmentUploader";
import EnhancedProblemPreview from "./components/EnhancedProblemPreview";
import SubproblemsList from "./components/SubproblemsList";

type ViewState = "FORM_VIEW" | "LOADING_VIEW" | "PREVIEW_VIEW" | "SUCCESS_VIEW";

const AI_UNAVAILABLE_MESSAGE =
  "We couldn't generate the AI scope right now. You can retry, or continue and define the sub-problems yourself.";
const NO_SUBPROBLEMS_MESSAGE = "Add at least one sub-problem before publishing.";

// Splits free-text into list items: one per line, trimmed, with one leading
// list marker (-, *, •, "1." or "1)") removed and empty lines dropped.
const toList = (text: string): string[] =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^(?:[-*•]|\d+[.)])(?:\s+|$)/, "").trim())
    .filter((line) => line.length > 0);

export default function SubmitProblemPage() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<ViewState>("FORM_VIEW");
  const [error, setError] = useState<string | null>(null);
  const [problemId, setProblemId] = useState<string | null>(null);
  const [problemDocumentUrl, setProblemDocumentUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProblemPayload>({
    title: "",
    backgroundContext: "",
    primaryStatement: "",
    objectives: "",
    constraints: "",
    preferredProgram: "",
  });

  // Seeker's own reference attachments are kept intact here
  const [attachments, setAttachments] = useState<File[]>([]);
  const [validationErrors, setValidationErrors] = useState<{
    title?: boolean;
    backgroundContext?: boolean;
    primaryStatement?: boolean;
    objectives?: boolean;
    constraints?: boolean;
  }>({});

  const [enhancedProblem, setEnhancedProblem] = useState<EnhancedProblem | null>(null);
  const [subProblems, setSubProblems] = useState<SubProblem[]>([]);
  const [aiUnavailable, setAiUnavailable] = useState(false);

  const handleTextChange = (name: string, value: string) => {
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
    setValidationErrors((current) => {
      const field = name as keyof typeof current;
      return current[field] ? { ...current, [name]: false } : current;
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    handleTextChange(name, value);
  };

  const runGenerateScope = async () => {
    setAiUnavailable(false);
    setError(null);
    setCurrentView("LOADING_VIEW");

    try {
      const response = await generateScope({
        ...formData,
        attachments,
      });
      setEnhancedProblem(response.enhancedProblem);
      setSubProblems(response.generatedSubtasks);
      setCurrentView("PREVIEW_VIEW");
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        // Shown in the AI-unavailable modal rather than the inline error banner
        setAiUnavailable(true);
      } else {
        setError(err instanceof Error ? err.message : "Failed to generate scope. Please try again.");
      }
      setCurrentView("FORM_VIEW");
    }
  };

  const handleGenerateScope = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAiUnavailable(false);

    const errors = {
      title: !formData.title.trim(),
      backgroundContext: !formData.backgroundContext.trim(),
      primaryStatement: !formData.primaryStatement.trim(),
      objectives: !formData.objectives.trim(),
      constraints: !formData.constraints.trim(),
    };

    setValidationErrors(errors);

    if (Object.values(errors).some(hasError => hasError)) {
      setError("Please fill in all required fields.");
      return;
    }

    await runGenerateScope();
  };

  // Closes the AI-unavailable modal and leaves the seeker on the filled-in form
  const handleBackFromAiUnavailable = () => {
    setAiUnavailable(false);
  };

  const handleContinueManually = () => {
    setEnhancedProblem({
      title: formData.title,
      backgroundContext: formData.backgroundContext,
      primaryStatement: formData.primaryStatement,
      objectives: toList(formData.objectives),
      constraints: toList(formData.constraints),
      sdgFocus: undefined,
    });
    setSubProblems([]);
    setAiUnavailable(false);
    setError(null);
    setCurrentView("PREVIEW_VIEW");
  };

  const handleSubProblemChange = (
    id: string,
    field: keyof SubProblem,
    value: string
  ) => {
    setSubProblems(
      subProblems.map((sp) =>
        sp.id === id ? { ...sp, [field]: value } : sp
      )
    );
  };

  const handleDeleteSubProblem = (id: string) => {
    setSubProblems(subProblems.filter((sp) => sp.id !== id));
  };

  const handleAddSubProblem = () => {
    const newSubProblem: SubProblem = {
      id: `temp-${Date.now()}`,
      title: "",
      departmentFocus: "",
      description: "",
    };
    setSubProblems([...subProblems, newSubProblem]);
  };

  const handleEnhancedProblemChange = (field: string, value: string | string[]) => {
    if (enhancedProblem) {
      setEnhancedProblem({
        ...enhancedProblem,
        [field]: value,
      });
    }
  };

  const handlePreferredProgramChange = (value: string) => {
    setFormData({ ...formData, preferredProgram: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAttachments(filesArray);
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleConfirmAndPublish = async () => {
    if (!enhancedProblem) return;
    if (subProblems.length === 0) {
      setError(NO_SUBPROBLEMS_MESSAGE);
      return;
    }

    setError(null);
    setCurrentView("LOADING_VIEW");

    try {
      const response = await createProblem({
        title: enhancedProblem.title,
        backgroundContext: enhancedProblem.backgroundContext,
        primaryStatement: enhancedProblem.primaryStatement,
        objectives: JSON.stringify(enhancedProblem.objectives),
        constraints: JSON.stringify(enhancedProblem.constraints),
        preferredProgram: formData.preferredProgram,
        sdgFocus: enhancedProblem.sdgFocus,
        subtasks: subProblems.map((sp) => ({
          title: sp.title,
          departmentFocus: sp.departmentFocus,
          sdgFocus: sp.sdgFocus,
          description: sp.description,
          attachments: [], // Send empty array since solvers no longer upload files
        })),
      });

      setProblemId(response.id);
      setProblemDocumentUrl(response.problemDocumentUrl || null);
      setCurrentView("SUCCESS_VIEW");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish problem. Please try again.");
      setCurrentView("PREVIEW_VIEW");
    }
  };

  const handleDownloadPDF = async () => {
    if (!problemDocumentUrl) {
      alert("PDF document is not available yet. Please try again in a moment.");
      return;
    }

    try {
      const response = await fetch(problemDocumentUrl);
      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `problem_specification_${problemId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download PDF:", error);
      alert("Failed to download PDF. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/10 via-background to-accent/10 p-4 py-12">
      <div className="container mx-auto px-4">
        {currentView === "FORM_VIEW" && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary text-white mb-4 shadow-lg shadow-secondary/20">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Submit an Industry Problem</h1>
              <p className="text-muted-foreground">Describe your challenge and let AI help structure it into student-ready tasks</p>
            </div>

            <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
              {error && (
                <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleGenerateScope} className="space-y-6" data-tour="problem-form">
                <ProblemFormFields
                  formData={formData}
                  validationErrors={validationErrors}
                  onInputChange={handleInputChange}
                  onTextChange={handleTextChange}
                  onProgramChange={handlePreferredProgramChange}
                />

                {/* Seeker Proposal Reference Files */}
                <FileAttachmentUploader
                  attachments={attachments}
                  onFileChange={handleFileChange}
                  onRemoveFile={handleRemoveFile}
                />

                <div className="flex gap-4 pt-4">
                  <Link href="/dashboard" className="flex-1 px-6 py-3 border border-border text-foreground font-semibold rounded-lg hover:bg-accent/10 transition-all text-center">
                    Cancel
                  </Link>
                  <button type="submit" data-tour="problem-analyze" className="flex-1 px-6 py-3 bg-secondary hover:bg-accent text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg">
                    Analyze & Generate Scope
                  </button>
                </div>
              </form>
            </div>

            {aiUnavailable && (
              <Portal>
                <div
                  className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
                  onClick={(event) => {
                    if (event.target === event.currentTarget) handleBackFromAiUnavailable();
                  }}
                >
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="ai-unavailable-title"
                    className="bg-card rounded-2xl shadow-2xl w-full max-w-lg border border-border p-8 animate-in zoom-in-95 duration-200"
                  >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-destructive/10 text-destructive border border-destructive/20">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      </svg>
                    </div>
                    <h2 id="ai-unavailable-title" className="text-xl font-bold text-foreground text-center mb-2">
                      AI Scoping Unavailable
                    </h2>
                    <p className="text-sm text-muted-foreground text-center mb-6">
                      {AI_UNAVAILABLE_MESSAGE}
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={handleBackFromAiUnavailable}
                        className="flex-1 px-4 py-3 border border-border text-foreground font-semibold rounded-lg hover:bg-accent/10 transition-all"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={runGenerateScope}
                        className="flex-1 px-4 py-3 border border-border text-foreground font-semibold rounded-lg hover:bg-accent/10 transition-all"
                      >
                        Retry
                      </button>
                      <button
                        type="button"
                        onClick={handleContinueManually}
                        className="flex-1 whitespace-nowrap px-4 py-3 bg-secondary hover:bg-accent text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                      >
                        Continue manually
                      </button>
                    </div>
                  </div>
                </div>
              </Portal>
            )}
          </>
        )}

        {currentView === "LOADING_VIEW" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Analyzing Your Problem...</h2>
            <p className="text-muted-foreground text-center max-w-md">Gemini is structuring your problem and an AI reviewer is checking its quality. This can take up to a minute.</p>
          </div>
        )}

        {currentView === "PREVIEW_VIEW" && enhancedProblem && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Review Problem Proposal</h1>
              <p className="text-muted-foreground">Review your finalized proposal and generated sub-tasks before publishing</p>
            </div>

            <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
              {error && (
                <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <EnhancedProblemPreview
                problem={enhancedProblem}
                preferredProgram={formData.preferredProgram}
                attachments={attachments}
                onProblemChange={handleEnhancedProblemChange}
                onProgramChange={handlePreferredProgramChange}
              />

              <SubproblemsList
                subProblems={subProblems}
                onSubProblemChange={handleSubProblemChange}
                onDeleteSubProblem={handleDeleteSubProblem}
                onAddSubProblem={handleAddSubProblem}
              />

              {/* REMOVED: SubmissionRequirements Component */}

              <div className="flex gap-4 pt-4 mt-6">
                <button onClick={() => setCurrentView("FORM_VIEW")} className="flex-1 px-6 py-3 border border-border text-foreground font-semibold rounded-lg hover:bg-accent/10 transition-all">
                  Back
                </button>
                <button
                  onClick={handleConfirmAndPublish}
                  disabled={subProblems.length === 0}
                  className="flex-1 px-6 py-3 bg-secondary hover:bg-accent text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-secondary disabled:hover:shadow-md"
                >
                  Confirm & Publish
                </button>
              </div>
              {subProblems.length === 0 && (
                <p className="mt-3 text-sm text-muted-foreground text-right">
                  {NO_SUBPROBLEMS_MESSAGE}
                </p>
              )}
            </div>
          </>
        )}

        {currentView === "SUCCESS_VIEW" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-2">Problem Published Successfully!</h1>
            <p className="text-muted-foreground text-center max-w-md mb-8">Your problem has been published and is now available for students to work on</p>

            <div className="flex w-full max-w-[560px] flex-col gap-4 sm:flex-row">
              <Link href="/dashboard" className="flex-1 whitespace-nowrap px-4 py-3 border border-border text-foreground font-semibold rounded-lg hover:bg-accent/10 transition-all text-center">
                Return to Dashboard
              </Link>
              <button onClick={handleDownloadPDF} className="flex-1 whitespace-nowrap px-4 py-3 bg-secondary hover:bg-accent text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg">
                Download Specification (PDF)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}