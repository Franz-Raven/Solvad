"use client";

import type { ChangeEvent } from "react";
import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  GitBranch,
  Play,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";

import ProblemFormFields from "@/app/(authed)/seeker/submit-problem/components/ProblemFormFields";
import { Button } from "@/components/ui/button";
import SolverStage from "./solver-stage";
import WorkspaceStage from "./workspace-stage";
import {
  FLOWS,
  SOLVER_FLOWS,
  groupForFlow,
  type TutorialGroup,
} from "@/lib/tutorial/flows";
import { currentTutorialTarget, tutorial } from "@/lib/tutorial/tutorial";

type DemoTab = "problem" | "proposals" | "workspace" | "review" | "insights";
type ProposalStatus = "pending" | "approved" | "rejected";
type WorkspaceStatus = "Drafting" | "Completed" | "Terminated";
type SolutionStatus = "pending" | "approved" | "rejected";
type Notice = { tone: "success" | "error"; title: string; message: string };

type Proposal = {
  id: string;
  name: string;
  initials: string;
  institution: string;
  subtask: string;
  approach: string;
  status: ProposalStatus;
  decisionReason?: string;
};

type Workspace = {
  id: string;
  proposalId?: string;
  name: string;
  initials: string;
  institution: string;
  subtask: string;
  status: WorkspaceStatus;
  claimed: string;
  forked?: boolean;
  terminationReason?: string;
};

type ProblemStage = "editing" | "scope" | "published";

const FLOW_LABELS: Record<string, string> = {
  "post-problem": "Post a problem",
  "pending-proposals": "Review proposals",
  "active-workspaces": "Manage workspaces",
  "pending-solutions": "Review solutions",
  "ai-insights": "AI insights",
  "solver-submit-proposal": "Submit a proposal",
  "solver-solution-tree": "Solution tree",
  "solver-active-workspace": "Active workspace",
};

const FLOW_TABS: Record<string, DemoTab> = {
  "post-problem": "problem",
  "pending-proposals": "proposals",
  "active-workspaces": "workspace",
  "pending-solutions": "review",
  "ai-insights": "insights",
};

const SEEKER_FLOW_IDS = Object.keys(FLOWS);
const SOLVER_FLOW_IDS = Object.keys(SOLVER_FLOWS);

const TABS: { id: DemoTab; label: string }[] = [
  { id: "problem", label: "Problem Profile" },
  { id: "proposals", label: "Pending Proposals" },
  { id: "workspace", label: "Active Workspaces" },
  { id: "review", label: "Pending Solutions" },
  { id: "insights", label: "AI Insights" },
];

const INITIAL_FORM = {
  title: "Optimizing campus shuttle routes",
  backgroundContext:
    "Our campus shuttle runs fixed routes, but riders wait more than 20 minutes during peak hours.",
  primaryStatement:
    "Students cannot reliably reach classes on time because shuttle arrival times are unpredictable.",
  objectives:
    "Reduce average peak-hour wait time to under 10 minutes and publish live arrival estimates.",
  constraints:
    "Must launch within one semester, use existing vehicles, and avoid new hardware purchases.",
  preferredProgram: "Information Technology",
};

const INITIAL_PROPOSALS: Proposal[] = [
  {
    id: "maya",
    name: "Maya Chen",
    initials: "MC",
    institution: "De La Salle University",
    subtask: "Route optimization",
    approach:
      "Build a lightweight arrival model from existing GPS pings, then publish predicted wait times to the student app. I will validate the model against two weeks of historical shuttle data.",
    status: "pending",
  },
  {
    id: "joseph",
    name: "Joseph Kariuki",
    initials: "JK",
    institution: "University of Nairobi",
    subtask: "Rider experience",
    approach:
      "Redesign the rider-facing app with live map tracking and proactive delay notifications, backed by the same GPS feed the operations team already uses.",
    status: "pending",
  },
];

const WORKSPACE_SUBTASKS = ["Route optimization", "Rider experience"];

const INITIAL_WORKSPACES: Workspace[] = [
  {
    id: "ws-maya",
    name: "Maya Chen",
    initials: "MC",
    institution: "De La Salle University",
    subtask: "Route optimization",
    status: "Drafting",
    claimed: "3 days ago",
    forked: true,
  },
];

