import type { ReactNode } from "react";

import { InsightsDuplicates, InsightsGap, InsightsUnique } from "./mocks/insights";
import { ProblemScopePreview } from "./mocks/post-problem";
import { ProposalReject } from "./mocks/proposals";
import { SolutionOpen } from "./mocks/solutions";
import { WorkspaceTerminate } from "./mocks/workspaces";

export type FlowStep = {
  tab: string;
  title: string;
  body: string;
  target: string;
  render?: () => ReactNode;
};

export const FLOWS: Record<string, FlowStep[]> = {
  "post-problem": [
    { tab: "Post New Problem", title: "Start with a clear title", body: "This becomes the headline solvers see in their feed. Keep it short and specific.", target: '[data-tour="problem-title"]' },
    { tab: "Post New Problem", title: "Set the industry context", body: "Explain the current situation, who is affected, and why this problem matters now.", target: '[data-tour="problem-background"]' },
    { tab: "Post New Problem", title: "State the core problem", body: "One unambiguous paragraph is enough. This is the statement solvers will respond to.", target: '[data-tour="problem-primary"]' },
    { tab: "Post New Problem", title: "Define what success looks like", body: "List measurable outcomes so solvers know exactly what they need to achieve.", target: '[data-tour="problem-objectives"]' },
    { tab: "Post New Problem", title: "Set the boundaries", body: "Add budget, timeline, and technical limits that the solution must respect.", target: '[data-tour="problem-constraints"]' },
    { tab: "Post New Problem", title: "Route it to the right program", body: "Choose the academic program best suited to solve this challenge.", target: '[data-tour="problem-program"]' },
    { tab: "Post New Problem", title: "Let AI structure the work", body: "Analyze the problem to generate editable, department-focused sub-tasks before publishing.", target: '[data-tour="problem-analyze"]', render: ProblemScopePreview },
  ],
  "pending-proposals": [
    { tab: "Pending Proposals", title: "Open the proposals queue", body: "Every solver request lands here, grouped by the sub-problem they want to work on.", target: '[data-tour="tab-proposals"]' },
    { tab: "Pending Proposals", title: "Review by sub-problem", body: "Filter the sidebar, then open a request to read the solver's approach and supporting files.", target: '[data-tour="proposals-list"]' },
    { tab: "Pending Proposals", title: "Approve a proposal", body: "Approving creates an active workspace immediately. Capacity is enforced per sub-problem.", target: '[data-tour="proposal-approve"]' },
    { tab: "Pending Proposals", title: "Reject a proposal", body: "Rejecting closes the request. This preview adds a required reason so the solver knows what to improve.", target: '[data-tour="proposal-reject"]', render: ProposalReject },
  ],
  "active-workspaces": [
    { tab: "Active Workspaces", title: "Open the workspace board", body: "Approved solvers appear here with their current status and sub-problem.", target: '[data-tour="tab-workspace"]' },
    { tab: "Active Workspaces", title: "Track every workspace", body: "See each active solver, their institution, claimed date, and current status.", target: '[data-tour="workspaces-list"]' },
    { tab: "Active Workspaces", title: "Understand workspace statuses", body: "Active workspaces stay in Drafting. Submitting moves the work to Pending Solutions; approval completes the attempt and termination closes it.", target: '[data-tour="workspace-statuses"]' },
    { tab: "Active Workspaces", title: "Terminate a workspace", body: "Ending an attempt requires a reason. The solver is notified and the attempt is locked.", target: '[data-tour="workspace-terminate"]', render: WorkspaceTerminate },
  ],
  "pending-solutions": [
    { tab: "Pending Solutions", title: "Open the review queue", body: "Submitted solutions wait here until you approve or reject them.", target: '[data-tour="tab-review"]' },
    { tab: "Pending Solutions", title: "Filter by sub-problem", body: "Use the sidebar to focus on one sub-problem and see how many reviews are waiting.", target: '[data-tour="solutions-subtasks"]' },
    { tab: "Pending Solutions", title: "Scan the pending list", body: "Each row shows the solver, sub-problem, and submission date so you can triage quickly.", target: '[data-tour="solutions-list"]' },
    { tab: "Pending Solutions", title: "Open the submitted work", body: "Review the final description, attachments, and solver metrics before deciding.", target: '[data-tour="solution-open"]', render: SolutionOpen },
  ],
  "ai-insights": [
    { tab: "AI Insights", title: "Open AI Insights", body: "Check the problem against historical capstones before publishing.", target: '[data-tour="tab-insights"]' },
    { tab: "AI Insights", title: "Review similar problems", body: "A high similarity score is a warning, not a block. Compare the match before proceeding.", target: '[data-tour="insights-duplicate"]', render: InsightsDuplicates },
    { tab: "AI Insights", title: "Compare the gap", body: "Gap analysis shows what the historical problem covered and what your version adds.", target: '[data-tour="insights-gap"]', render: InsightsGap },
    { tab: "AI Insights", title: "Confirm it is unique", body: "Original problems will have no similar problems listed.", target: '[data-tour="insights-unique-toggle"]', render: InsightsUnique },
  ],
};

