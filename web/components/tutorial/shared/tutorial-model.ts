import type { ChangeEvent } from "react";

import type { TutorialGroup } from "@/lib/tutorial/flows";

export type DemoTab = "problem" | "proposals" | "workspace" | "review" | "insights";
export type ProposalStatus = "pending" | "approved" | "rejected";
export type WorkspaceStatus = "Drafting" | "Completed" | "Terminated";
export type SolutionStatus = "pending" | "approved" | "rejected";
export type Notice = { tone: "success" | "error"; title: string; message: string };
export type ProblemStage = "editing" | "scope" | "published";
export type InsightsMode = "duplicate" | "unique";

export type Proposal = {
  id: string;
  name: string;
  initials: string;
  institution: string;
  subtask: string;
  approach: string;
  status: ProposalStatus;
  decisionReason?: string;
};

export type Workspace = {
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

export const FLOW_LABELS: Record<string, string> = {
  "post-problem": "Post a problem",
  "pending-proposals": "Review proposals",
  "active-workspaces": "Manage workspaces",
  "pending-solutions": "Review solutions",
  "ai-insights": "AI insights",
  "solver-submit-proposal": "Submit a proposal",
  "solver-solution-tree": "Solution tree",
};

export const INITIAL_FORM = {
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

export const INITIAL_STORY = {
  workspaces: [{ id: "ws-maya" }],
  subtasks: ["Route optimization", "Rider experience"],
};

export const INITIAL_WORKSPACES: Workspace[] = [
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

export const STATUS_LABEL: Record<ProposalStatus | SolutionStatus, string> = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
};

export const WORKSPACE_SUBTASKS = INITIAL_STORY.subtasks;

export function statusBadge(status: ProposalStatus | SolutionStatus) {
  if (status === "approved") return "border-accent/20 bg-accent/10 text-accent";
  if (status === "rejected") return "border-destructive/20 bg-destructive/10 text-destructive";

  return "border-amber-500/20 bg-amber-500/10 text-amber-700";
}

export function statusLabel(status: ProposalStatus | SolutionStatus) {
  return STATUS_LABEL[status];
}

export function flowTab(flowId: string): DemoTab | undefined {
  return {
    "post-problem": "problem",
    "pending-proposals": "proposals",
    "active-workspaces": "workspace",
    "pending-solutions": "review",
    "ai-insights": "insights",
  }[flowId] as DemoTab | undefined;
}

export function flowGroup(flowId: string): TutorialGroup {
  return flowId.startsWith("solver-") ? "solver" : "seeker";
}

export type FormChangeHandler = (
  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
) => void;

export function readTourRequest(search: string) {
  const params = new URLSearchParams(search);
  return params.get("tour") ?? params.get("flow");
}
