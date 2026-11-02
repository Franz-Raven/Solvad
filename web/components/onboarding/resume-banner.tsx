"use client";

import { Play } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  flowId: string;
  onResume: () => void;
  onDismiss: () => void;
  busy?: boolean;
};

export function ResumeBanner({ flowId, onResume, onDismiss, busy }: Props) {
  return (
    <aside className="fixed bottom-5 right-5 z-40 flex w-[min(92vw,380px)] items-start gap-3 rounded-2xl border border-border bg-background p-4 shadow-xl">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-primary-foreground">
        <Play className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground">Pick up the tour</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">Next flow: {flowId}</p>
        <div className="mt-2 flex gap-2">
          <Button disabled={busy} onClick={onResume} size="sm" variant="secondary">
            Resume
          </Button>
          <Button disabled={busy} onClick={onDismiss} size="sm" variant="ghost">
            Dismiss
          </Button>
        </div>
      </div>
    </aside>
  );
}
