"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateScope, createProblem } from "@/lib/api/problem";
import type { ProblemPayload, SubProblem } from "@/types/problem";

type ViewState = "FORM_VIEW" | "LOADING_VIEW" | "PREVIEW_VIEW" | "SUCCESS_VIEW";

const COURSE_OPTIONS = [
  "BS Information Technology",
  "BS Computer Science",
  "BS Civil Engineering",
  "BS Mechanical Engineering",
  "BS Electrical Engineering",
  "BS Electronics Engineering",
  "BS Architecture",
  "BS Business Administration",
  "BS Accountancy",
];

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
    requiredCourse: "",
  });

  const [subProblems, setSubProblems] = useState<SubProblem[]>([]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGenerateScope = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCurrentView("LOADING_VIEW");

    try {
      const response = await generateScope(formData);
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
                  <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                    Problem Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground"
                    placeholder="e.g., Automated Inventory Management System"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="backgroundContext" className="block text-sm font-medium text-foreground mb-2">
                    Background Context
                  </label>
                  <textarea
                    id="backgroundContext"
                    name="backgroundContext"
                    value={formData.backgroundContext}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground resize-none"
                    placeholder="Describe the industry context, current situation, and why this problem needs solving"
                  />
                </div>

                <div>
                  <label htmlFor="primaryStatement" className="block text-sm font-medium text-foreground mb-2">
                    Primary Problem Statement *
                  </label>
                  <textarea
                    id="primaryStatement"
                    name="primaryStatement"
                    value={formData.primaryStatement}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground resize-none"
                    placeholder="Clearly state the core problem that needs to be addressed"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="objectives" className="block text-sm font-medium text-foreground mb-2">
                    Objectives
                  </label>
                  <textarea
                    id="objectives"
                    name="objectives"
                    value={formData.objectives}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground resize-none"
                    placeholder="What are the desired outcomes and goals?"
                  />
                </div>

                <div>
                  <label htmlFor="constraints" className="block text-sm font-medium text-foreground mb-2">
                    Constraints
                  </label>
                  <textarea
                    id="constraints"
                    name="constraints"
                    value={formData.constraints}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground resize-none"
                    placeholder="Budget limits, timeline, technical requirements, etc."
                  />
                </div>

                <div>
                  <label htmlFor="requiredCourse" className="block text-sm font-medium text-foreground mb-2">
                    Required Academic Course *
                  </label>
                  <select
                    id="requiredCourse"
                    name="requiredCourse"
                    value={formData.requiredCourse}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-foreground"
                    required
                  >
                    <option value="">Select a course</option>
                    {COURSE_OPTIONS.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
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
                      <input
                        type="text"
                        value={subProblem.departmentFocus}
                        onChange={(e) =>
                          handleSubProblemChange(
                            subProblem.id,
                            "departmentFocus",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-secondary text-foreground text-sm"
                        placeholder="Department Focus (e.g., Backend Development)"
                      />

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