export const SOLVER_FLOWS: Record<string, FlowStep[]> = {
  "solver-submit-proposal": [
    { tab: "Submit Proposal", title: "Open the problem", body: "This is the problem page. Read the full brief before you decide to apply.", target: '[data-tour="solver-problem-header"]' },
    { tab: "Submit Proposal", title: "View the blueprint", body: "Open the Problem Blueprint tab to see the context, objectives, and limits the seeker has set.", target: '[data-tour="solver-blueprint-tab"]' },
    { tab: "Submit Proposal", title: "Work one sub-problem at a time", body: "Each sub-problem is a separate proposal. You apply for that specific piece of work, not the whole problem.", target: '[data-tour="solver-subtasks"]' },
    { tab: "Submit Proposal", title: "Pick the sub-problem that fits you", body: "Choose the sub-problem that matches your skills and the time you have available.", target: '[data-tour="solver-subtask-card"]' },
    { tab: "Submit Proposal", title: "Explain your approach", body: "Describe how you will solve this sub-problem. Be specific about your method and what you will deliver.", target: '[data-tour="solver-proposal-approach"]' },
    { tab: "Submit Proposal", title: "Attach supporting files", body: "Add any documents that help the seeker understand your plan. This part is optional.", target: '[data-tour="solver-proposal-files"]' },
    { tab: "Submit Proposal", title: "Submit one proposal per sub-problem", body: "After you submit, the seeker reviews your approach. If approved, a workspace opens for this sub-problem only.", target: '[data-tour="solver-proposal-submit"]' },
  ],
  "solver-solution-tree": [
    { tab: "Solution Tree", title: "Open the solution tree", body: "The solution tree shows every attempt on this problem and how solutions build on each other.", target: '[data-tour="solver-tree-tab"]' },
    { tab: "Solution Tree", title: "Start with no solutions", body: "When no one has solved the problem yet, the tree is empty. The first approved proposal becomes the root.", target: '[data-tour="solver-tree-empty"]' },
    { tab: "Solution Tree", title: "See completed solutions", body: "Completed attempts appear as nodes. Forked attempts branch from the solution they build on.", target: '[data-tour="solver-tree-complete"]' },
    { tab: "Solution Tree", title: "Build upon a completed solution", body: "Use Build Upon to start from an existing approach. The original solution stays in the tree.", target: '[data-tour="solver-tree-build-upon"]' },
    { tab: "Solution Tree", title: "Explain your fork", body: "Describe what you will change or improve on the original solution. Your fork starts from that completed work.", target: '[data-tour="solver-fork-approach"]' },
    { tab: "Solution Tree", title: "Submit the fork proposal", body: "The seeker reviews your fork before a workspace is created. You only work on the sub-problem you forked.", target: '[data-tour="solver-fork-submit"]' },
  ],
};

export const FLOW_SETS = {
  seeker: FLOWS,
  solver: SOLVER_FLOWS,
} as const;

export type TutorialGroup = keyof typeof FLOW_SETS;

export function groupForFlow(flowId: string): TutorialGroup {
  return SOLVER_FLOWS[flowId] ? "solver" : "seeker";
}
