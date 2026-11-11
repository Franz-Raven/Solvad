import type { OnboardingState } from "./types";

export type EntryDecision =
  | { kind: "prompt" }
  | { kind: "resume"; flowId: string }
  | { kind: "none" };

export function decideEntry(state: OnboardingState, flowIds: string[]): EntryDecision {
  if (state.dismissedAt) return { kind: "none" };

  const remaining = flowIds.filter((flowId) => !state.flows.includes(flowId));

  if (remaining.length === 0) return { kind: "none" };
  if (state.flows.length === 0) return { kind: "prompt" };

  return { kind: "resume", flowId: remaining[0] };
}
