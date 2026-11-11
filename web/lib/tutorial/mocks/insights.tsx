import { AlertTriangle, CheckCircle2, ScanSearch } from "lucide-react";

import { Badge, MockButton, MockCard, MockShell } from "./shared";

export function InsightsDuplicates() {
  return (
    <MockShell>
      <MockCard className="space-y-2.5">
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-[11px] font-bold text-foreground">Similar Problems Detected</p>
            <p className="text-[9px] text-muted-foreground">
              1 historical project with ≥60% semantic similarity.
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-border p-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-foreground">Cold-Chain Vaccine Delivery Monitor</p>
            <span className="text-[9px] font-bold text-amber-700">2023 capstone</span>
          </div>
          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
            Shared objectives: reduce spoilage, low-cost hardware, SMS alerts. Shared constraints:
            solar power, offline-first.
          </p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-amber-700">
            82% semantic similarity
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <MockButton>
            <ScanSearch className="mr-1 h-3 w-3" /> View Gap Analysis
          </MockButton>
        </div>
      </MockCard>
    </MockShell>
  );
}

export function InsightsGap() {
  return (
    <MockShell>
      <MockCard className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-bold text-foreground">Gap Analysis</p>
          <Badge tone="blue">Side by side</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border bg-muted/40 p-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Already covered
            </p>
            {["Temperature logging", "SMS alerts", "Solar power"].map((item) => (
              <p key={item} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-muted-foreground/70" /> {item}
              </p>
            ))}
          </div>
          <div className="rounded-lg border border-accent/30 bg-accent/10 p-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-secondary">
              Your additions
            </p>
            {["Spoilage risk scoring", "Clinic stock dashboard", "Offline reconciliation"].map(
              (item) => (
                <p key={item} className="flex items-center gap-1 text-[10px] text-primary-foreground">
                  <CheckCircle2 className="h-3 w-3 text-secondary" /> {item}
                </p>
              ),
            )}
          </div>
        </div>
        <p className="text-[9px] text-muted-foreground">
          A meaningful difference from the archive is enough to proceed.
        </p>
      </MockCard>
    </MockShell>
  );
}

export function InsightsUnique() {
  return (
    <MockShell>
      <MockCard className="flex flex-col items-center gap-2 py-6 text-center">
        <CheckCircle2 className="h-9 w-9 text-accent" />
        <p className="text-[12px] font-bold text-foreground">Verified Unique</p>
        <p className="max-w-64 text-[10px] leading-relaxed text-muted-foreground">
          No highly similar problems found in the repository. This appears to be an original
          problem statement.
        </p>
      </MockCard>
    </MockShell>
  );
}
