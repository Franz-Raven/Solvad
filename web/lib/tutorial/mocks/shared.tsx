import type { ReactNode } from "react";

type Tone = "amber" | "blue" | "green" | "rose" | "slate";

const TONES: Record<Tone, string> = {
  amber: "border-accent/30 bg-accent/10 text-primary-foreground",
  blue: "border-accent/30 bg-accent/10 text-primary-foreground",
  green: "border-accent/30 bg-accent/10 text-primary-foreground",
  rose: "border-destructive/30 bg-destructive/10 text-destructive",
  slate: "border-border bg-muted text-muted-foreground",
};

export function MockShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mt-4 rounded-xl border border-border bg-muted/40 p-3 text-left ${className}`}>
      {children}
    </div>
  );
}

export function MockCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-background p-3 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function Field({ label, value, error }: { label: string; value?: string; error?: boolean }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-muted-foreground">{label}</span>
        {error && <span className="text-[10px] font-bold text-destructive">Required</span>}
      </div>
      <div
        className={`min-h-8 rounded-lg border px-2.5 py-2 text-[11px] ${
          error
            ? "border-destructive/40 bg-destructive/10 text-destructive"
            : value
              ? "border-border bg-background text-foreground/90"
              : "border-border bg-background text-muted-foreground/70"
        }`}
      >
        {value || "\u00a0"}
      </div>
    </div>
  );
}

export function MockButton({
  children,
  tone = "primary",
}: {
  children: ReactNode;
  tone?: "danger" | "ghost" | "primary";
}) {
  const tones = {
    danger: "bg-destructive text-white",
    ghost: "border border-border bg-background text-muted-foreground",
    primary: "bg-secondary text-white",
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-[11px] font-bold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Avatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/20 text-[10px] font-bold text-primary-foreground">
      {initials}
    </div>
  );
}
