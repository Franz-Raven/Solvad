"use client";

import { useSyncExternalStore } from "react";
import { ACTIONS, EVENTS, Joyride, STATUS, type EventData, type Step } from "react-joyride";

import { onboardingClient } from "@/lib/onboarding/client";
import { FLOW_SETS } from "@/lib/tutorial/flows";
import { tutorial, tutorialFlowIds, tutorialStepCount, tutorialTargetProps } from "@/lib/tutorial/tutorial";

export function TutorialHost() {
  const snap = useSyncExternalStore(tutorial.subscribe, tutorial.getSnapshot, tutorial.getSnapshot);

  if (!snap.active) return null;

  const flows = FLOW_SETS[snap.group];
  const flowIds = tutorialFlowIds(snap.group);
  const total = tutorialStepCount(snap.group);

  const stop = () => {
    tutorial.stop();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finish = () => {
    tutorial.stop();
    flowIds.forEach((flowId) => {
      onboardingClient.completeFlow(flowId).catch(() => {});
    });
  };

  const steps: Step[] = flowIds.flatMap((flowId) =>
    flows[flowId].map((step) => ({
      target: () =>
        document.querySelector<HTMLElement>(step.target) ?? document.getElementById("tutorial-origin"),
      content: (
        <div className="text-left">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-secondary">
            {step.tab}
          </p>
          <h3 className="text-base font-bold text-foreground">{step.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          {step.render?.()}
        </div>
      ),
      placement: "auto",
      skipBeacon: true,
      data: { flowId },
    })),
  );

  const handleEvent = (data: EventData) => {
    if (!tutorial.getSnapshot().active) return;

    if (data.type === EVENTS.STEP_AFTER) {
      if (data.action === ACTIONS.NEXT) {
        if (data.index >= total - 1) finish();
        else tutorial.next();
      } else if (data.action === ACTIONS.PREV) {
        tutorial.back();
      } else {
        stop();
      }

      return;
    }

    if (data.type === EVENTS.TOUR_END) {
      if (data.status === STATUS.FINISHED) finish();
      else stop();
    }
  };

  const targetProps = tutorialTargetProps(true).targetProps;

  return (
    <>
      <div
        id="tutorial-origin"
        style={{ ...targetProps, height: 1, pointerEvents: "none", width: 1 }}
      />
      <Joyride
        continuous
        locale={{ back: "Back", close: "Close", last: "Finish", next: "Next", skip: "Stop" }}
        onEvent={handleEvent}
        options={{
          backgroundColor: "var(--background)",
          buttons: ["back", "close", "primary", "skip"],
          overlayColor: "rgba(15, 23, 42, 0.55)",
          primaryColor: "var(--secondary)",
          showProgress: true,
          spotlightRadius: 12,
          textColor: "var(--foreground)",
          zIndex: 60,
        }}
        run
        scrollToFirstStep={false}
        stepIndex={snap.stepIndex}
        steps={steps}
        styles={{
          tooltip: { borderRadius: 16, maxWidth: 560, padding: 20 },
          tooltipContainer: { textAlign: "left" },
          tooltipContent: { padding: 0 },
          tooltipFooter: { marginTop: 12 },
        }}
      />
    </>
  );
}
