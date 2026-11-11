import { AlertTriangle, Sparkles } from "lucide-react";

import { Badge, Field, MockButton, MockCard, MockShell } from "./shared";

type Values = {
  title?: string;
  context?: string;
  statement?: string;
  objectives?: string;
  constraints?: string;
  program?: string;
};

function Form({ values = {}, errors = false }: { values?: Values; errors?: boolean }) {
  return (
    <MockShell>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[13px] font-bold text-foreground">Submit an Industry Problem</p>
          <p className="text-[10px] text-muted-foreground">Seeker workspace</p>
        </div>
        <Badge tone="green">Draft</Badge>
      </div>
      {errors && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-2 text-[11px] font-semibold text-destructive">
          <AlertTriangle className="h-3.5 w-3.5" />
          Please fill in all required fields before analyzing.
        </div>
      )}
      <MockCard className="space-y-2.5">
        <Field label="Problem Title" value={values.title} error={errors} />
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Background Context" value={values.context} error={errors} />
          <Field label="Preferred Academic Program" value={values.program} error={errors} />
        </div>
        <Field label="Primary Problem Statement" value={values.statement} error={errors} />
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Objectives" value={values.objectives} error={errors} />
          <Field label="Constraints" value={values.constraints} error={errors} />
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="flex items-center gap-1 text-[10px] font-semibold text-primary-foreground">
            <Sparkles className="h-3 w-3" /> AI analysis available
          </span>
          <MockButton>Analyze &amp; Generate Scope</MockButton>
        </div>
      </MockCard>
    </MockShell>
  );
}

export function ProblemFormEmpty() {
  return <Form />;
}

export function ProblemFormFilled() {
  return (
    <Form
      values={{
        title: "Reduce Cold-Chain Spoilage in Rural Clinics",
        context: "District clinics lack reliable temperature monitoring during last-mile delivery.",
        statement: "Design a low-cost monitoring and alert system for vaccine deliveries.",
        objectives: "Cut spoilage by 30% and give staff live temperature alerts.",
        constraints: "Offline-first, under $40 per unit, solar-compatible.",
        program: "Computer Engineering",
      }}
    />
  );
}

export function ProblemValidationError() {
  return <Form errors />;
}

export function ProblemScopePreview() {
  return (
    <MockShell>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[13px] font-bold text-foreground">Review Problem Proposal</p>
          <p className="text-[10px] text-muted-foreground">
            Review your finalized proposal and generated sub-tasks before publishing
          </p>
        </div>
        <Badge tone="blue">Ready</Badge>
      </div>
      <MockCard className="space-y-2">
        <p className="text-[12px] font-bold text-foreground">Smart Vaccine Cold-Chain Monitor</p>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          A solar-friendly sensor that logs temperature and pushes SMS alerts when a delivery
          drifts outside the safe range.
        </p>
        {[
          ["Hardware", "Build the sensor and power circuit"],
          ["Software", "Offline sync and alert engine"],
          ["Data", "Spoilage risk dashboard"],
        ].map(([tag, label]) => (
          <div
            key={tag}
            className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-2.5 py-2"
          >
            <div className="flex items-center gap-2">
              <Badge tone="green">{tag}</Badge>
              <span className="text-[11px] font-semibold text-foreground/90">{label}</span>
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground/70">Editable</span>
          </div>
        ))}
        <div className="flex justify-end gap-2 pt-1">
          <MockButton tone="ghost">Back</MockButton>
          <MockButton>Confirm &amp; Publish</MockButton>
        </div>
      </MockCard>
    </MockShell>
  );
}
