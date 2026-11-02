import type { OnboardingClient, OnboardingState } from "./types";

const STORAGE_KEY = "onboarding.state.v1";
const EMPTY: OnboardingState = { flows: [], dismissedAt: null };

function isState(value: unknown): value is OnboardingState {
  if (!value || typeof value !== "object") return false;

  const state = value as Partial<OnboardingState>;

  return (
    Array.isArray(state.flows) &&
    state.flows.every((flow) => typeof flow === "string") &&
    (state.dismissedAt === null || typeof state.dismissedAt === "string")
  );
}

function read(): OnboardingState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) return { ...EMPTY };

    const parsed: unknown = JSON.parse(raw);

    return isState(parsed)
      ? { flows: [...parsed.flows], dismissedAt: parsed.dismissedAt }
      : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

function write(state: OnboardingState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  return state;
}

export const localClient: OnboardingClient = {
  async get() {
    return read();
  },
  async completeFlow(flowId) {
    const state = read();

    if (!state.flows.includes(flowId)) {
      write({ ...state, flows: [...state.flows, flowId] });
    }

    return read();
  },
  async dismiss() {
    return write({ ...read(), dismissedAt: new Date().toISOString() });
  },
};
