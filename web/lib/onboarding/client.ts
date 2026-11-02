import { localClient } from "./local-client";
import type { OnboardingClient } from "./types";

export const onboardingClient: OnboardingClient = localClient;
