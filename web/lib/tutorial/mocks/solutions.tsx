import { CheckCircle2, ClipboardCheck, FileText, Paperclip } from "lucide-react";

import { Avatar, Badge, MockButton, MockCard, MockShell } from "./shared";

export function SolutionsEmpty() {
  return (
    <MockShell>
      <MockCard className="flex flex-col items-center gap-2 py-8 text-center">
        <CheckCircle2 className="h-8 w-8 text-accent/50" />
        <p className="text-[12px] font-bold text-foreground/90">Nothing waiting for review</p>
        <p className="max-w-60 text-[10px] text-muted-foreground">
          Submitted solutions land here. When the queue is empty, you are all caught up.
        </p>
      </MockCard>
    </MockShell>
  );
}

export function SolutionsSubtasks() {
  return (
    <MockShell>
      <div className="grid grid-cols-[110px_1fr] gap-2">
        <MockCard className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            Filter by Sub-problem
          </p>
          <div className="rounded-lg bg-accent/10 px-2 py-1.5 text-[10px] font-bold text-primary-foreground">
            All Pending Solutions <span className="float-right">1</span>
          </div>
          {[
            ["Hardware", "1 Pending", "1 / 3 Active", true],
            ["Software", "0 Pending", "0 / 3 Active", false],
            ["Data", "0 Pending", "0 / 3 Active", false],
          ].map(([name, count, capacity, active]) => (
            <div
              key={name as string}
              className={`flex justify-between rounded-lg px-2 py-1.5 text-[10px] font-bold ${
                active ? "bg-accent/10 text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              <span>{name}</span>
              <span className="text-right">
                {count}
                <span className="block text-[8px] font-semibold text-muted-foreground">
                  {capacity}
                </span>
              </span>
            </div>
          ))}
        </MockCard>
        <MockCard className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-bold text-foreground">Showing All Solutions (1)</p>
            <Badge tone="amber">1 Pending</Badge>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5">
            <Avatar initials="TN" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-foreground/90">Tina Njeri</p>
              <p className="text-[10px] text-muted-foreground">
                Sensor enclosure · submitted 2h ago
              </p>
            </div>
            <MockButton tone="ghost">Review</MockButton>
          </div>
          <p className="text-[9px] text-muted-foreground">
            Filter by sub-task to keep reviews focused and counts accurate.
          </p>
        </MockCard>
      </div>
    </MockShell>
  );
}

export function SolutionOpen() {
  return (
    <MockShell>
      <MockCard className="space-y-2.5">
        <div className="flex items-center gap-2">
          <Avatar initials="TN" />
          <div className="flex-1">
            <p className="text-[12px] font-bold text-foreground">Tina Njeri&apos;s Solution</p>
            <p className="text-[10px] text-muted-foreground">Sub-Problem: Sensor enclosure</p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-muted/40 p-2">
          <p className="mb-1 flex items-center gap-1 text-[10px] font-bold text-foreground/90">
            <FileText className="h-3 w-3" /> Final Solution Description
          </p>
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            Snap-fit IP65 enclosure printed in PETG with a foam sensor cradle, tested for a 1.2 m
            drop and 48-hour field deployment.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/40 p-2">
          <p className="mb-1 flex items-center gap-1 text-[10px] font-bold text-foreground/90">
            <Paperclip className="h-3 w-3" /> Attachments
          </p>
          <p className="text-[10px] text-muted-foreground">enclosure-v3.stl · test-report.pdf</p>
        </div>
        <div className="flex justify-end gap-2">
          <MockButton tone="ghost">Reject Solution</MockButton>
          <MockButton>
            <ClipboardCheck className="mr-1 h-3 w-3" /> Approve Solution
          </MockButton>
        </div>
      </MockCard>
    </MockShell>
  );
}
