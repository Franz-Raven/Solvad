export type OnboardingState = {
  flows: string[];
  dismissedAt: string | null;
};

export interface OnboardingClient {
  get(): Promise<OnboardingState>;
  completeFlow(flowId: string): Promise<OnboardingState>;
  dismiss(): Promise<OnboardingState>;
}
