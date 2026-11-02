"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { FLOW_SETS, type TutorialGroup } from "@/lib/tutorial/flows";
import { currentTutorialTarget, tutorial } from "@/lib/tutorial/tutorial";

import {
  FLOW_LABELS,
  INITIAL_FORM,
  INITIAL_WORKSPACES,
  INITIAL_STORY,
  flowTab,
  type DemoTab,
  type InsightsMode,
  type Notice,
  type ProblemStage,
  type Proposal,
  type SolutionStatus,
  type Workspace,
} from "./tutorial-model";

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

type TutorialStateValue = {
  flowId: string;
  group: TutorialGroup;
  mode: TutorialGroup;
  activeTarget: string | undefined;
  activeTab: DemoTab;
  displayTab: DemoTab;
  localMode: TutorialGroup;
  notice: Notice | null;
  formData: typeof INITIAL_FORM;
  formError: boolean;
  formTargets: string[];
  formHighlight: boolean;
  problemStage: ProblemStage;
  subtasks: string[];
  proposals: Proposal[];
  pendingProposals: Proposal[];
  selectedProposalId: string | null;
  proposalRejecting: boolean;
  proposalRejectionReason: string;
  workspaces: Workspace[];
  activeWorkspaces: Workspace[];
  terminatingId: string | null;
  terminationReason: string;
  workspaceFilter: string;
  workspaceLimits: Record<string, number>;
  collapsedWorkspaceGroups: Set<string>;
  solutionStatus: SolutionStatus;
  solutionOpen: boolean;
  solutionRejecting: boolean;
  solutionRejectionReason: string;
  solutionDecisionReason: string;
  insightsMode: InsightsMode;
  gapOpen: boolean;
  showUniqueInsight: boolean;
  flowIds: string[];
  modeFlowIds: string[];
  setActiveTab: (tab: DemoTab) => void;
  setNotice: (notice: Notice | null) => void;
  setSelectedProposalId: (id: string | null) => void;
  setProposalRejecting: (value: boolean) => void;
  setProposalRejectionReason: (value: string) => void;
  setTerminatingId: (id: string | null) => void;
  setTerminationReason: (value: string) => void;
  setWorkspaceFilter: (value: string) => void;
  setSolutionOpen: (value: boolean | ((open: boolean) => boolean)) => void;
  setSolutionRejecting: (value: boolean) => void;
  setSolutionRejectionReason: (value: string) => void;
  setInsightsMode: (mode: InsightsMode) => void;
  setSubtasks: (value: string[] | ((current: string[]) => string[])) => void;
  setGapOpen: (value: boolean | ((open: boolean) => boolean)) => void;
  goToFlow: (id: string) => void;
  handleInputChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
  analyzeProblem: () => void;
  publishProblem: () => void;
  approveProposal: (id: string) => void;
  rejectProposal: (id: string) => void;
  terminateWorkspace: (id: string) => void;
  approveSolution: () => void;
  rejectSolution: () => void;
  resetProblemForm: () => void;
  toggleWorkspaceGroup: (subtask: string) => void;
  adjustWorkspaceLimit: (subtask: string, delta: number) => void;
  saveWorkspaceLimit: (subtask: string) => void;
  showLocateUnavailable: () => void;
  highlight: (target: string) => string;
};

const TutorialStateContext = createContext<TutorialStateValue | null>(null);

