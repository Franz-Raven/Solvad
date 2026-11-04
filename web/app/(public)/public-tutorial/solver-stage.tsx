"use client";

import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  FileText,
  GitBranch,
  History,
  Lock,
  Mail,
  Network,
  Pencil,
  Phone,
  Upload,
  UserCircle,
  Users,
  X,
} from "lucide-react";

type SolverTab = "blueprint" | "subtasks" | "tree" | "history";
type SolverTreeState = "empty" | "complete";

type SolverAttempt = {
  id: string;
  solverFirstName: string;
  solverLastName: string;
  degreeProgram: string;
  institution: string;
  status: "COMPLETED" | "PENDING_REVIEW" | "ACTIVE";
  claimedAt: string;
  parentAttemptId?: string;
  parentSolverName?: string;
  targetSubtaskTitle: string;
  description: string;
  deltaDescription?: string;
};

type SolverSubtask = {
  id: string;
  title: string;
  departmentFocus: string;
  description: string;
};

const SOLVER_PROBLEM = {
  title: "Optimizing campus shuttle routes",
  status: "OPEN",
  preferredProgram: "Information Technology",
  organizationName: "Metro State University Transport Office",
  contactPerson: "Dr. Elena Cruz",
  contactNumber: "+63 917 555 0142",
  seekerEmail: "transport.office@metrostate.edu",
  backgroundContext:
    "Our campus shuttle runs fixed routes, but riders wait more than 20 minutes during peak hours. The transport office already collects GPS pings from every shuttle.",
  primaryStatement:
    "Students cannot reliably reach classes on time because shuttle arrival times are unpredictable.",
  objectives: [
    "Reduce average peak-hour wait time to under 10 minutes.",
    "Publish live arrival estimates in the student mobile app.",
  ],
  constraints: [
    "Launch within one semester.",
    "Use the existing shuttle fleet and GPS feed.",
    "Avoid new hardware purchases.",
  ],
  subtasks: [
    {
      id: "route-optimization",
      title: "Route optimization",
      departmentFocus: "Information Technology",
      description:
        "Build a real-time GPS arrival prediction model from the shuttle pings the operations team already collects.",
    },
    {
      id: "rider-experience",
      title: "Rider experience",
      departmentFocus: "Information Technology",
      description:
        "Publish live ETAs and delay notifications in the student mobile app using the prediction feed.",
    },
    {
      id: "data-validation",
      title: "Data validation",
      departmentFocus: "Data Science",
      description:
        "Validate the prediction model against two weeks of historical shuttle rides before launch.",
    },
  ] satisfies SolverSubtask[],
};

const COMPLETED_ATTEMPTS: SolverAttempt[] = [
  {
    id: "attempt-maya",
    solverFirstName: "Maya",
    solverLastName: "Chen",
    degreeProgram: "BS Information Technology",
    institution: "De La Salle University",
    status: "COMPLETED",
    claimedAt: "2026-10-12",
    targetSubtaskTitle: "Route optimization",
    description:
      "Built a lightweight GPS arrival model from the live shuttle feed and validated it against two weeks of historical rides.",
  },
  {
    id: "attempt-joseph",
    solverFirstName: "Joseph",
    solverLastName: "Kariuki",
    degreeProgram: "BS Computer Science",
    institution: "University of Nairobi",
    status: "COMPLETED",
    claimedAt: "2026-10-24",
    parentAttemptId: "attempt-maya",
    parentSolverName: "Maya Chen",
    targetSubtaskTitle: "Route optimization",
    description:
      "Added weather and traffic signals to the original arrival model so peak-hour predictions stay accurate during rain.",
    deltaDescription:
      "Added weather and traffic signals to the model, improving peak-hour accuracy from 74% to 89%.",
  },
  {
    id: "attempt-amina",
    solverFirstName: "Amina",
    solverLastName: "Bello",
    degreeProgram: "BS Data Science",
    institution: "University of Lagos",
    status: "COMPLETED",
    claimedAt: "2026-10-28",
    parentAttemptId: "attempt-maya",
    parentSolverName: "Maya Chen",
    targetSubtaskTitle: "Route optimization",
    description:
      "Kept the original model and added a fallback that uses scheduled timetables when a shuttle loses GPS signal.",
    deltaDescription:
      "Added a timetable fallback for shuttles with weak GPS coverage, keeping ETAs available in dead zones.",
  },
];

