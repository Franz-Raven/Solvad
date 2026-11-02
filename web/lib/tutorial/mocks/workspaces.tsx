import { FolderKanban, GitBranch, Search, XCircle } from "lucide-react";

import { Avatar, Badge, MockButton, MockCard, MockShell } from "./shared";

export function WorkspacesEmpty() {
  return (
    <MockShell>
      <MockCard className="flex flex-col items-center gap-2 border-dashed py-8 text-center">
        <FolderKanban className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-[12px] font-bold text-foreground/90">No active solvers</p>
        <p className="max-w-60 text-[10px] text-muted-foreground">
          Active workspaces appear after you approve a solver proposal.
        </p>
      </MockCard>
    </MockShell>
  );
}

export function WorkspacesList() {
  return (
    <MockShell>
      <MockCard className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-bold text-foreground">Showing All Workspaces (1)</p>
          <Badge tone="amber">1 Active</Badge>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Sensor enclosure
        </p>
        <div className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5">
          <Avatar initials="AM" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold text-foreground/90">Amina Mwangi</p>
            <p className="text-[10px] text-muted-foreground">University of Nairobi · claimed today</p>
          </div>
          <Badge tone="amber">Drafting</Badge>
          <MockButton tone="danger">
            <XCircle className="mr-1 h-3 w-3" />
            Terminate
          </MockButton>
          <MockButton tone="ghost">
            <Search className="mr-1 h-3 w-3" />
            Locate
          </MockButton>
        </div>
      </MockCard>
    </MockShell>
  );
}

export function WorkspaceTerminate() {
  return (
    <MockShell>
      <MockCard className="space-y-2.5">
        <div className="flex items-center gap-2">
          <Avatar initials="AM" />
          <div className="flex-1">
            <p className="text-[12px] font-bold text-foreground">Terminate Solver</p>
            <p className="text-[10px] text-muted-foreground">
              End workspace for <span className="font-bold text-foreground/90">Amina Mwangi</span>
            </p>
          </div>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-destructive">
            Reason (Visible to Solver)
          </p>
          <div className="min-h-14 rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-[10px] text-muted-foreground">
            The solver has not responded to two check-ins. Closing the workspace so the sub-task can
            be reopened.
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <MockButton tone="ghost">Cancel</MockButton>
          <MockButton tone="danger">Confirm Termination</MockButton>
        </div>
      </MockCard>
    </MockShell>
  );
}

export function WorkspaceTree() {
  return (
    <MockShell>
      <MockCard className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1 text-[12px] font-bold text-foreground">
            <GitBranch className="h-3.5 w-3.5 text-primary-foreground" /> Solution tree
          </p>
          <Badge tone="blue">Located attempt</Badge>
        </div>
        <div className="rounded-lg border border-accent bg-accent/10 p-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-primary-foreground">Smart Cold-Chain Monitor</span>
            <Badge tone="green">Approved</Badge>
          </div>
          <p className="text-[9px] text-primary-foreground">Root solution · 3 sub-tasks</p>
        </div>
        <div className="ml-3 space-y-1.5 border-l-2 border-border pl-3">
          {[
            ["Sensor enclosure", "Submitted", "blue"],
            ["Power circuit", "Drafting", "amber"],
            ["Alert engine", "Approved", "green"],
          ].map(([name, status, tone]) => (
            <div key={name} className="flex items-center justify-between rounded-lg border border-border bg-background px-2 py-1.5">
              <span className="text-[10px] font-semibold text-foreground/90">{name}</span>
              <Badge tone={tone as "amber" | "blue" | "green"}>{status}</Badge>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-muted-foreground">
          Locate highlights the exact workspace node and its parent lineage.
        </p>
      </MockCard>
    </MockShell>
  );
}