export function TutorialProvider({
  flowId,
  group,
  children,
}: {
  flowId: string;
  group: TutorialGroup;
  children: ReactNode;
}) {
  const router = useRouter();
  const snap = useSyncExternalStore(tutorial.subscribe, tutorial.getSnapshot, tutorial.getSnapshot);
  const [activeTab, setActiveTab] = useState<DemoTab>(flowTab(flowId) ?? "problem");
  const [localMode, setLocalMode] = useState<TutorialGroup>(group);
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

  const [insightsMode, setInsightsMode] = useState<InsightsMode>("duplicate");
  const [gapOpen, setGapOpen] = useState(false);

  const activeTarget = currentTutorialTarget();
  const mode: TutorialGroup = snap.active ? snap.group : localMode;
  const flowIds = Object.keys(FLOW_SETS[group]);
  const modeFlowIds = Object.keys(FLOW_SETS[mode]);
  const displayTab = flowTab(flowId) ?? activeTab;
  const showUniqueInsight =
    insightsMode === "unique" || activeTarget === "insights-unique-toggle";

  const formTargets = [
    "problem-title",
    "problem-background",
    "problem-primary",
    "problem-objectives",
    "problem-constraints",
    "problem-program",
  ];
  const formHighlight = formTargets.includes(activeTarget ?? "");

  const highlight = (target: string) =>
    activeTarget === target
      ? "ring-2 ring-secondary ring-offset-2 ring-offset-background"
      : "";

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tour");

    if (requested && FLOW_SETS[group][requested]) {
      if (!snap.active || snap.flowId !== requested) tutorial.start(requested);
    } else if (!snap.active || snap.flowId !== flowId) {
      tutorial.start(flowId);
      const next = new URL(window.location.href);
      if (next.searchParams.get("tour") !== flowId) {
        next.searchParams.set("tour", flowId);
        router.replace(`${next.pathname}${next.search}`, { scroll: false });
      }
    }
  }, [flowId, group, router, snap.active, snap.flowId]);

  useEffect(() => {
    return () => {
      const path = window.location.pathname.replace(/\/$/, "");
      const expected = `/public-tutorial/${flowId}`;

      if (path !== expected && path !== "/public-tutorial") tutorial.stop();
    };
  }, [flowId]);

  const goToFlow = useCallback(
    (id: string) => {
      const nextGroup: TutorialGroup = id.startsWith("solver-") ? "solver" : "seeker";

      setLocalMode(nextGroup);

      if (flowTab(id)) setActiveTab(flowTab(id)!);

      setNotice(null);

      if (nextGroup === group) {
        router.push(`/public-tutorial/${id}?tour=${id}`);
      } else {
        router.push(`/public-tutorial/${id}?tour=${id}`);
      }

      tutorial.start(id);
    },
    [group, router],
  );

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

  const resetProblemForm = () => {
    setFormData(INITIAL_FORM);
    setFormError(false);
    setProblemStage("editing");
    setNotice(null);
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

  const value: TutorialStateValue = {
    flowId,
    group,
    mode,
    activeTarget,
    activeTab,
    displayTab,
    localMode,
    notice,
    formData,
    formError,
    formTargets,
    formHighlight,
    problemStage,
    subtasks,
    proposals,
    pendingProposals,
    selectedProposalId,
    proposalRejecting,
    proposalRejectionReason,
    workspaces,
    activeWorkspaces,
    terminatingId,
    terminationReason,
    workspaceFilter,
    workspaceLimits,
    collapsedWorkspaceGroups,
    solutionStatus,
    solutionOpen,
    solutionRejecting,
    solutionRejectionReason,
    solutionDecisionReason,
    insightsMode,
    gapOpen,
    showUniqueInsight,
    flowIds,
    modeFlowIds,
    setActiveTab,
    setNotice,
    setSelectedProposalId,
    setProposalRejecting,
    setProposalRejectionReason,
    setTerminatingId,
    setTerminationReason,
    setWorkspaceFilter,
    setSolutionOpen,
    setSolutionRejecting,
    setSolutionRejectionReason,
    setInsightsMode,
    setSubtasks,
    setGapOpen,
    goToFlow,
    handleInputChange,
    analyzeProblem,
    publishProblem,
    approveProposal,
    rejectProposal,
    terminateWorkspace,
    approveSolution,
    rejectSolution,
    resetProblemForm,
    toggleWorkspaceGroup,
    adjustWorkspaceLimit,
    saveWorkspaceLimit,
    showLocateUnavailable,
    highlight,
  };

  return <TutorialStateContext.Provider value={value}>{children}</TutorialStateContext.Provider>;
}

export function useTutorialState() {
  const value = useContext(TutorialStateContext);

  if (!value) throw new Error("useTutorialState must be used inside TutorialProvider");

  return value;
}

export { FLOW_LABELS, INITIAL_STORY };
