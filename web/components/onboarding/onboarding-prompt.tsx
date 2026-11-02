"use client";

import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { OnboardingState } from "@/lib/onboarding/types";

type Props = {
  state: OnboardingState;
  onStart: () => void;
  onSkip: () => void;
  onDismiss: () => void;
  busy?: boolean;
};

export function OnboardingPrompt({ onStart, onSkip, onDismiss, busy }: Props) {
  return (
    <aside className="fixed bottom-5 right-5 z-40 w-[min(92vw,360px)] rounded-2xl border border-border bg-background p-5 shadow-xl">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-primary-foreground">
        <Compass className="h-5 w-5" />
      </div>
      <h2 className="text-lg font-bold text-foreground">New here?</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        Take a quick tour of the five main Solvad flows. It takes about two minutes.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <Button disabled={busy} onClick={onStart} variant="secondary">
          Start tour
        </Button>
        <div className="flex gap-2">
          <Button className="flex-1" disabled={busy} onClick={onSkip} variant="outline">
            Skip for now
          </Button>
          <Button className="flex-1" disabled={busy} onClick={onDismiss} variant="ghost">
            Don&apos;t show again
          </Button>
        </div>
      </div>
    </aside>
  );
}
