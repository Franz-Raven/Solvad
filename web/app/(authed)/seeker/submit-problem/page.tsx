"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateScope, createProblem } from "@/lib/api/problem";
import type { ProblemPayload, SubProblem } from "@/types/problem";
import { courseCategories } from "@/lib/data/courses";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    requiredProgram: "",
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<{
    title?: boolean;
    backgroundContext?: boolean;
    primaryStatement?: boolean;
    objectives?: boolean;
    constraints?: boolean;
  }>({});

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
    setError(null);
    setCurrentView("LOADING_VIEW");

    try {
      const response = await createProblem({
        ...formData,
        subtasks: subProblems.map((sp) => ({
          title: sp.title,
          departmentFocus: sp.departmentFocus,
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
      <div className="max-w-4xl mx-auto">
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
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="title" className="block text-sm font-medium text-foreground">
                      Problem Title *
                    </label>
                    {validationErrors.title && (
                      <span className="text-xs text-destructive font-medium">
                        You need to fill this up
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground ${
                      validationErrors.title ? 'border-destructive' : 'border-border'
                    }`}
                    placeholder="e.g., Automated Inventory Management System"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="backgroundContext" className="block text-sm font-medium text-foreground">
                      Background Context *
                    </label>
                    {validationErrors.backgroundContext && (
                      <span className="text-xs text-destructive font-medium">
                        You need to fill this up
                      </span>
                    )}
                  </div>
                  <textarea
                    id="backgroundContext"
                    name="backgroundContext"
                    value={formData.backgroundContext}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground resize-none ${
                      validationErrors.backgroundContext ? 'border-destructive' : 'border-border'
                    }`}
                    placeholder="Describe the industry context, current situation, and why this problem needs solving"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="primaryStatement" className="block text-sm font-medium text-foreground">
                      Primary Problem Statement *
                    </label>
                    {validationErrors.primaryStatement && (
                      <span className="text-xs text-destructive font-medium">
                        You need to fill this up
                      </span>
                    )}
                  </div>
                  <textarea
                    id="primaryStatement"
                    name="primaryStatement"
                    value={formData.primaryStatement}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground resize-none ${
                      validationErrors.primaryStatement ? 'border-destructive' : 'border-border'
                    }`}
                    placeholder="Clearly state the core problem that needs to be addressed"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="objectives" className="block text-sm font-medium text-foreground">
                      Objectives *
                    </label>
                    {validationErrors.objectives && (
                      <span className="text-xs text-destructive font-medium">
                        You need to fill this up
                      </span>
                    )}
                  </div>
                  <textarea
                    id="objectives"
                    name="objectives"
                    value={formData.objectives}
                    onChange={handleInputChange}
                    rows={3}
                    className={`w-full px-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground resize-none ${
                      validationErrors.objectives ? 'border-destructive' : 'border-border'
                    }`}
                    placeholder="What are the desired outcomes and goals?"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="constraints" className="block text-sm font-medium text-foreground">
                      Constraints *
                    </label>
                    {validationErrors.constraints && (
                      <span className="text-xs text-destructive font-medium">
                        You need to fill this up
                      </span>
                    )}
                  </div>
                  <textarea
                    id="constraints"
                    name="constraints"
                    value={formData.constraints}
                    onChange={handleInputChange}
                    rows={3}
                    className={`w-full px-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground resize-none ${
                      validationErrors.constraints ? 'border-destructive' : 'border-border'
                    }`}
                    placeholder="Budget limits, timeline, technical requirements, etc."
                  />
                </div>

                <div>
                  <label htmlFor="requiredProgram" className="block text-sm font-medium text-foreground mb-2">
                    Required Academic Program *
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Select the academic program most suitable for solving this problem
                  </p>
                  
                  <Select 
                    value={formData.requiredProgram} 
                    onValueChange={(value) => setFormData({ ...formData, requiredProgram: value })}
                  >
                    <SelectTrigger className="w-full px-4 py-3 !h-auto rounded-lg border border-border bg-background text-foreground">
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseCategories.map((category) => (
                        <SelectGroup key={category.name}>
                          <SelectLabel>{category.name}</SelectLabel>
                          {category.courses.map((course) => (
                            <SelectItem key={course} value={course}>
                              {course}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="attachments" className="block text-sm font-medium text-foreground mb-2">
                    Attachments (Optional)
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Upload supporting documents (Word, PDF, JPEG, PNG) to help AI analyze your problem
                  </p>
                  
                  <input
                    type="file"
                    id="attachments"
                    multiple
                    accept=".doc,.docx,.pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="attachments"
                    className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-secondary hover:bg-secondary/5 transition-all"
                  >
                    <svg
                      className="w-5 h-5 mr-2 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span className="text-sm text-muted-foreground">
                      {attachments.length > 0 
                        ? `${attachments.length} file(s) selected` 
                        : "Click to upload files"}
                    </span>
                  </label>
                  
                  {attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between px-3 py-2 bg-background border border-border rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-secondary"
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
                            <span className="text-sm text-foreground">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="text-destructive hover:text-destructive/80 transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

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
        {currentView === "PREVIEW_VIEW" && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Review Proposed Sub-Problems
              </h1>
              <p className="text-muted-foreground">
                Edit, add, or remove sub-tasks before publishing
              </p>
            </div>

            <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
              {error && (
                <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4 mb-6">
                {subProblems.map((subProblem) => (
                  <div
                    key={subProblem.id}
                    className="p-4 border border-border rounded-lg bg-background"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <input
                        type="text"
                        value={subProblem.title}
                        onChange={(e) =>
                          handleSubProblemChange(subProblem.id, "title", e.target.value)
                        }
                        className="flex-1 text-lg font-semibold bg-transparent border-b border-border focus:border-secondary focus:outline-none text-foreground pb-1"
                        placeholder="Sub-task Title"
                      />
                      <button
                        onClick={() => handleDeleteSubProblem(subProblem.id)}
                        className="ml-4 text-destructive hover:text-destructive/80 transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-3">
                      <Select
                        value={subProblem.departmentFocus}
                        onValueChange={(value) =>
                          handleSubProblemChange(subProblem.id, "departmentFocus", value)
                        }
                      >
                        <SelectTrigger className="w-full px-3 py-2 !h-auto rounded border border-border bg-background text-foreground text-sm">
                          <SelectValue placeholder="Select academic program focus" />
                        </SelectTrigger>
                        <SelectContent>
                          {courseCategories.map((category) => (
                            <SelectGroup key={category.name}>
                              <SelectLabel>{category.name}</SelectLabel>
                              {category.courses.map((course) => (
                                <SelectItem key={course} value={course}>
                                  {course}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>

                      <textarea
                        value={subProblem.description}
                        onChange={(e) =>
                          handleSubProblemChange(
                            subProblem.id,
                            "description",
                            e.target.value
                          )
                        }
                        rows={3}
                        className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-secondary text-foreground text-sm resize-none"
                        placeholder="Description"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddSubProblem}
                className="w-full py-3 border-2 border-dashed border-border hover:border-secondary text-foreground hover:text-secondary font-semibold rounded-lg transition-all mb-6"
              >
                + Add Sub-problem
              </button>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setCurrentView("FORM_VIEW")}
                  className="flex-1 px-6 py-3 border border-border text-foreground font-semibold rounded-lg hover:bg-accent/10 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmAndPublish}
                  disabled={subProblems.length === 0}
                  className="flex-1 px-6 py-3 bg-secondary hover:bg-accent text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
