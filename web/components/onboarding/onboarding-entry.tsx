"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { OnboardingPrompt } from "@/components/onboarding/onboarding-prompt";
import { ResumeBanner } from "@/components/onboarding/resume-banner";
import { useAuth } from "@/context/auth-context";
import { onboardingClient } from "@/lib/onboarding/client";
import { decideEntry } from "@/lib/onboarding/derive";
import type { OnboardingState } from "@/lib/onboarding/types";
import { FLOWS, SOLVER_FLOWS } from "@/lib/tutorial/flows";

const SEEKER_FLOW_IDS = Object.keys(FLOWS);
const SOLVER_FLOW_IDS = Object.keys(SOLVER_FLOWS);

export function OnboardingEntry() {
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState>();
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const isSolver = user?.role === "SOLVER";
  const flowIds = isSolver ? SOLVER_FLOW_IDS : SEEKER_FLOW_IDS;

  useEffect(() => {
    let cancelled = false;

    onboardingClient
      .get()
      .then((next) => {
        if (!cancelled) setState(next);
      })
      .catch(() => {
        if (!cancelled) setState({ flows: [], dismissedAt: null });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!state) return null;

  const decision = decideEntry(state, flowIds);

  if (decision.kind === "none") return null;

  const finish = async (flowId: string) => {
    setBusy(true);

    try {
      setState(await onboardingClient.completeFlow(flowId));
    } finally {
      setBusy(false);
    }
  };

  const dismiss = async () => {
    setBusy(true);

    try {
      setState(await onboardingClient.dismiss());
    } finally {
      setBusy(false);
    }
  };

  if (decision.kind === "prompt") {
    const firstFlow = flowIds[0];
    const tourQuery = isSolver ? `tour=${firstFlow}` : "tour=1";

    return (
      <OnboardingPrompt
        busy={busy}
        onDismiss={() => {
          void dismiss();
        }}
        onSkip={() => {
          void finish(firstFlow);
        }}
        onStart={() => router.push(`/public-tutorial?${tourQuery}`)}
        state={state}
      />
    );
  }

  return (
    <ResumeBanner
      busy={busy}
      flowId={decision.flowId}
      onDismiss={() => {
        void dismiss();
      }}
      onResume={() => router.push(`/public-tutorial?tour=${decision.flowId}`)}
    />
  );
}