function scrollStage() {
  if (typeof window === "undefined") return;

  window.setTimeout(() => {
    document.getElementById("tour-stage")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 0);
}

function statusBadge(status: ProposalStatus | SolutionStatus) {
  if (status === "approved") return "border-accent/20 bg-accent/10 text-accent";
  if (status === "rejected") return "border-destructive/20 bg-destructive/10 text-destructive";
  return "border-amber-500/20 bg-amber-500/10 text-amber-700";
}

function statusLabel(status: ProposalStatus | SolutionStatus) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

export default function PublicTutorialPage() {
  const snap = useSyncExternalStore(tutorial.subscribe, tutorial.getSnapshot, tutorial.getSnapshot);
  const [activeTab, setActiveTab] = useState<DemoTab>("problem");
  const [localMode, setLocalMode] = useState<TutorialGroup>("seeker");
  const [notice, setNotice] = useState<Notice | null>(null);

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState(false);
  const [problemStage, setProblemStage] = useState<ProblemStage>("editing");
  const [subtasks, setSubtasks] = useState([
    "Build a real-time GPS arrival prediction model",
    "Publish live ETAs in the student mobile app",
    "Validate predictions against two weeks of historical rides",
  ]);

  const [proposals, setProposals] = useState<Proposal[]>(INITIAL_PROPOSALS);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [proposalRejecting, setProposalRejecting] = useState(false);
  const [proposalRejectionReason, setProposalRejectionReason] = useState("");

  const [workspaces, setWorkspaces] = useState<Workspace[]>(INITIAL_WORKSPACES);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);
  const [terminationReason, setTerminationReason] = useState("");
  const [workspaceFilter, setWorkspaceFilter] = useState("ALL");
  const [workspaceLimits, setWorkspaceLimits] = useState<Record<string, number>>({
    "Route optimization": 3,
    "Rider experience": 3,
  });
  const [collapsedWorkspaceGroups, setCollapsedWorkspaceGroups] = useState<Set<string>>(new Set());

  const [solutionStatus, setSolutionStatus] = useState<SolutionStatus>("pending");
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [solutionRejecting, setSolutionRejecting] = useState(false);
  const [solutionRejectionReason, setSolutionRejectionReason] = useState("");
  const [solutionDecisionReason, setSolutionDecisionReason] = useState("");

  const [insightsMode, setInsightsMode] = useState<"duplicate" | "unique">("duplicate");
  const [gapOpen, setGapOpen] = useState(false);

  const activeTarget = currentTutorialTarget();
  const mode: TutorialGroup = snap.active ? snap.group : localMode;
  const modeFlowIds = mode === "seeker" ? SEEKER_FLOW_IDS : SOLVER_FLOW_IDS;
  const displayTab =
    snap.active && snap.flowId && snap.group === "seeker"
      ? FLOW_TABS[snap.flowId] ?? activeTab
      : activeTab;
  const showUniqueInsight =
    insightsMode === "unique" || activeTarget === "insights-unique-toggle";

  const highlight = (target: string) =>
    activeTarget === target
      ? "ring-2 ring-secondary ring-offset-2 ring-offset-background"
      : "";

  const formTargets = [
    "problem-title",
    "problem-background",
    "problem-primary",
    "problem-objectives",
    "problem-constraints",
    "problem-program",
  ];
  const formHighlight = formTargets.includes(activeTarget ?? "");

  const goToFlow = (id: string) => {
    const group = groupForFlow(id);

    setLocalMode(group);
    if (group === "seeker" && FLOW_TABS[id]) setActiveTab(FLOW_TABS[id]);
    scrollStage();
    tutorial.start(id);
  };

  const selectMode = (next: TutorialGroup) => {
    if (snap.active) tutorial.stop();

    setLocalMode(next);
    if (next === "seeker") setActiveTab("problem");
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("tour") ?? params.get("flow");

    if (requested && (FLOWS[requested] || SOLVER_FLOWS[requested])) {
      const group = groupForFlow(requested);
      const timer = window.setTimeout(() => setLocalMode(group), 0);

      return () => {
        window.clearTimeout(timer);
        tutorial.stop();
      };
    }

    return () => tutorial.stop();
  }, []);

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormError(false);
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const analyzeProblem = () => {
    const required = [
      formData.title,
      formData.backgroundContext,
      formData.primaryStatement,
      formData.objectives,
      formData.constraints,
      formData.preferredProgram,
    ];

    if (required.some((value) => !value.trim())) {
      setFormError(true);
      setNotice({
        tone: "error",
        title: "Missing required fields",
        message: "Fill in every field before running the AI analysis.",
      });
      return;
    }

    setFormError(false);
    setProblemStage("scope");
    setNotice({
      tone: "success",
      title: "Scope generated",
      message: "AI split the problem into three editable sub-tasks. Confirm them to publish.",
    });
  };

  const publishProblem = () => {
    setProblemStage("published");
    setNotice({
      tone: "success",
      title: "Problem Published Successfully!",
      message: "Your problem has been published and is now available for students to work on.",
    });
  };

  const approveProposal = (id: string) => {
    const proposal = proposals.find((item) => item.id === id);

    if (!proposal) return;

    setProposals((current) =>
      current.map((item) => (item.id === id ? { ...item, status: "approved" } : item)),
    );
    setWorkspaces((current) =>
      current.some((workspace) => workspace.proposalId === id)
        ? current
        : [
            ...current,
            {
              id: `ws-${id}`,
              proposalId: id,
              name: proposal.name,
              initials: proposal.initials,
              institution: proposal.institution,
              subtask: proposal.subtask,
              status: "Drafting",
              claimed: "Just now",
            },
          ],
    );
    setSelectedProposalId(null);
    setProposalRejecting(false);
    setProposalRejectionReason("");
    setNotice({
      tone: "success",
      title: "Proposal approved and workspace created!",
      message: `A workspace was created for ${proposal.name}.`,
    });
  };

  const rejectProposal = (id: string) => {
    const reason = proposalRejectionReason.trim();

    if (!reason) return;

    setProposals((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: "rejected", decisionReason: reason } : item,
      ),
    );
    setSelectedProposalId(null);
    setProposalRejecting(false);
    setProposalRejectionReason("");
    setNotice({
      tone: "success",
      title: "Proposal rejected successfully.",
      message: "The solver was notified and the request was closed.",
    });
  };

  const terminateWorkspace = (id: string) => {
    const reason = terminationReason.trim();

    if (!reason) return;

    setWorkspaces((current) =>
      current.map((workspace) =>
        workspace.id === id
          ? { ...workspace, status: "Terminated", terminationReason: reason }
          : workspace,
      ),
    );
    const workspace = workspaces.find((item) => item.id === id);
    setTerminatingId(null);
    setTerminationReason("");
    setNotice({
      tone: "success",
      title: "Success!",
      message: `Solver ${workspace?.name ?? "the solver"} has been terminated.`,
    });
  };

  const approveSolution = () => {
    setSolutionStatus("approved");
    setSolutionDecisionReason("");
    setSolutionRejecting(false);
    setWorkspaces((current) =>
      current.map((workspace) =>
        workspace.id === "ws-maya" ? { ...workspace, status: "Completed" } : workspace,
      ),
    );
    setNotice({
      tone: "success",
      title: "Solution approved! Merit awarded to solver.",
      message: "The workspace is marked completed.",
    });
  };

  const rejectSolution = () => {
    const reason = solutionRejectionReason.trim();

    if (!reason) return;

    setSolutionStatus("rejected");
    setSolutionDecisionReason(reason);
    setSolutionRejecting(false);
    setSolutionRejectionReason("");
    setWorkspaces((current) =>
      current.map((workspace) =>
        workspace.id === "ws-maya"
          ? { ...workspace, status: "Terminated", terminationReason: reason }
          : workspace,
      ),
    );
    setNotice({
      tone: "success",
      title: "Solution rejected. Workspace has been terminated and feedback sent.",
      message: "The solver can review your feedback.",
    });
  };

  const pendingProposals = proposals.filter((proposal) => proposal.status === "pending");
  const activeWorkspaces = workspaces.filter(
    (workspace) => workspace.status !== "Terminated" && workspace.status !== "Completed",
  );
  const routeProposalCount = pendingProposals.filter(
    (proposal) => proposal.subtask === "Route optimization",
  ).length;
  const riderProposalCount = pendingProposals.filter(
    (proposal) => proposal.subtask === "Rider experience",
  ).length;

  const workspaceGroups = WORKSPACE_SUBTASKS.map((subtask) => ({
    subtask,
    active: activeWorkspaces.filter((workspace) => workspace.subtask === subtask),
    limit: workspaceLimits[subtask] ?? 3,
  }));
  const visibleWorkspaceGroups = workspaceGroups.filter((group) =>
    workspaceFilter === "ALL" ? group.active.length > 0 : group.subtask === workspaceFilter,
  );
  const filteredActiveWorkspaceCount = visibleWorkspaceGroups.reduce(
    (total, group) => total + group.active.length,
    0,
  );

  const toggleWorkspaceGroup = (subtask: string) => {
    setCollapsedWorkspaceGroups((current) => {
      const next = new Set(current);

      if (next.has(subtask)) next.delete(subtask);
      else next.add(subtask);

      return next;
    });
  };

  const adjustWorkspaceLimit = (subtask: string, delta: number) => {
    setWorkspaceLimits((current) => ({
      ...current,
      [subtask]: Math.max(1, (current[subtask] ?? 3) + delta),
    }));
  };

  const saveWorkspaceLimit = (subtask: string) => {
    const limit = workspaceLimits[subtask] ?? 3;

    setNotice({
      tone: "success",
      title: "Sub-problem capacity updated successfully!",
      message: `${subtask} now allows ${limit} active solver${limit === 1 ? "" : "s"}.`,
    });
  };

  const showLocateUnavailable = () => {
    setNotice({
      tone: "success",
      title: "Solution tree not included",
      message: "The full workspace opens this attempt in the solution tree.",
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-accent/10 via-background to-accent/5 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary-foreground"
          href="/landing"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to landing
        </Link>

        <header className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">
              {mode === "seeker" ? "Seeker walkthrough" : "Solver walkthrough"}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-foreground md:text-4xl">
              See how Solvad works
            </h1>
            <div className="mt-4 inline-flex rounded-xl border border-border bg-muted/40 p-1">
              <button
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  mode === "seeker"
                    ? "bg-background text-accent shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => selectMode("seeker")}
                type="button"
              >
                Seeker walkthrough
              </button>
              <button
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  mode === "solver"
                    ? "bg-background text-accent shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => selectMode("solver")}
                type="button"
              >
                Solver walkthrough
              </button>
            </div>
          </div>

        </header>

        <section className="mt-6 rounded-3xl border border-border bg-background p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">
                {mode === "seeker" ? "Seeker tutorials" : "Solver tutorials"}
              </p>
              <h2 className="mt-1 text-xl font-bold text-foreground md:text-2xl">
                Choose a process to explore
              </h2>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                Click on a button to start the tutorial for each process.
              </p>
            </div>
            <span className="w-fit rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent">
              {modeFlowIds.length} tutorial{modeFlowIds.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {modeFlowIds.map((id) => {
              const isActive = snap.active && id === snap.flowId;

              return (
                <button
                  className={`group flex items-center justify-between gap-4 rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.99] ${
                    isActive
                      ? "border-accent bg-accent/10 shadow-md"
                      : "border-border bg-muted/20 hover:border-accent/60 hover:bg-accent/5 hover:shadow-md"
                  }`}
                  key={id}
                  onClick={() => goToFlow(id)}
                  type="button"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-foreground">
                      {FLOW_LABELS[id] ?? id}
                    </span>
                    <span
                      className={`mt-1 block text-[10px] font-bold uppercase tracking-wider ${
                        isActive ? "text-accent" : "text-muted-foreground group-hover:text-accent"
                      }`}
                    >
                      {isActive ? "Tutorial in progress" : "Start tutorial"}
                    </span>
                  </span>
                  <span
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border transition-colors ${
                      isActive
                        ? "border-accent bg-accent text-white"
                        : "border-accent/20 bg-background text-accent group-hover:border-accent group-hover:bg-accent group-hover:text-white"
                    }`}
                  >
                    <Play className="h-4 w-4 fill-current" />
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {mode === "seeker" ? (
          <section
            className="mt-6 overflow-hidden rounded-3xl border border-border bg-background shadow-xl"
            id="tour-stage"
          >
          <div className="border-b border-border bg-muted/30 px-5 py-4 md:px-7">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Seeker problem workspace
                </p>
                <h2 className="mt-1 text-xl font-bold text-foreground md:text-2xl">
                  Optimizing campus shuttle routes
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                  <span className="rounded-md border border-accent/20 bg-accent/10 px-2.5 py-1 text-accent">
                    OPEN
                  </span>
                  <span className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700">
                    Information Technology
                  </span>
                  <span className="rounded-md border border-border bg-muted px-2.5 py-1 text-muted-foreground">
                    3 Sub-tasks
                  </span>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Change Status
              </Button>
            </div>

            <nav className="mt-4 flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/40 p-1">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  data-tour={`tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-bold transition-all ${highlight(
                    `tab-${item.id}`,
                  )} ${
                    displayTab === item.id
                      ? "border-border bg-background text-accent shadow-sm"
                      : "border-transparent text-muted-foreground hover:bg-background/70 hover:text-foreground"
                  }`}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-5 md:p-7">
            {notice && (
              <div
                className={`mb-5 flex items-start justify-between gap-3 rounded-2xl border p-4 ${
                  notice.tone === "success"
                    ? "border-accent/30 bg-accent/10"
                    : "border-destructive/30 bg-destructive/10"
                }`}
                role="status"
              >
                <div className="flex gap-3">
                  {notice.tone === "success" ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                  )}
                  <div>
                    <p className="text-sm font-bold text-foreground">{notice.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                      {notice.message}
                    </p>
                  </div>
                </div>
                <button
                  aria-label="Dismiss message"
                  className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                  onClick={() => setNotice(null)}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {displayTab === "problem" && (
              <form
                className="space-y-6"
                data-tour="problem-form"
                onSubmit={(event) => event.preventDefault()}
              >
                <div
                  className={`rounded-2xl border border-border bg-background p-5 md:p-6 ${
                    formHighlight ? "ring-2 ring-secondary ring-offset-2 ring-offset-background" : ""
                  }`}
                >
                  <ProblemFormFields
                    formData={formData}
                    validationErrors={
                      formError
                        ? {
                            title: true,
                            backgroundContext: true,
                            primaryStatement: true,
                            objectives: true,
                            constraints: true,
                          }
                        : {}
                    }
                    onInputChange={handleInputChange}
                    onProgramChange={(value) => {
                      setFormError(false);
                      setFormData((current) => ({ ...current, preferredProgram: value }));
                    }}
                  />
                </div>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button
                    onClick={() => {
                      setFormData(INITIAL_FORM);
                      setFormError(false);
                      setProblemStage("editing");
                      setNotice(null);
                    }}
                    type="button"
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    className={highlight("problem-analyze")}
                    data-tour="problem-analyze"
                    onClick={analyzeProblem}
                    type="button"
                  >
                    <Sparkles className="h-4 w-4" />
                    Analyze & Generate Scope
                  </Button>
                </div>

                {problemStage !== "editing" && (
                  <div className="rounded-2xl border border-border bg-muted/20 p-5 md:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-foreground">AI-generated scope</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Edit the sub-tasks before publishing.
                        </p>
                      </div>
                      <span className="rounded-md border border-secondary/20 bg-secondary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary">
                        {subtasks.length} sub-tasks
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      {subtasks.map((task, index) => (
                        <div className="flex items-center gap-3" key={index}>
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-xs font-bold text-muted-foreground">
                            {index + 1}
                          </span>
                          <input
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-secondary"
                            onChange={(event) =>
                              setSubtasks((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index ? event.target.value : item,
                                ),
                              )
                            }
                            value={task}
                          />
                        </div>
                      ))}
                    </div>

                    {problemStage === "scope" ? (
                      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button
                          onClick={() => setProblemStage("editing")}
                          type="button"
                          variant="outline"
                        >
                          Back
                        </Button>
                        <Button onClick={publishProblem} type="button">
                          Confirm & Publish
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border border-accent/30 bg-accent/10 p-4">
                        <p className="text-sm font-bold text-foreground">
                          Problem Published Successfully!
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          Your problem has been published and is now available for students to work
                          on.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            onClick={() => goToFlow("pending-proposals")}
                            size="sm"
                            type="button"
                          >
                            Go to Pending Proposals
                          </Button>
                          <Button
                            onClick={() => goToFlow("ai-insights")}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            Go to AI Insights
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </form>
            )}

            {displayTab === "proposals" && (
              <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
                <aside
                  className={`space-y-2 rounded-2xl ${highlight("proposals-list")}`}
                  data-tour="proposals-list"
                >
                  <h3 className="mb-4 ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Filter by Sub-problem
                  </h3>
                  <button
                    className="flex w-full items-center justify-between rounded-xl border border-accent bg-accent p-4 text-left text-white shadow-md"
                    type="button"
                  >
                    <span className="text-sm font-bold">All Pending Requests</span>
                    <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                      {pendingProposals.length}
                    </span>
                  </button>
                  <button
                    className="flex w-full flex-col rounded-xl border border-border bg-background p-4 text-left shadow-sm"
                    type="button"
                  >
                    <span className="text-sm font-bold text-foreground">Route optimization</span>
                    <span className="mt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-amber-700">{routeProposalCount} Pending</span>
                      <span className="text-muted-foreground">1 / 3 Active</span>
                    </span>
                  </button>
                  <button
                    className="flex w-full flex-col rounded-xl border border-border bg-background p-4 text-left shadow-sm"
                    type="button"
                  >
                    <span className="text-sm font-bold text-foreground">Rider experience</span>
                    <span className="mt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-amber-700">{riderProposalCount} Pending</span>
                      <span className="text-muted-foreground">0 / 3 Active</span>
                    </span>
                  </button>
                </aside>

                <div className="space-y-4">
                  {proposals.map((proposal) => {
                    const isSelected = selectedProposalId === proposal.id;

                    return (
                      <div
                        className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm"
                        key={proposal.id}
                      >
                        <div className="flex items-center justify-between border-b border-border bg-muted/30 p-4">
                          <h3 className="text-sm font-bold text-foreground">
                            {proposal.subtask}
                          </h3>
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadge(
                              proposal.status,
                            )}`}
                          >
                            {statusLabel(proposal.status)}
                          </span>
                        </div>
                        <div className="divide-y divide-border">
                          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-sm font-bold text-accent">
                                {proposal.initials}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-foreground">
                                  {proposal.name}
                                </p>
                                <p className="text-[10px] font-medium text-muted-foreground">
                                  {proposal.institution}
                                </p>
                                <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                                  Submitted 2 hours ago
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {proposal.status === "pending" ? (
                                <Button
                                  onClick={() =>
                                    setSelectedProposalId(isSelected ? null : proposal.id)
                                  }
                                  size="sm"
                                  variant="outline"
                                >
                                  {isSelected ? "Close" : "Review"}
                                </Button>
                              ) : (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  {proposal.status === "approved"
                                    ? "Workspace created"
                                    : "Request closed"}
                                </span>
                              )}
                            </div>
                          </div>

                          {isSelected && proposal.status === "pending" && (
                            <div className="space-y-4 bg-muted/10 p-4">
                              <div>
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Full proposed approach
                                </h4>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                  {proposal.approach}
                                </p>
                              </div>

                              {!proposalRejecting ? (
                                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                  <Button
                                    className={highlight("proposal-reject")}
                                    data-tour="proposal-reject"
                                    onClick={() => {
                                      setProposalRejecting(true);
                                      setProposalRejectionReason("");
                                    }}
                                    size="sm"
                                    variant="destructive"
                                  >
                                    Reject Proposal
                                  </Button>
                                  <Button
                                    className={highlight("proposal-approve")}
                                    data-tour="proposal-approve"
                                    onClick={() => approveProposal(proposal.id)}
                                    size="sm"
                                  >
                                    Approve & Create Workspace
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-2 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-foreground">
                                      Reason for Rejection
                                    </label>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">
                                      Required
                                    </span>
                                  </div>
                                  <textarea
                                    className="min-h-20 w-full resize-none rounded-lg border border-border bg-background p-3 text-sm text-foreground focus:border-destructive focus:outline-none focus:ring-2 focus:ring-destructive/20"
                                    onChange={(event) =>
                                      setProposalRejectionReason(event.target.value)
                                    }
                                    placeholder="Explain what is missing so the solver can improve and resubmit..."
                                    value={proposalRejectionReason}
                                  />
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      onClick={() => {
                                        setProposalRejecting(false);
                                        setProposalRejectionReason("");
                                      }}
                                      size="sm"
                                      variant="outline"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      disabled={!proposalRejectionReason.trim()}
                                      onClick={() => rejectProposal(proposal.id)}
                                      size="sm"
                                      variant="destructive"
                                    >
                                      Confirm Reject
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {proposal.status === "rejected" && proposal.decisionReason && (
                            <div className="bg-destructive/5 p-4">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-destructive">
                                Rejection reason
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {proposal.decisionReason}
                              </p>
                            </div>
                          )}

                          {proposal.status === "approved" && (
                            <div className="bg-accent/5 p-4">
                              <Button
                                onClick={() => goToFlow("active-workspaces")}
                                size="sm"
                                variant="outline"
                              >
                                Open active workspaces
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {proposals.every((proposal) => proposal.status !== "pending") && (
                    <div className="rounded-2xl border border-border bg-muted/20 p-6 text-center">
                      <p className="text-sm font-bold text-foreground">No pending requests</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Every proposal has been approved or rejected.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {displayTab === "workspace" && (
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                <aside className="w-full space-y-2 lg:w-[280px] lg:shrink-0">
                  <h3 className="mb-4 ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Filter by Sub-problem
                  </h3>
                  <button
                    className={`flex w-full items-center justify-between rounded-xl border p-4 text-left shadow-sm transition-all ${
                      workspaceFilter === "ALL"
                        ? "border-accent bg-accent text-white shadow-md"
                        : "border-border bg-background text-foreground hover:border-accent"
                    }`}
                    onClick={() => setWorkspaceFilter("ALL")}
                    type="button"
                  >
                    <span className="text-sm font-bold">All Active Workspaces</span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        workspaceFilter === "ALL"
                          ? "bg-white/20 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {activeWorkspaces.length}
                    </span>
                  </button>

                  {workspaceGroups.map((group) => {
                    const isSelected = workspaceFilter === group.subtask;
                    const activeCount = group.active.length;
                    const isFull = activeCount >= group.limit;

                    return (
                      <button
                        className={`flex w-full flex-col rounded-xl border p-4 text-left shadow-sm transition-all ${
                          isSelected
                            ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                            : "border-border bg-background hover:border-accent/40"
                        }`}
                        key={group.subtask}
                        onClick={() => setWorkspaceFilter(group.subtask)}
                        type="button"
                      >
                        <div className="mb-2 flex w-full items-start justify-between gap-2">
                          <span
                            className={`flex-1 text-sm font-bold leading-snug ${
                              isSelected ? "text-accent" : "text-foreground"
                            }`}
                          >
                            {group.subtask}
                          </span>
                          {activeCount > 0 && (
                            <span className="shrink-0 rounded-md border border-accent/20 bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
                              {activeCount} Active
                            </span>
                          )}
                        </div>
                        <div className="flex w-full items-center gap-1.5">
                          <div
                            className={`h-1.5 flex-1 overflow-hidden rounded-full ${
                              isSelected ? "bg-accent/20" : "bg-muted"
                            }`}
                          >
                            <div
                              className={`h-full rounded-full ${
                                isFull ? "bg-destructive" : "bg-accent"
                              }`}
                              style={{
                                width: `${Math.min((activeCount / group.limit) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <span
                            className={`shrink-0 text-[10px] font-bold tracking-wider ${
                              isFull
                                ? "text-destructive"
                                : isSelected
                                  ? "text-accent"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {isFull ? "CAPACITY FULL" : `${activeCount} / ${group.limit} LIMIT`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </aside>

                <div className="flex w-full min-w-0 flex-1 flex-col" data-tour="workspaces-list">
                  <div className="mb-4 ml-1 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {workspaceFilter === "ALL" ? "Showing All Workspaces" : "Filtered Workspaces"} (
                      {filteredActiveWorkspaceCount})
                    </h3>
                  </div>

                  {visibleWorkspaceGroups.length === 0 || filteredActiveWorkspaceCount === 0 ? (
                    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/10 p-12 text-center">
                      <p className="text-lg font-bold text-foreground">No Active Solvers</p>
                      <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
                        There are currently no solvers actively working on this sub-problem.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {visibleWorkspaceGroups.map((group) => {
                        const isCollapsed = collapsedWorkspaceGroups.has(group.subtask);
                        const activeCount = group.active.length;
                        const isFull = activeCount >= group.limit;

                        return (
                          <div
                            className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm"
                            key={group.subtask}
                          >
                            <button
                              className="flex w-full items-center justify-between border-b border-border bg-muted/30 p-4 text-left"
                              onClick={() => toggleWorkspaceGroup(group.subtask)}
                              type="button"
                            >
                              <h3 className="text-sm font-bold text-foreground">{group.subtask}</h3>
                              <ChevronDown
                                className={`h-5 w-5 text-muted-foreground transition-transform ${
                                  isCollapsed ? "" : "rotate-180"
                                }`}
                              />
                            </button>

                            {!isCollapsed && (
                              <div className="flex flex-col">
                                <div className="flex flex-col justify-between gap-4 border-b border-border bg-muted/20 p-4 sm:flex-row sm:items-center">
                                  <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                      Sub-problem Capacity
                                    </h4>
                                    {activeCount > 0 && group.limit === activeCount && (
                                      <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-amber-600">
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        Minimum limit locked to protect {activeCount} active solver
                                        {activeCount > 1 ? "s" : ""}.
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex w-fit items-center gap-3 rounded-xl border border-border bg-background p-1.5 shadow-sm">
                                    <button
                                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted font-bold text-foreground disabled:opacity-40"
                                      disabled={group.limit <= Math.max(activeCount, 1)}
                                      onClick={() => adjustWorkspaceLimit(group.subtask, -1)}
                                      type="button"
                                    >
                                      -
                                    </button>
                                    <span className="w-8 text-center text-sm font-bold text-foreground">
                                      {group.limit}
                                    </span>
                                    <button
                                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted font-bold text-foreground"
                                      onClick={() => adjustWorkspaceLimit(group.subtask, 1)}
                                      type="button"
                                    >
                                      +
                                    </button>
                                    <div className="mx-1 h-6 w-px bg-border" />
                                    <button
                                      className={`rounded-lg px-4 py-1.5 text-xs font-bold ${
                                        isFull
                                          ? "bg-muted text-muted-foreground"
                                          : "bg-accent text-white"
                                      }`}
                                      onClick={() => saveWorkspaceLimit(group.subtask)}
                                      type="button"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="w-full min-w-[640px] border-collapse text-left">
                                    <thead>
                                      <tr className="border-b border-border bg-muted/30">
                                        <th className="w-[40%] p-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                          Active Solver
                                        </th>
                                        <th
                                          className={`w-[15%] p-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground ${highlight(
                                            "workspace-statuses",
                                          )}`}
                                          data-tour="workspace-statuses"
                                        >
                                          Status
                                        </th>
                                        <th className="w-[15%] p-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                          Claimed Date
                                        </th>
                                        <th className="w-[30%] p-4 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                          Actions
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {group.active.map((workspace) => (
                                        <tr
                                          className="border-b border-border last:border-b-0"
                                          key={workspace.id}
                                        >
                                          <td className="p-4">
                                            <div className="flex items-center gap-3">
                                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-[10px] font-bold text-accent">
                                                {workspace.initials}
                                              </div>
                                              <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-foreground">
                                                  {workspace.name}
                                                </p>
                                                <p className="truncate text-[10px] font-medium text-muted-foreground">
                                                  {workspace.institution || "Independent"}
                                                </p>
                                                {workspace.forked && (
                                                  <p className="mt-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent">
                                                    <GitBranch className="h-3 w-3" />
                                                    Forked Workspace
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          </td>
                                          <td className="p-4">
                                            <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                                              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                                              {workspace.status}
                                            </span>
                                          </td>
                                          <td className="p-4 text-xs font-bold text-muted-foreground">
                                            {workspace.claimed}
                                          </td>
                                          <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                              <Button
                                                className={highlight("workspace-terminate")}
                                                data-tour="workspace-terminate"
                                                onClick={() => {
                                                  setTerminatingId(workspace.id);
                                                  setTerminationReason("");
                                                }}
                                                size="sm"
                                                variant="destructive"
                                              >
                                                Terminate
                                              </Button>
                                              <Button
                                                onClick={showLocateUnavailable}
                                                size="sm"
                                                variant="outline"
                                              >
                                                Locate
                                              </Button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                {group.active.map((workspace) =>
                                  terminatingId === workspace.id ? (
                                    <div
                                      className="space-y-2 border-t border-destructive/20 bg-destructive/5 p-4"
                                      key={`terminate-${workspace.id}`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-foreground">
                                          Reason (Visible to Solver)
                                        </label>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">
                                          Visible to solver
                                        </span>
                                      </div>
                                      <textarea
                                        className="min-h-20 w-full resize-none rounded-lg border border-border bg-background p-3 text-sm text-foreground focus:border-destructive focus:outline-none focus:ring-2 focus:ring-destructive/20"
                                        onChange={(event) =>
                                          setTerminationReason(event.target.value)
                                        }
                                        placeholder="e.g., The approach deviated from the original requirements..."
                                        value={terminationReason}
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          onClick={() => {
                                            setTerminatingId(null);
                                            setTerminationReason("");
                                          }}
                                          size="sm"
                                          variant="outline"
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          disabled={!terminationReason.trim()}
                                          onClick={() => terminateWorkspace(workspace.id)}
                                          size="sm"
                                          variant="destructive"
                                        >
                                          Confirm Termination
                                        </Button>
                                      </div>
                                    </div>
                                  ) : null,
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {displayTab === "review" && (
              <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
                <aside
                  className={`space-y-2 rounded-2xl ${highlight("solutions-subtasks")}`}
                  data-tour="solutions-subtasks"
                >
                  <h3 className="mb-4 ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Filter by Sub-problem
                  </h3>
                  <button
                    className="flex w-full items-center justify-between rounded-xl border border-accent bg-accent p-4 text-left text-white shadow-md"
                    type="button"
                  >
                    <span className="text-sm font-bold">All Pending Solutions</span>
                    <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                      {solutionStatus === "pending" ? 1 : 0}
                    </span>
                  </button>
                  <button
                    className="flex w-full flex-col rounded-xl border border-border bg-background p-4 text-left shadow-sm"
                    type="button"
                  >
                    <span className="text-sm font-bold text-foreground">Route optimization</span>
                    <span className="mt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-amber-700">
                        {solutionStatus === "pending" ? "1 Pending" : "0 Pending"}
                      </span>
                      <span className="text-muted-foreground">1 / 3 Active</span>
                    </span>
                  </button>
                </aside>

                <div className="space-y-4">
                  <div
                    className={`overflow-hidden rounded-2xl border border-border bg-background shadow-sm ${highlight(
                      "solutions-list",
                    )}`}
                    data-tour="solutions-list"
                  >
                    <div className="flex items-center justify-between border-b border-border bg-muted/30 p-4">
                      <h3 className="text-sm font-bold text-foreground">Showing All Solutions</h3>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadge(
                          solutionStatus,
                        )}`}
                      >
                        {statusLabel(solutionStatus)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-bold text-foreground">Maya Chen</p>
                        <p className="text-[10px] font-medium text-muted-foreground">
                          Route optimization · submitted 2 hours ago
                        </p>
                      </div>
                      <Button
                        className={highlight("solution-open")}
                        data-tour="solution-open"
                        onClick={() => setSolutionOpen((open) => !open)}
                        size="sm"
                        variant="outline"
                      >
                        {solutionOpen ? "Close" : "Review"}
                      </Button>
                    </div>

                    {solutionOpen && (
                      <div className="space-y-4 border-t border-border bg-muted/10 p-4">
                        <div>
                          <h3 className="text-sm font-bold text-foreground">
                            Maya Chen&apos;s Solution
                          </h3>
                          <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                            Sub-Problem: Route optimization
                          </p>
                          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                            The solver delivered a working arrival model, a dashboard mockup, and a
                            validation report showing a 7.4-minute average peak wait time.
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-background p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Final Solution Description
                          </p>
                          <p className="mt-1 text-sm text-foreground">
                            Live arrival estimates are now available in the student app.
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-background p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Attachments
                          </p>
                          <div className="mt-2 space-y-1 text-sm text-foreground">
                            <p>arrival-model.xlsx</p>
                            <p>validation-report.pdf</p>
                          </div>
                        </div>

                        {solutionStatus === "pending" && !solutionRejecting && (
                          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button
                              onClick={() => {
                                setSolutionRejecting(true);
                                setSolutionRejectionReason("");
                              }}
                              size="sm"
                              variant="destructive"
                            >
                              Reject Solution
                            </Button>
                            <Button onClick={approveSolution} size="sm">
                              Approve Solution
                            </Button>
                          </div>
                        )}

                        {solutionRejecting && (
                          <div className="space-y-2 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-bold text-foreground">
                                Reason for Rejection
                              </label>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">
                                Required
                              </span>
                            </div>
                            <textarea
                              className="min-h-20 w-full resize-none rounded-lg border border-border bg-background p-3 text-sm text-foreground focus:border-destructive focus:outline-none focus:ring-2 focus:ring-destructive/20"
                              onChange={(event) =>
                                setSolutionRejectionReason(event.target.value)
                              }
                              placeholder="Explain what is missing or incorrect so the solver can improve..."
                              value={solutionRejectionReason}
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                onClick={() => {
                                  setSolutionRejecting(false);
                                  setSolutionRejectionReason("");
                                }}
                                size="sm"
                                variant="outline"
                              >
                                Cancel
                              </Button>
                              <Button
                                disabled={!solutionRejectionReason.trim()}
                                onClick={rejectSolution}
                                size="sm"
                                variant="destructive"
                              >
                                Confirm Reject
                              </Button>
                            </div>
                          </div>
                        )}

                        {solutionStatus !== "pending" && (
                          <div
                            className={`rounded-xl border p-4 ${
                              solutionStatus === "approved"
                                ? "border-accent/30 bg-accent/10"
                                : "border-destructive/20 bg-destructive/5"
                            }`}
                          >
                            <p className="text-sm font-bold text-foreground">
                              {solutionStatus === "approved"
                                ? "Solution approved! Merit awarded to solver."
                                : "Solution rejected. Workspace has been terminated and feedback sent."}
                            </p>
                            {solutionStatus === "rejected" && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                {solutionDecisionReason}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {solutionStatus !== "pending" && (
                    <div className="rounded-2xl border border-border bg-muted/20 p-6 text-center">
                      <p className="text-sm font-bold text-foreground">You are all caught up</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        There are no more solutions waiting for review.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {displayTab === "insights" && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setInsightsMode("duplicate")}
                    size="sm"
                    variant={!showUniqueInsight ? "secondary" : "outline"}
                  >
                    Review similar problem
                  </Button>
                  <Button
                    className={highlight("insights-unique-toggle")}
                    data-tour="insights-unique-toggle"
                    onClick={() => setInsightsMode("unique")}
                    size="sm"
                    variant={showUniqueInsight ? "secondary" : "outline"}
                  >
                    Confirm original problem
                  </Button>
                </div>

                {!showUniqueInsight ? (
                  <>
                    <div
                      className={`rounded-2xl border border-amber-200 bg-amber-50 p-5 ${highlight(
                        "insights-duplicate",
                      )}`}
                      data-tour="insights-duplicate"
                    >
                      <div className="flex gap-3">
                        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                        <div>
                          <h3 className="text-sm font-bold text-foreground">
                            Similar Problems Detected
                          </h3>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            1 historical capstone project with ≥60% semantic similarity. Review
                            these before proceeding to ensure your problem does not duplicate
                            existing work.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-foreground">
                            Campus Shuttle Optimization
                          </h3>
                          <p className="text-[10px] font-medium text-muted-foreground">
                            Historical capstone · 2023
                          </p>
                        </div>
                        <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                          82% semantic similarity
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        The historical project focused on static route planning. Your version adds
                        live arrival estimates and rider-facing wait times.
                      </p>
                      <div className="mt-4 flex justify-end">
                        <Button
                          className={highlight("insights-gap")}
                          data-tour="insights-gap"
                          onClick={() => setGapOpen((open) => !open)}
                          size="sm"
                          variant="outline"
                        >
                          {gapOpen ? "Hide Gap Analysis" : "View Gap Analysis"}
                        </Button>
                      </div>
                      {gapOpen && (
                        <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Gap analysis preview
                          </p>
                          <p className="mt-1 text-sm text-foreground">
                            Historical coverage: fixed routes, scheduling windows, driver
                            allocation. Your addition: real-time GPS prediction and
                            student-facing ETAs.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div
                    className={`rounded-2xl border border-accent/20 bg-accent/10 p-5 ${highlight(
                      "insights-unique",
                    )}`}
                    data-tour="insights-unique"
                  >
                    <div className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                      <div>
                        <h3 className="text-sm font-bold text-foreground">Verified Unique</h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          No highly similar problems found in the repository. This appears to be an
                          original problem statement.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          </section>
        ) : snap.flowId === "solver-active-workspace" ||
          activeTarget?.startsWith("solver-workspace") ? (
          <WorkspaceStage highlight={highlight} />
        ) : (
          <SolverStage
            activeTarget={activeTarget}
            highlight={highlight}
            key={snap.flowId ?? "solver"}
          />
        )}
      </div>
    </main>
  );
}
