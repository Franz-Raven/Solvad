"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { FLOW_LABELS, type DemoTab, type Notice } from "./tutorial-model";
import { useTutorialState } from "./tutorial-state";

const TABS: { id: DemoTab; label: string }[] = [
  { id: "problem", label: "Problem Profile" },
  { id: "proposals", label: "Pending Proposals" },
  { id: "workspace", label: "Active Workspaces" },
  { id: "review", label: "Pending Solutions" },
  { id: "insights", label: "AI Insights" },
];

export function TutorialPageHeader() {
  const { snapMode, modeFlowIds, flowId, goToFlow } = useTutorialHeaderState();

  return (
    <header className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">
          {snapMode === "seeker" ? "Seeker walkthrough" : "Solver walkthrough"}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-foreground md:text-4xl">
          See how Solvad works
        </h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {modeFlowIds.map((id) => (
          <Button
            key={id}
            onClick={() => goToFlow(id)}
            size="sm"
            variant={id === flowId ? "secondary" : "outline"}
          >
            {FLOW_LABELS[id] ?? id}
          </Button>
        ))}
      </div>
    </header>
  );
}

function useTutorialHeaderState() {
  const { mode, modeFlowIds, flowId, goToFlow } = useTutorialState();

  return { snapMode: mode, modeFlowIds, flowId, goToFlow };
}

export function TutorialBackLink() {
  return (
    <Link
      className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary-foreground"
      href="/landing"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to landing
    </Link>
  );
}

export function DemoNotice({ notice, onDismiss }: { notice: Notice | null; onDismiss: () => void }) {
  if (!notice) return null;

  return (
    <div
      className={`mb-5 flex items-start justify-between gap-3 rounded-2xl border p-4 ${
        notice.tone === "success"
          ? "border-accent/30 bg-accent/10"
          : "border-destructive/30 bg-destructive/10"
      }`}
      role="status"
    >
      <div className="flex gap-3">
        {notice.tone === "success" ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
        ) : (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        )}
        <div>
          <p className="text-sm font-bold text-foreground">{notice.title}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{notice.message}</p>
        </div>
      </div>
      <button
        aria-label="Dismiss message"
        className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        onClick={onDismiss}
        type="button"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function SeekerShell({ children }: { children: ReactNode }) {
  const { activeTab, displayTab, setActiveTab, highlight, notice, setNotice } = useTutorialState();

  return (
    <section
      className="mt-6 overflow-hidden rounded-3xl border border-border bg-background shadow-xl"
      id="tour-stage"
    >
      <div className="border-b border-border bg-muted/30 px-5 py-4 md:px-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Seeker problem workspace
            </p>
            <h2 className="mt-1 text-xl font-bold text-foreground md:text-2xl">
              Optimizing campus shuttle routes
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
              <span className="rounded-md border border-accent/20 bg-accent/10 px-2.5 py-1 text-accent">
                OPEN
              </span>
              <span className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700">
                Information Technology
              </span>
              <span className="rounded-md border border-border bg-muted px-2.5 py-1 text-muted-foreground">
                3 Sub-tasks
              </span>
            </div>
          </div>
          <Button size="sm" variant="outline">
            Change Status
          </Button>
        </div>

        <nav className="mt-4 flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/40 p-1">
          {TABS.map((item) => (
            <button
              key={item.id}
              data-tour={`tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-bold transition-all ${highlight(
                `tab-${item.id}`,
              )} ${
                displayTab === item.id
                  ? "border-border bg-background text-accent shadow-sm"
                  : "border-transparent text-muted-foreground hover:bg-background/70 hover:text-foreground"
              }`}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-5 md:p-7">
        <DemoNotice notice={notice} onDismiss={() => setNotice(null)} />
        {children}
      </div>
    </section>
  );
}

export function SolverShell({ children }: { children: ReactNode }) {
  return (
    <section
      className="mt-6 overflow-hidden rounded-3xl border border-border bg-background shadow-xl"
      id="tour-stage"
    >
      <div className="border-b border-border bg-muted/30 px-5 py-4 md:px-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Solver workspace
            </p>
            <h2 className="mt-1 text-xl font-bold text-foreground md:text-2xl">
              Your solver dashboard
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
              <span className="rounded-md border border-secondary/20 bg-secondary/10 px-2.5 py-1 text-secondary">
                Preview
              </span>
              <span className="rounded-md border border-border bg-muted px-2.5 py-1 text-muted-foreground">
                Placeholder page
              </span>
            </div>
          </div>
          <Button size="sm" variant="outline">
            Change Status
          </Button>
        </div>

        <nav className="mt-4 flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/40 p-1">
          <button
            className="whitespace-nowrap rounded-lg border border-border bg-background px-4 py-2 text-sm font-bold text-accent shadow-sm"
            type="button"
          >
            Dashboard
          </button>
          <button
            className="whitespace-nowrap rounded-lg border border-transparent px-4 py-2 text-sm font-bold text-muted-foreground"
            type="button"
          >
            My Workspace
          </button>
        </nav>
      </div>

      <div className="p-5 md:p-7">{children}</div>
    </section>
  );
}
