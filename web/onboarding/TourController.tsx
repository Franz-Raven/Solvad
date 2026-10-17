"use client";

import { useEffect } from "react";
import { driver, type DriveStep } from "driver.js";
import posthog from "posthog-js";

export const ONBOARDING_TOUR_KEY = "onboarding_tour_done";

type StepConfig = {
  id: string;
  element: string;
  title: string;
  description: string;
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const card = (explains: string, example: string, sample: string) =>
  `<div class="helper-card">
    <p class="helper-function">${esc(explains)}</p>
    <code class="helper-example">e.g. ${esc(example)}</code>
    <p class="helper-sample">${esc(sample)}</p>
  </div>`;

const stepConfigs: StepConfig[] = [
  {
    id: "problem-title",
    element: "[data-helper='problem-title']",
    title: "Give your problem a short, specific title",
    description: card(
      "Used as the submission headline",
      "Optimizing campus shuttle routes",
      "Optimizing campus shuttle routes ✓"
    ),
  },
  {
    id: "background-context",
    element: "[data-helper='background-context']",
    title: "Set the scene with the industry context",
    description: card(
      "Gives solvers the background they need to understand the problem",
      "Our campus shuttle runs fixed routes; riders wait 20+ minutes at peak.",
      "Describes the current situation, stakeholders, and why it needs solving ✓"
    ),
  },
  {
    id: "primary-statement",
    element: "[data-helper='primary-statement']",
    title: "State the core problem in one clear paragraph",
    description: card(
      "Defines exactly what needs to be solved",
      "Students cannot find free study rooms during finals week.",
      "One specific, unambiguous problem statement ✓"
    ),
  },
  {
    id: "objectives",
    element: "[data-helper='objectives']",
    title: "List the outcomes you want to achieve",
    description: card(
      "Tells solvers what success looks like",
      "Reduce average shuttle wait time to under 10 minutes",
      "Measurable, achievable objectives ✓"
    ),
  },
  {
    id: "constraints",
    element: "[data-helper='constraints']",
    title: "Note budget, timeline, and technical limits",
    description: card(
      "Sets the boundaries the solution must respect",
      "Must launch within one semester; no hardware purchases",
      "Realistic constraints solvers can design around ✓"
    ),
  },
  {
    id: "preferred-program",
    element: "[data-helper='preferred-program']",
    title: "Pick the academic program best suited to solve this",
    description: card(
      "Routes your problem to the right department",
      "Information Technology",
      "A program matching the problem's domain ✓"
    ),
  },
];

const tourSteps: DriveStep[] = stepConfigs.map(({ element, title, description }) => ({
  element,
  popover: { title, description },
}));

type Props = { onComplete?: () => void };

export function TourController({ onComplete }: Props) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(ONBOARDING_TOUR_KEY) === "1") return;

    if (process.env.NODE_ENV === "development") {
      for (const s of stepConfigs) {
        if (!document.querySelector(s.element)) {
          console.warn(`[onboarding] no match for "${s.id}": ${s.element}`);
        }
      }
    }

    posthog.capture("onboarding_tour_started", { total_steps: tourSteps.length });

    const driverObj = driver({
      showProgress: true,
      progressText: "{{current}} of {{total}}",
      allowClose: true,
      overlayClickBehavior: "none",
      smoothScroll: true,
      stagePadding: 6,
      stageRadius: 8,
      overlayColor: "rgba(0,0,0,0.5)",
      nextBtnText: "Next →",
      prevBtnText: "Back",
      doneBtnText: "Done",
      steps: tourSteps,
      onHighlightStarted: (...args) => {
        const { state } = args[2];
        const index = state.activeIndex ?? 0;
        const cfg = stepConfigs[index];
        if (cfg) posthog.capture("onboarding_step_view", { step: cfg.id, index });
      },
      onNextClick: (...args) => {
        const { driver: d, state } = args[2];
        const index = state.activeIndex ?? 0;
        const cfg = stepConfigs[index];
        if (cfg) posthog.capture("onboarding_step_completed", { step: cfg.id, index });
        d.moveNext();
      },
      onDestroyed: () => {
        localStorage.setItem(ONBOARDING_TOUR_KEY, "1");
        posthog.capture("onboarding_tour_completed", { total_steps: tourSteps.length });
        onComplete?.();
      },
    });

    driverObj.drive();
    return () => driverObj.destroy();
  }, [onComplete]);

  return null;
}