const TABS: { id: SolverTab; label: string }[] = [
  { id: "blueprint", label: "Problem Blueprint" },
  { id: "subtasks", label: "Sub-problems" },
  { id: "tree", label: "Solution Tree" },
  { id: "history", label: "History" },
];

type SolverStageProps = {
  activeTarget?: string;
  flowId?: string | null;
  highlight: (target: string) => string;
};

export default function SolverStage({ activeTarget, flowId, highlight }: SolverStageProps) {
  const [tab, setTab] = useState<SolverTab>("subtasks");
  const [selectedSubtaskId, setSelectedSubtaskId] = useState(SOLVER_PROBLEM.subtasks[0].id);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [proposalDismissed, setProposalDismissed] = useState(false);
  const [proposedApproach, setProposedApproach] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [treeState, setTreeState] = useState<SolverTreeState>("empty");
  const [forkMode, setForkMode] = useState(false);
  const [forkNodeId, setForkNodeId] = useState<string | null>(null);
  const [detailNodeId, setDetailNodeId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedSubtask =
    SOLVER_PROBLEM.subtasks.find((subtask) => subtask.id === selectedSubtaskId) ??
    SOLVER_PROBLEM.subtasks[0];
  const canPropose = !submitted;
  const proposalTargetActive =
    activeTarget === "solver-proposal-approach" ||
    activeTarget === "solver-proposal-files" ||
    activeTarget === "solver-proposal-submit";
  const forkTargetActive =
    activeTarget === "solver-fork-approach" ||
    activeTarget === "solver-fork-files" ||
    activeTarget === "solver-fork-submit";
  const isForking = forkMode || forkTargetActive;
  const modalPrefix = isForking ? "solver-fork" : "solver-proposal";
  const showProposalModal =
    (proposalOpen || proposalTargetActive || forkTargetActive) && !proposalDismissed;
  const tutorialTab: SolverTab | null =
    activeTarget === "solver-blueprint" || activeTarget === "solver-blueprint-tab"
      ? "blueprint"
      : activeTarget?.startsWith("solver-tree") || activeTarget?.startsWith("solver-fork")
        ? "tree"
        : activeTarget === "solver-subtasks" ||
            activeTarget === "solver-subtasks-tab" ||
            activeTarget === "solver-subtask-card" ||
            proposalTargetActive
          ? "subtasks"
          : null;
  const displayTab = tutorialTab ?? tab;
  const treeTargetActive =
    activeTarget === "solver-tree-complete" ||
    activeTarget === "solver-tree-complete-toggle" ||
    activeTarget === "solver-tree-build-upon" ||
    forkTargetActive;
  const displayTreeState: SolverTreeState =
    treeTargetActive
      ? "complete"
      : activeTarget === "solver-tree-empty" || activeTarget === "solver-tree-empty-toggle"
        ? "empty"
        : treeState;
  const rootAttempt = COMPLETED_ATTEMPTS[0];
  const forkNode = COMPLETED_ATTEMPTS.find((attempt) => attempt.id === forkNodeId) ?? rootAttempt;
  const detailNode = COMPLETED_ATTEMPTS.find((attempt) => attempt.id === detailNodeId) ?? null;
  const modalSubtaskTitle = isForking ? forkNode.targetSubtaskTitle : selectedSubtask.title;

  useEffect(() => {
    setTab("subtasks");
    setSelectedSubtaskId(SOLVER_PROBLEM.subtasks[0].id);
    setProposalOpen(false);
    setProposalDismissed(false);
    setProposedApproach("");
    setFiles([]);
    setSubmitted(false);
    setTreeState("empty");
    setForkMode(false);
    setForkNodeId(null);
  }, [flowId]);

  useEffect(() => {
    if (!activeTarget) return;

    setProposalDismissed(false);

    if (
      activeTarget === "solver-proposal-approach" ||
      activeTarget === "solver-proposal-files" ||
      activeTarget === "solver-proposal-submit"
    ) {
      setTab("subtasks");
      setProposalOpen(true);
      return;
    }

    if (
      activeTarget === "solver-fork-approach" ||
      activeTarget === "solver-fork-files" ||
      activeTarget === "solver-fork-submit"
    ) {
      setTab("tree");
      setProposalOpen(true);
      return;
    }

    setProposalOpen(false);

    if (activeTarget === "solver-blueprint" || activeTarget === "solver-blueprint-tab") {
      setTab("blueprint");
      return;
    }

    if (
      activeTarget === "solver-subtasks" ||
      activeTarget === "solver-subtasks-tab" ||
      activeTarget === "solver-subtask-card"
    ) {
      setTab("subtasks");
      return;
    }

    if (activeTarget.startsWith("solver-tree")) {
      setTab("tree");
    }
  }, [activeTarget]);

  const openProposal = (subtaskId: string) => {
    if (!canPropose) return;

    setForkMode(false);
    setForkNodeId(null);
    setSelectedSubtaskId(subtaskId);
    setProposalOpen(true);
    setProposalDismissed(false);
  };

  const openFork = (node: SolverAttempt) => {
    setForkMode(true);
    setForkNodeId(node.id);
    setTab("tree");
    setProposalOpen(true);
    setProposalDismissed(false);
  };

  const renderAttemptCard = (attempt: SolverAttempt, buildUponTour?: string) => (
    <div className="w-[256px] min-w-[256px] max-w-[256px] overflow-hidden rounded-2xl border border-border bg-background p-5 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-tight text-foreground">
            {attempt.solverFirstName} {attempt.solverLastName}
          </p>
          <p className="mt-0.5 truncate text-[11px] font-medium leading-snug text-muted-foreground">
            {attempt.degreeProgram}
          </p>
          <p className="mt-1 truncate text-[10px] font-bold text-muted-foreground/70">
            {attempt.institution}
          </p>
        </div>
        <span className="flex-shrink-0 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
          {attempt.status.replace(/_/g, " ")}
        </span>
      </div>

      {attempt.parentAttemptId && (
        <div className="mb-1 mt-2 flex items-center">
          <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <GitBranch className="h-3 w-3 flex-shrink-0" /> Forked: {attempt.parentSolverName}
          </span>
        </div>
      )}

      <div className="mb-4 mt-3 flex items-center justify-between text-[11px] font-bold text-muted-foreground/70">
        <p className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(attempt.claimedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <button
          className={`flex-1 rounded-lg border border-accent/20 bg-accent/10 py-1.5 text-[11px] font-bold text-accent transition-all hover:bg-accent hover:text-white active:scale-[0.98] ${
            buildUponTour ? highlight(buildUponTour) : ""
          }`}
          data-tour={buildUponTour}
          onClick={() => openFork(attempt)}
          type="button"
        >
          Build Upon ➔
        </button>
        <button
          className="rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-[11px] font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-[0.98]"
          onClick={() => setDetailNodeId(attempt.id)}
          type="button"
        >
          View Details
        </button>
      </div>
    </div>
  );

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles((current) => [...current, ...Array.from(event.target.files!)]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((current) => current.filter((_, index) => index !== indexToRemove));
  };

  const closeProposal = () => {
    setProposalOpen(false);
    setProposalDismissed(true);
  };

  const submitProposal = () => {
    if (!proposedApproach.trim()) return;

    setSubmitted(true);
    closeProposal();
    setProposedApproach("");
    setFiles([]);
  };

  return (
    <section
      className="relative mt-6 overflow-hidden rounded-3xl border border-border bg-background shadow-xl"
      id="tour-stage"
    >
      <div className="border-b border-border bg-background px-5 py-4 shadow-sm md:px-7 md:py-5" data-tour="solver-problem-header">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Solver problem workspace
        </p>

        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <h2 className="text-xl font-bold leading-tight text-foreground md:text-2xl">
            {SOLVER_PROBLEM.title}
          </h2>

          {submitted ? (
            <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-amber-700 md:w-auto">
              <span className="h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-amber-500" />
              Proposal Pending
            </span>
          ) : (
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-2.5 font-bold text-white shadow-md transition-all hover:bg-accent/90 md:w-auto"
              onClick={() => openProposal(SOLVER_PROBLEM.subtasks[0].id)}
              type="button"
            >
              Submit Proposal
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="rounded-md border border-accent/20 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent sm:text-[11px]">
            {SOLVER_PROBLEM.status}
          </span>
          <span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 sm:text-[11px]">
            {SOLVER_PROBLEM.preferredProgram}
          </span>
          <span className="rounded-md border border-border bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
            {SOLVER_PROBLEM.subtasks.length} Sub-tasks
          </span>
          <span className="text-sm font-bold text-muted-foreground">
            {SOLVER_PROBLEM.organizationName}
          </span>
        </div>

        <div className="mt-4 flex w-fit gap-1 overflow-x-auto rounded-xl border border-border bg-muted/40 p-1">
          {TABS.map((item) => (
            <button
              className={`whitespace-nowrap rounded-lg border px-5 py-2 text-sm font-bold transition-all md:px-6 ${
                displayTab === item.id
                  ? "border-border bg-background text-accent shadow-sm"
                  : "border-transparent text-muted-foreground hover:bg-background/70 hover:text-foreground"
              }`}
              data-tour={`solver-${item.id}-tab`}
              key={item.id}
              onClick={() => setTab(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 md:p-7">
        {submitted && (
          <div
            className={`mb-5 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 ${highlight(
              "solver-proposal-pending",
            )}`}
            data-tour="solver-proposal-pending"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>
              Your proposal for {selectedSubtask.title} has been submitted and is awaiting review.
            </span>
          </div>
        )}

        {displayTab === "blueprint" && (
          <div className="flex flex-col items-start gap-6 animate-in fade-in duration-300 lg:flex-row lg:gap-8">
            <div
              className={`w-full flex-1 rounded-2xl border border-border bg-background p-6 shadow-sm md:p-8 ${highlight(
                "solver-blueprint",
              )}`}
              data-tour="solver-blueprint"
            >
              <div className="mb-8 flex items-center gap-3">
                <FileText className="h-6 w-6 text-accent" />
                <h3 className="text-xl font-bold text-foreground">Problem Blueprint</h3>
              </div>

              <div className="space-y-8">
                <section>
                  <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Background Context
                  </h4>
                  <div className="rounded-2xl border border-border bg-muted/40 p-6 text-sm font-medium leading-relaxed text-foreground shadow-sm">
                    {SOLVER_PROBLEM.backgroundContext}
                  </div>
                </section>

                <section>
                  <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Primary Problem Statement
                  </h4>
                  <div className="rounded-2xl border border-border bg-muted/40 p-6 text-sm font-bold leading-relaxed text-foreground shadow-sm">
                    {SOLVER_PROBLEM.primaryStatement}
                  </div>
                </section>

                <section>
                  <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Objectives
                  </h4>
                  <div className="rounded-2xl border border-border bg-muted/40 p-6 text-sm font-medium leading-relaxed text-foreground shadow-sm">
                    <ul className="list-disc space-y-2 pl-5 marker:text-muted-foreground">
                      {SOLVER_PROBLEM.objectives.map((objective) => (
                        <li className="pl-1" key={objective}>
                          {objective}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                <section>
                  <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Constraints & Limitations
                  </h4>
                  <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-6 text-sm font-medium leading-relaxed text-foreground shadow-sm">
                    <ul className="list-disc space-y-2 pl-5 marker:text-muted-foreground">
                      {SOLVER_PROBLEM.constraints.map((constraint) => (
                        <li className="pl-1" key={constraint}>
                          {constraint}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              </div>
            </div>

            <aside className="flex w-full flex-col gap-4 lg:w-80 lg:flex-shrink-0">
              <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent shadow-sm">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Organization Details</h3>
                    <p className="mt-0.5 text-[11px] font-medium leading-snug text-muted-foreground">
                      Contact and identity verification.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 pl-1 text-[10px] font-bold uppercase tracking-wider text-accent">
                      <Building2 className="h-3.5 w-3.5" /> Organization Name
                    </label>
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 shadow-sm">
                      <Building2 className="h-6 w-6 flex-shrink-0 text-muted-foreground" />
                      <span className="truncate text-sm font-bold text-foreground">
                        {SOLVER_PROBLEM.organizationName}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 pl-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <UserCircle className="h-3.5 w-3.5" /> Contact Person
                    </label>
                    <div className="truncate rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm font-bold text-foreground shadow-sm">
                      {SOLVER_PROBLEM.contactPerson}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 pl-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" /> Contact Number
                    </label>
                    <div className="truncate rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm font-medium text-foreground shadow-sm">
                      {SOLVER_PROBLEM.contactNumber}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 pl-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" /> Email Address
                    </label>
                    <div className="truncate rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm font-medium text-foreground shadow-sm">
                      {SOLVER_PROBLEM.seekerEmail}
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {displayTab === "subtasks" && (
          <div
            className={`rounded-2xl border border-border bg-background p-6 shadow-sm md:p-8 ${highlight(
              "solver-subtasks",
            )}`}
            data-tour="solver-subtasks"
          >
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <h3 className="flex items-center gap-3 text-2xl font-bold text-foreground">
                  <span className="rounded-xl border border-accent/20 bg-accent/10 p-2.5 text-accent">
                    <ClipboardList className="h-5 w-5" />
                  </span>
                  AI-Decomposed Sub-problems
                </h3>
                {canPropose ? (
                  <p className="mt-3 text-sm font-medium text-muted-foreground">
                    Pick a sub-problem you want to solve and submit a proposal.
                  </p>
                ) : (
                  <p className="mt-3 flex w-fit items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-600">
                    <Lock className="h-4 w-4" />
                    Proposal submissions are currently locked.
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-5">
              {SOLVER_PROBLEM.subtasks.map((subtask, index) => (
                <div
                  className={`group rounded-2xl border border-border bg-muted/30 p-5 transition-all duration-300 md:p-6 ${
                    canPropose
                      ? "cursor-pointer hover:border-accent/30 hover:bg-background hover:shadow-md active:scale-[0.99]"
                      : "opacity-95"
                  } ${index === 0 ? highlight("solver-subtask-card") : ""}`}
                  data-tour={index === 0 ? "solver-subtask-card" : undefined}
                  key={subtask.id}
                  onClick={() => openProposal(subtask.id)}
                >
                  <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-lg font-bold text-accent shadow-sm transition-colors group-hover:bg-accent group-hover:text-white md:h-14 md:w-14">
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1 space-y-3 pt-0.5">
                        <h4 className="text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-accent">
                          {subtask.title}
                        </h4>

                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-md border border-accent/20 bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                            {subtask.departmentFocus}
                          </span>
                        </div>

                        <p className="max-w-3xl text-sm font-medium leading-relaxed text-muted-foreground">
                          {subtask.description}
                        </p>
                      </div>
                    </div>

                    {canPropose && (
                      <div className="mt-4 w-full flex-shrink-0 lg:mt-0 lg:w-auto">
                        <button
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-accent/90 group-hover:scale-[1.02] group-hover:shadow-md lg:w-auto"
                          onClick={(event) => {
                            event.stopPropagation();
                            openProposal(subtask.id);
                          }}
                          type="button"
                        >
                          Submit Proposal <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {displayTab === "tree" && (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-muted/20 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Tutorial preview
                </p>
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  Switch between an empty tree and a tree with completed solutions.
                </p>
              </div>
              <div className="inline-flex w-fit rounded-full border border-border bg-muted/40 p-1">
                <button
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
                    displayTreeState === "empty"
                      ? "bg-background text-accent shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-tour="solver-tree-empty-toggle"
                  onClick={() => setTreeState("empty")}
                  type="button"
                >
                  No solutions
                </button>
                <button
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
                    displayTreeState === "complete"
                      ? "bg-background text-accent shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-tour="solver-tree-complete-toggle"
                  onClick={() => setTreeState("complete")}
                  type="button"
                >
                  Complete solutions
                </button>
              </div>
            </div>

            {displayTreeState === "empty" ? (
              <div
                className={`rounded-2xl border border-border bg-background p-12 text-center shadow-sm ${highlight(
                  "solver-tree-empty",
                )}`}
                data-tour="solver-tree-empty"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted/50 shadow-sm">
                  <Network className="h-8 w-8 text-muted-foreground/60" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-foreground">No attempts yet</h3>
                <p className="mx-auto mb-6 max-w-sm text-sm font-medium text-muted-foreground">
                  Be the first to claim and solve this problem. Your solution will become the root
                  of this tree.
                </p>
                <button
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 font-bold text-white shadow-md transition-all hover:bg-accent/90 active:scale-[0.98]"
                  onClick={() => {
                    setTab("subtasks");
                    openProposal(SOLVER_PROBLEM.subtasks[0].id);
                  }}
                  type="button"
                >
                  Submit a Proposal <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                className={`rounded-2xl border border-border bg-background p-6 shadow-sm md:p-8 ${highlight(
                  "solver-tree-complete",
                )}`}
                data-tour="solver-tree-complete"
              >
                <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="flex-1">
                    <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground">
                      <span className="rounded-xl border border-border bg-muted/50 p-2 text-muted-foreground">
                        <Network className="h-5 w-5" />
                      </span>
                      Solution Evolution Tree
                    </h2>
                    <p className="mt-2 text-sm font-medium text-muted-foreground">
                      Each node is a solution attempt. Click <strong>View Details</strong> to load
                      the full history, or <strong>Build Upon</strong> to fork a completed solution.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <label
                      className="whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                      htmlFor="solver-tree-filter"
                    >
                      Filter Tree:
                    </label>
                    <select
                      className="block w-full cursor-pointer appearance-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground shadow-sm outline-none transition-colors hover:border-accent/50 focus:border-accent focus:ring-2 focus:ring-accent/20 md:w-auto"
                      defaultValue="ALL"
                      id="solver-tree-filter"
                    >
                      <option value="ALL">All Sub-problems</option>
                      <option value="route-optimization">Route optimization</option>
                    </select>
                  </div>
                </div>

                <div
                  className="min-h-[480px] overflow-auto rounded-2xl border border-border bg-muted/30 shadow-inner"
                  style={{
                    backgroundImage:
                      "radial-gradient(var(--border) 1.5px, transparent 1.5px)",
                    backgroundSize: "24px 24px",
                  }}
                >
                  <div className="flex min-w-max flex-col items-center px-10 py-12">
                    {renderAttemptCard(rootAttempt, "solver-tree-build-upon")}
                    <div className="h-10 w-0.5 bg-border" />
                    <div className="relative flex gap-16 pt-10">
                      <div className="absolute left-[128px] right-[128px] top-0 h-0.5 bg-border" />
                      {COMPLETED_ATTEMPTS.filter((attempt) => attempt.parentAttemptId).map(
                        (attempt) => (
                          <div className="relative flex flex-col items-center" key={attempt.id}>
                            <div className="absolute -top-10 h-10 w-0.5 bg-border" />
                            {renderAttemptCard(attempt)}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {displayTab === "history" && (
          <div className="rounded-2xl border border-border bg-background p-6 shadow-sm md:p-8">
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <div className="rounded-full border border-border bg-muted/50 p-4">
                <History className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 mt-4 text-xl font-bold text-foreground">No activity yet</h3>
              <p className="max-w-sm text-sm font-medium text-muted-foreground">
                Problem and submission events will be recorded here.
              </p>
            </div>
          </div>
        )}
      </div>

      {showProposalModal && (
        <div
          className="fixed inset-0 z-[59] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-6"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeProposal();
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border border-border bg-background shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-shrink-0 items-center justify-between border-b border-border p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-accent/20 to-secondary/20">
                  <Pencil className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Submit Solution Proposal</h3>
                  <p className="text-sm text-muted-foreground">
                    The Seeker will review your approach before generating a workspace.
                  </p>
                </div>
              </div>
              <button
                className="text-muted-foreground transition-colors hover:text-foreground"
                onClick={closeProposal}
                type="button"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isForking && (
                <div className="mb-6 flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/10 px-4 py-3 font-medium text-accent">
                  <GitBranch className="h-5 w-5 flex-shrink-0" />
                  You are proposing to fork and build upon{" "}
                  <strong>
                    {forkNode.solverFirstName} {forkNode.solverLastName}
                  </strong>
                  &apos;s completed solution.
                </div>
              )}

              <div className="mb-6 rounded-lg border border-accent/20 bg-accent/10 px-4 py-3 font-medium text-accent">
                You are proposing for: <strong>{modalSubtaskTitle}</strong>
              </div>

              <form
                className="space-y-6"
                id="solver-proposal-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitProposal();
                }}
              >
                <div
                  className={`rounded-lg ${highlight(`${modalPrefix}-approach`)}`}
                  data-tour={`${modalPrefix}-approach`}
                >
                  <label className="mb-2 block text-sm font-bold text-foreground">
                    Proposed Approach <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    className="w-full resize-y rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-secondary"
                    onChange={(event) => setProposedApproach(event.target.value)}
                    placeholder="Describe how you plan to approach this sub-problem..."
                    required
                    rows={8}
                    value={proposedApproach}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-foreground">
                    Supporting Documents{" "}
                    <span className="font-normal text-muted-foreground">(Optional)</span>
                  </label>
                  <div
                    className={`group cursor-pointer rounded-lg border-2 border-dashed border-input p-6 text-center transition-colors hover:border-accent/50 hover:bg-muted/30 ${highlight(
                      `${modalPrefix}-files`,
                    )}`}
                    data-tour={`${modalPrefix}-files`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      className="hidden"
                      multiple
                      onChange={handleFileSelect}
                      ref={fileInputRef}
                      type="file"
                    />
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground transition-colors group-hover:text-secondary" />
                    <p className="mt-2 text-sm font-medium text-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      PDF, DOCX, JPG, PNG up to 10MB
                    </p>
                  </div>

                  {files.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {files.map((file, index) => (
                        <li
                          className="flex items-center justify-between rounded-lg border border-border bg-background p-3 text-sm shadow-sm"
                          key={`${file.name}-${index}`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <FileText className="h-5 w-5 flex-shrink-0 text-secondary" />
                            <span className="truncate font-medium text-secondary">{file.name}</span>
                            <span className="flex-shrink-0 text-xs text-muted-foreground">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <button
                            className="flex-shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-500"
                            onClick={(event) => {
                              event.stopPropagation();
                              removeFile(index);
                            }}
                            type="button"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </form>
            </div>

            <div className="flex flex-shrink-0 justify-end gap-3 rounded-b-xl border-t border-border bg-muted/40 p-6">
              <button
                className="rounded-lg border border-input bg-background px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                onClick={closeProposal}
                type="button"
              >
                Cancel
              </button>
              <button
                className={`flex min-w-[160px] items-center justify-center gap-2 rounded-lg bg-secondary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60 ${highlight(
                  `${modalPrefix}-submit`,
                )}`}
                data-tour={`${modalPrefix}-submit`}
                disabled={!proposedApproach.trim()}
                form="solver-proposal-form"
                type="submit"
              >
                Submit Proposal
              </button>
            </div>
          </div>
        </div>
      )}

      {detailNode && (
        <div
          className="fixed inset-0 z-[58] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setDetailNodeId(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-background shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border bg-gradient-to-br from-accent/10 via-background to-background p-6">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-primary-foreground text-lg font-bold text-white shadow-md">
                  {detailNode.solverFirstName.charAt(0)}
                  {detailNode.solverLastName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-xl font-bold text-foreground">
                      {detailNode.solverFirstName} {detailNode.solverLastName}
                    </h3>
                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      {detailNode.status.replace(/_/g, " ")}
                    </span>
                    {detailNode.parentAttemptId && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <GitBranch className="h-3 w-3" /> Forked
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm font-medium text-muted-foreground">
                    {detailNode.degreeProgram} · {detailNode.institution}
                  </p>
                  <p className="mt-1 text-xs font-bold text-muted-foreground/70">
                    Claimed{" "}
                    {new Date(detailNode.claimedAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <button
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setDetailNodeId(null)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[50vh] space-y-6 overflow-y-auto p-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Sub-problem
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {detailNode.targetSubtaskTitle}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Approach
                </p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-foreground">
                  {detailNode.description}
                </p>
              </div>

              {detailNode.deltaDescription && (
                <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
                  <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-accent">
                    <GitBranch className="h-3.5 w-3.5" /> What changed from{" "}
                    {detailNode.parentSolverName}
                  </p>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-foreground">
                    {detailNode.deltaDescription}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border bg-muted/40 p-6 sm:flex-row sm:justify-end">
              <button
                className="rounded-lg border border-input bg-background px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                onClick={() => setDetailNodeId(null)}
                type="button"
              >
                Close
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-secondary"
                onClick={() => {
                  setDetailNodeId(null);
                  openFork(detailNode);
                }}
                type="button"
              >
                <GitBranch className="h-4 w-4" /> Build Upon This Solution
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
