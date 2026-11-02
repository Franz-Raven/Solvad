import { Clock3, Inbox, ShieldCheck } from "lucide-react";

import { Avatar, Badge, MockButton, MockCard, MockShell } from "./shared";

export function ProposalsEmpty() {
  return (
    <MockShell>
      <MockCard className="flex flex-col items-center gap-2 py-8 text-center">
        <Inbox className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-[12px] font-bold text-foreground/90">No pending proposals</p>
        <p className="max-w-60 text-[10px] text-muted-foreground">
          Requests appear here when solvers submit an approach to a sub-problem.
        </p>
      </MockCard>
    </MockShell>
  );
}

export function ProposalsList() {
  return (
    <MockShell>
      <div className="grid grid-cols-[110px_1fr] gap-2">
        <MockCard className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Filters</p>
          <div className="rounded-lg bg-accent/10 px-2 py-1.5 text-[10px] font-bold text-primary-foreground">
            All pending <span className="float-right">3</span>
          </div>
          {[
            ["Hardware", "2"],
            ["Software", "1"],
            ["Data", "0"],
          ].map(([name, count]) => (
            <div key={name} className="flex justify-between px-2 text-[10px] font-semibold text-muted-foreground">
              <span>{name}</span>
              <span>{count}</span>
            </div>
          ))}
        </MockCard>
        <MockCard className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-bold text-foreground">Hardware · 2 requests</p>
            <Badge tone="amber">2/3 capacity</Badge>
          </div>
          {[
            ["AM", "Amina Mwangi", "Sensor enclosure", "Pending"],
            ["JK", "Joseph Kariuki", "Power circuit", "Pending"],
          ].map(([initials, name, subtask, status]) => (
            <div key={name} className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5">
              <Avatar initials={initials} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-bold text-foreground/90">{name}</p>
                <p className="text-[10px] text-muted-foreground">{subtask}</p>
              </div>
              <Badge tone="amber">{status}</Badge>
              <MockButton tone="ghost">Review</MockButton>
            </div>
          ))}
        </MockCard>
      </div>
    </MockShell>
  );
}

export function ProposalApprove() {
  return (
    <MockShell>
      <MockCard className="space-y-2.5">
        <div className="flex items-center gap-2">
          <Avatar initials="AM" />
          <div className="flex-1">
            <p className="text-[12px] font-bold text-foreground">Amina Mwangi</p>
            <p className="text-[10px] text-muted-foreground">Hardware · Sensor enclosure</p>
          </div>
          <Badge tone="green">Proposal</Badge>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            ["Solver Tier", "Gold"],
            ["Completed", "12"],
            ["Reliability", "96%"],
            ["Turnaround", "1.8d"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-muted/40 py-1.5">
              <p className="text-[12px] font-bold text-foreground">{value}</p>
              <p className="text-[8px] uppercase tracking-wider text-muted-foreground/70">{label}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-muted/40 p-2 text-[10px] leading-relaxed text-muted-foreground">
          <p className="mb-1 flex items-center gap-1 font-bold text-foreground/90">
            <ShieldCheck className="h-3 w-3 text-secondary" /> Proposed approach
          </p>
          I will use a sealed IP65 enclosure with a printed sensor cradle and a snap-fit lid for
          fast field assembly.
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
            <Clock3 className="h-3 w-3" /> Creates workspace on approval
          </span>
          <div className="flex gap-2">
            <MockButton tone="ghost">Reject</MockButton>
            <MockButton>Approve &amp; Create Workspace</MockButton>
          </div>
        </div>
      </MockCard>
    </MockShell>
  );
}

export function ProposalReject() {
  return (
    <MockShell>
      <MockCard className="space-y-2.5">
        <div className="flex items-center gap-2">
          <Avatar initials="JK" />
          <div className="flex-1">
            <p className="text-[12px] font-bold text-foreground">Joseph Kariuki</p>
            <p className="text-[10px] text-muted-foreground">Hardware · Power circuit</p>
          </div>
          <Badge tone="rose">Rejecting</Badge>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-foreground">Reason for Rejection</p>
            <span className="text-[9px] font-bold uppercase tracking-wider text-destructive">
              Required
            </span>
          </div>
          <div className="mt-1 min-h-14 rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-[10px] text-muted-foreground">
            The proposed regulator is over the $40 unit budget. Please revise the power design and
            resubmit.
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <MockButton tone="ghost">Cancel</MockButton>
          <MockButton tone="danger">Confirm Reject</MockButton>
        </div>
      </MockCard>
    </MockShell>
  );
}
