import type { CSSProperties } from "react";

import { FLOW_SETS, groupForFlow, type TutorialGroup } from "./flows";

export type TutorialSnapshot = {
  active: boolean;
  group: TutorialGroup;
  flowId: string | null;
  stepIndex: number;
};

const IDLE: TutorialSnapshot = { active: false, group: "seeker", flowId: null, stepIndex: 0 };
const IDLE_PROPS: CSSProperties = { display: "none" };
const ORIGIN_PROPS = {
  left: "50%",
  position: "fixed",
  top: "50%",
  transform: "translate(-50%, -50%)",
} as const;

const FLOW_IDS_BY_GROUP: Record<TutorialGroup, string[]> = {
  seeker: Object.keys(FLOW_SETS.seeker),
  solver: Object.keys(FLOW_SETS.solver),
};

const FLOW_OFFSETS_BY_GROUP: Record<TutorialGroup, Record<string, number>> = {
  seeker: {},
  solver: {},
};
const TOTAL_BY_GROUP: Record<TutorialGroup, number> = { seeker: 0, solver: 0 };

for (const group of Object.keys(FLOW_IDS_BY_GROUP) as TutorialGroup[]) {
  let runningTotal = 0;

  for (const flowId of FLOW_IDS_BY_GROUP[group]) {
    FLOW_OFFSETS_BY_GROUP[group][flowId] = runningTotal;
    runningTotal += FLOW_SETS[group][flowId].length;
  }

  TOTAL_BY_GROUP[group] = runningTotal;
}

function flowAt(group: TutorialGroup, globalIndex: number) {
  let remaining = globalIndex;

  for (const flowId of FLOW_IDS_BY_GROUP[group]) {
    const length = FLOW_SETS[group][flowId].length;

    if (remaining < length) return { flowId, indexInFlow: remaining };

    remaining -= length;
  }

  const ids = FLOW_IDS_BY_GROUP[group];
  const lastId = ids[ids.length - 1];

  return { flowId: lastId, indexInFlow: FLOW_SETS[group][lastId].length - 1 };
}

let snapshot = IDLE;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export const tutorial = {
  subscribe(listener: () => void) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot() {
    return snapshot;
  },
  start(flowId: string) {
    const group = groupForFlow(flowId);
    const ids = FLOW_IDS_BY_GROUP[group];
    const offsets = FLOW_OFFSETS_BY_GROUP[group];
    const resolved = offsets[flowId] === undefined ? ids[0] : flowId;

    snapshot = { active: true, group, flowId: resolved, stepIndex: offsets[resolved] };
    emit();
  },
  next() {
    if (!snapshot.active) return;

    const nextIndex = snapshot.stepIndex + 1;

    if (nextIndex >= TOTAL_BY_GROUP[snapshot.group]) return;

    const { flowId } = flowAt(snapshot.group, nextIndex);

    snapshot = { ...snapshot, flowId, stepIndex: nextIndex };
    emit();
  },
  back() {
    if (!snapshot.active) return;

    const previousIndex = Math.max(0, snapshot.stepIndex - 1);
    const { flowId } = flowAt(snapshot.group, previousIndex);

    snapshot = { ...snapshot, flowId, stepIndex: previousIndex };
    emit();
  },
  stop() {
    snapshot = IDLE;
    emit();
  },
};

export function tutorialFlowIds(group: TutorialGroup): string[] {
  return FLOW_IDS_BY_GROUP[group];
}

export function tutorialStepCount(group: TutorialGroup): number {
  return TOTAL_BY_GROUP[group];
}

export function currentTutorialTarget(): string | undefined {
  if (!snapshot.active || !snapshot.flowId) return undefined;

  const flows = FLOW_SETS[snapshot.group];
  const offset = FLOW_OFFSETS_BY_GROUP[snapshot.group][snapshot.flowId] ?? 0;
  const target = flows[snapshot.flowId]?.[snapshot.stepIndex - offset]?.target;

  return target?.match(/data-tour="([^"]+)"/)?.[1] ?? target;
}

export const tutorialTargetProps = (active: boolean) => ({
  targetProps: active ? ORIGIN_PROPS : IDLE_PROPS,
});
