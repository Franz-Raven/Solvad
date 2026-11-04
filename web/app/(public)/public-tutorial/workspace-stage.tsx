"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  GitBranch,
  Info,
  X,
} from "lucide-react";

const PROBLEM_TITLE = "Optimizing campus shuttle routes";

const SUBTASK = {
  title: "Route optimization",
  departmentFocus: "Information Technology",
  description:
    "Build a real-time GPS arrival prediction model from the shuttle pings the operations team already collects.",
};

const SEEKER_NAME = "Metro State University Transport Office";

const ORIGINAL_APPROACH =
  "Built a lightweight GPS arrival model from the live shuttle feed and validated it against two weeks of historical rides. The model predicts each shuttle's arrival at every stop using current position, speed, and direction.";

const INITIAL_NARRATIVE =
  "I built a lightweight prediction model on top of the existing GPS feed. The model uses the last five position pings for each shuttle to estimate speed and direction, then predicts arrival times for the next three stops.\n\nI validated the model against two weeks of historical shuttle rides and documented the error rate for each route. The result is a real-time ETA service that can be called by the student mobile app.";

const INITIAL_DELTA =
  "Added weather and traffic signals to the original arrival model. The original model only used GPS speed and direction, so it struggled during rain and peak-hour congestion.\n\nWith the new signals, peak-hour accuracy improved from 74% to 89%, and the model keeps producing useful ETAs when shuttles slow down unexpectedly.";

type WorkspaceStageProps = {
  highlight: (target: string) => string;
};

