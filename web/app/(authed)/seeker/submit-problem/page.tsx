"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateScope, createProblem } from "@/lib/api/problem";
import type { ProblemPayload, SubProblem, EnhancedProblem } from "@/types/problem";
import ProblemFormFields from "@/components/add-problem/ProblemFormFields";
import FileAttachmentUploader from "@/components/add-problem/FileAttachmentUploader";
import EnhancedProblemPreview from "@/components/add-problem/EnhancedProblemPreview";
import SubproblemsList from "@/components/add-problem/SubproblemsList";

type ViewState = "FORM_VIEW" | "LOADING_VIEW" | "PREVIEW_VIEW" | "SUCCESS_VIEW";

export default function SubmitProblemPage() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<ViewState>("FORM_VIEW");
  const [error, setError] = useState<string | null>(null);
  const [problemId, setProblemId] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProblemPayload>({
    title: "",
    backgroundContext: "",
    primaryStatement: "",
    objectives: "",
    constraints: "",
    preferredProgram: "",
  });

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear validation error when user starts typing
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors({
        ...validationErrors,
        [name]: false,
      });
    }
  };

  const handleGenerateScope = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    const errors = {
      title: !formData.title.trim(),
      backgroundContext: !formData.backgroundContext.trim(),
      primaryStatement: !formData.primaryStatement.trim(),
      objectives: !formData.objectives.trim(),
      constraints: !formData.constraints.trim(),
    };

    setValidationErrors(errors);

    // Check if there are any errors
    if (Object.values(errors).some(hasError => hasError)) {
      setError("Please fill in all required fields.");
      return;
    }

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
      setError(err instanceof Error ? err.message : "Failed to generate scope. Please try again.");
      setCurrentView("FORM_VIEW");
    }
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
        })),
      });

      setProblemId(response.id);
      setCurrentView("SUCCESS_VIEW");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish problem. Please try again.");
      setCurrentView("PREVIEW_VIEW");
    }
  };

  const handleDownloadPDF = () => {
    // TODO: Integrate jsPDF or html2canvas for client-side PDF generation
    alert("PDF download feature coming soon!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/10 via-background to-accent/10 p-4 py-12">
      <div className="container mx-auto px-4">
        {/* FORM_VIEW */}
        {currentView === "FORM_VIEW" && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary text-white mb-4 shadow-lg shadow-secondary/20">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Submit an Industry Problem
              </h1>
              <p className="text-muted-foreground">
                Describe your challenge and let AI help structure it into student-ready tasks
              </p>
            </div>

            <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
              {error && (
                <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleGenerateScope} className="space-y-6">
                <ProblemFormFields
                  formData={formData}
                  validationErrors={validationErrors}
                  onInputChange={handleInputChange}
                  onProgramChange={handlePreferredProgramChange}
                />

                <FileAttachmentUploader
                  attachments={attachments}
                  onFileChange={handleFileChange}
                  onRemoveFile={handleRemoveFile}
                />

                <div className="flex gap-4 pt-4">
                  <Link
                    href="/dashboard"
                    className="flex-1 px-6 py-3 border border-border text-foreground font-semibold rounded-lg hover:bg-accent/10 transition-all text-center"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-secondary hover:bg-accent text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                  >
                    Analyze & Generate Scope
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* LOADING_VIEW */}
        {currentView === "LOADING_VIEW" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Analyzing Your Problem...
            </h2>
            <p className="text-muted-foreground text-center max-w-md">
              Gemini AI is breaking down your problem into departmental sub-tasks and generating a structured scope
            </p>
          </div>
        )}

        {/* PREVIEW_VIEW */}
        {currentView === "PREVIEW_VIEW" && enhancedProblem && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Review Problem Proposal
              </h1>
              <p className="text-muted-foreground">
                Review your finalized proposal and generated sub-tasks before publishing
              </p>
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

              <div className="flex gap-4 pt-4 mt-6">
                <button
                  onClick={() => setCurrentView("FORM_VIEW")}
                  className="flex-1 px-6 py-3 border border-border text-foreground font-semibold rounded-lg hover:bg-accent/10 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmAndPublish}
                  className="flex-1 px-6 py-3 bg-secondary hover:bg-accent text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                  Confirm & Publish
                </button>
              </div>
            </div>
          </>
        )}

        {/* SUCCESS_VIEW */}
        {currentView === "SUCCESS_VIEW" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
              <svg
                className="w-12 h-12 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-2">
              Problem Published Successfully!
            </h1>
            <p className="text-muted-foreground text-center max-w-md mb-8">
              Your problem has been published and is now available for students to work on
            </p>

            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className="px-6 py-3 border border-border text-foreground font-semibold rounded-lg hover:bg-accent/10 transition-all"
              >
                Return to Dashboard
              </Link>
              <button
                onClick={handleDownloadPDF}
                className="px-6 py-3 bg-secondary hover:bg-accent text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                Download Specification (PDF)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
