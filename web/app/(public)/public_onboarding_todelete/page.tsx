"use client";

import { useState } from "react";
import ProblemFormFields from "@/app/(authed)/seeker/submit-problem/components/ProblemFormFields";
import { TourController, ONBOARDING_TOUR_KEY } from "@/onboarding/TourController";

export default function PublicOnboardingTestPage() {
  const [formData, setFormData] = useState({
    title: "",
    backgroundContext: "",
    primaryStatement: "",
    objectives: "",
    constraints: "",
    preferredProgram: "",
  });

  const [tourKey, setTourKey] = useState(0);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProgramChange = (value: string) => {
    setFormData((prev) => ({ ...prev, preferredProgram: value }));
  };

  const restartTour = () => {
    localStorage.removeItem(ONBOARDING_TOUR_KEY);
    setTourKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/10 via-background to-accent/10 p-4 py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center mb-6">
          <button
            onClick={restartTour}
            className="px-6 py-3 text-sm font-semibold rounded-lg bg-accent hover:bg-secondary text-white shadow-md hover:shadow-lg transition-all"
          >
            Activate Guide
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Onboarding Tour Test (public)
          </h1>
          <p className="text-muted-foreground">
            Temporary public clone of the submission form. Safe to delete.
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <ProblemFormFields
              formData={formData}
              validationErrors={{}}
              onInputChange={handleInputChange}
              onProgramChange={handleProgramChange}
            />
          </form>
        </div>

        <TourController key={tourKey} />
      </div>
    </div>
  );
}