export default function WorkspaceStage({ highlight }: WorkspaceStageProps) {
  const [description, setDescription] = useState(INITIAL_NARRATIVE);
  const [deltaDescription, setDeltaDescription] = useState(INITIAL_DELTA);
  const [showFullOriginal, setShowFullOriginal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"IDLE" | "SAVED">("IDLE");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = description.trim().length > 0 && deltaDescription.trim().length > 0;

  const saveDraft = () => {
    setSaveStatus("SAVED");
  };

  return (
    <section
      className="relative mt-6 overflow-hidden rounded-3xl border border-border bg-background shadow-xl"
      id="tour-stage"
    >
      <div
        className={`flex flex-col gap-3 border-b border-border bg-background px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between md:px-7 ${highlight(
          "solver-workspace-header",
        )}`}
        data-tour="solver-workspace-header"
      >
        <div className="flex min-w-0 items-center gap-4">
          <button
            className="flex flex-shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-accent"
            type="button"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back
          </button>
          <div className="hidden h-4 w-px bg-border sm:block" />
          <h2 className="hidden truncate text-sm font-bold text-foreground sm:block">
            {PROBLEM_TITLE}
          </h2>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="rounded-md border border-accent/20 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent">
            Drafting
          </span>
          <button
            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100"
            type="button"
          >
            Abandon Project
          </button>
        </div>
      </div>

      <div className="bg-muted/20 p-5 md:p-7">
        <div
          className={`flex flex-col gap-6 rounded-3xl border border-border bg-background p-6 shadow-sm md:flex-row md:p-8 ${highlight(
            "solver-workspace-brief",
          )}`}
          data-tour="solver-workspace-brief"
        >
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="rounded-md border border-accent/20 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent">
                {SUBTASK.departmentFocus}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Subtask Module
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                <GitBranch className="h-3 w-3" /> Forked from Maya Chen
              </span>
            </div>
            <h3 className="mb-3 text-2xl font-bold text-foreground">{SUBTASK.title}</h3>
            <p className="text-sm font-medium leading-relaxed text-muted-foreground">
              {SUBTASK.description}
            </p>
          </div>

          <div className="flex w-full flex-shrink-0 flex-col gap-5 rounded-2xl border border-border bg-muted/40 p-6 md:w-80">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-border bg-background shadow-sm">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Requested By
                </p>
                <p className="truncate text-sm font-bold text-foreground" title={SEEKER_NAME}>
                  {SEEKER_NAME}
                </p>
              </div>
            </div>

            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-bold text-foreground shadow-sm transition-colors hover:bg-muted hover:text-accent"
              type="button"
            >
              View Full Details <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {submitted && (
          <div className="mt-6 flex items-start gap-4 rounded-2xl border border-accent/30 bg-accent/10 p-5 shadow-sm">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
            <div>
              <h3 className="text-sm font-bold text-foreground">Solution submitted for review</h3>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                Your workspace is now locked. The seeker will approve or reject it, and you will be
                notified when a decision is made.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-background shadow-sm">
          <div className="flex flex-col gap-2 border-b border-border bg-muted/30 px-6 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
            <h3 className="text-lg font-bold text-foreground">Workspace Editor</h3>
            <div className="flex items-center gap-3">
              {saveStatus === "SAVED" ? (
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
                  Draft saved just now
                </span>
              ) : (
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Autosaves every 30 seconds
                </span>
              )}
            </div>
          </div>

          <div className="space-y-8 p-6 md:p-8">
            <div
              className={`rounded-lg ${highlight("solver-workspace-narrative")}`}
              data-tour="solver-workspace-narrative"
            >
              <label className="mb-2 block pl-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Solution Narrative <span className="text-rose-500">*</span>
              </label>
              <textarea
                className="min-h-[280px] w-full resize-y rounded-xl border border-border bg-muted/30 px-5 py-4 text-sm font-medium leading-relaxed text-foreground transition-colors placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-4 focus:ring-secondary/10"
                disabled={submitted}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setSaveStatus("IDLE");
                }}
                placeholder="Document your findings, code architecture, or research methodology here..."
                value={description}
              />
            </div>

            <div
              className={`rounded-lg ${highlight("solver-workspace-delta")}`}
              data-tour="solver-workspace-delta"
            >
              <label className="mb-2 block pl-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Changes from Original Solution <span className="text-rose-500">*</span>
              </label>

              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/50 p-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-800">
                    <Info className="h-3.5 w-3.5" /> Original Approach
                  </p>
                  <button
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 transition-colors hover:text-blue-800"
                    onClick={() => setShowFullOriginal((current) => !current)}
                    type="button"
                  >
                    {showFullOriginal ? (
                      <>
                        See Less <ChevronUp className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        See Full Approach <ChevronDown className="h-3 w-3" />
                      </>
                    )}
                  </button>
                </div>
                <p
                  className={`text-sm font-medium leading-relaxed text-blue-900/80 ${
                    showFullOriginal ? "whitespace-pre-wrap" : "line-clamp-3"
                  }`}
                >
                  {ORIGINAL_APPROACH}
                </p>
              </div>

              <textarea
                className="min-h-[200px] w-full resize-y rounded-xl border border-border bg-muted/30 px-5 py-4 text-sm font-medium leading-relaxed text-foreground transition-colors placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-4 focus:ring-secondary/10"
                disabled={submitted}
                onChange={(event) => {
                  setDeltaDescription(event.target.value);
                  setSaveStatus("IDLE");
                }}
                placeholder="Detail exactly what you improved, fixed, or changed from the original solution..."
                value={deltaDescription}
              />
            </div>
          </div>

          {!submitted && (
            <div className="flex flex-col gap-3 border-t border-border bg-muted/30 px-6 py-6 sm:flex-row sm:items-center sm:justify-between md:px-8">
              <p className="text-sm font-medium text-muted-foreground">
                {canSubmit ? (
                  "Your draft is ready to submit when you are."
                ) : (
                  <span className="flex items-center gap-1.5 font-bold text-rose-500">
                    Please fill out all required fields.
                  </span>
                )}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  className={`rounded-full border border-border bg-background px-6 py-3 text-sm font-bold text-foreground shadow-sm transition-colors hover:bg-muted active:scale-[0.98] ${highlight(
                    "solver-workspace-save",
                  )}`}
                  data-tour="solver-workspace-save"
                  onClick={saveDraft}
                  type="button"
                >
                  Save Draft
                </button>
                <button
                  className={`inline-flex items-center justify-center gap-2 rounded-full bg-accent px-8 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-secondary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${highlight(
                    "solver-workspace-submit",
                  )}`}
                  data-tour="solver-workspace-submit"
                  disabled={!canSubmit}
                  onClick={() => setConfirmOpen(true)}
                  type="button"
                >
                  Submit Project
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[59] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-background shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-8">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent shadow-sm">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-center text-2xl font-bold text-foreground">
                Submit Final Project?
              </h3>
              <p className="mt-2 text-center text-sm font-medium leading-relaxed text-muted-foreground">
                Are you ready to submit your solution to the seeker? You will not be able to edit
                this workspace once it is submitted.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border bg-muted/30 p-6 sm:flex-row">
              <button
                className="flex-1 rounded-full border border-border bg-background px-4 py-3 text-sm font-bold text-foreground shadow-sm transition-colors hover:bg-muted"
                onClick={() => setConfirmOpen(false)}
                type="button"
              >
                Go Back
              </button>
              <button
                className="flex-1 rounded-full bg-accent px-4 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-secondary active:scale-[0.98]"
                onClick={() => {
                  setConfirmOpen(false);
                  setSubmitted(true);
                }}
                type="button"
              >
                Yes, Submit Now
              </button>
            </div>

            <button
              aria-label="Close submission confirmation"
              className="absolute right-6 top-6 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => setConfirmOpen(false)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
