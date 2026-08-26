"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Step1 from "@/app/(public)/register/components/step1";
import Step2 from "@/app/(public)/register/components/step2";
import { registerSolver } from "@/app/(public)/register/api/auth";
import { setAuthCookies, setAuthStorage, getDashboardPath } from "@/lib/auth-utils";

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [step1Data, setStep1Data] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [step2Data, setStep2Data] = useState({
    firstName: "",
    lastName: "",
    university: "",
    course: "",
    skills: "",
  });

  const handleStep1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStep1Data({
      ...step1Data,
      [e.target.name]: e.target.value,
    });
  };

  const handleStep2Change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setStep2Data({
      ...step2Data,
      [e.target.name]: e.target.value,
    });
  };

  const handleUniversityChange = (value: string) => {
    setStep2Data({
      ...step2Data,
      university: value,
    });
  };

  const handleCourseChange = (value: string) => {
    setStep2Data({
      ...step2Data,
      course: value,
    });
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step1Data.password !== step1Data.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep(2);
    }, 500);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await registerSolver({
        email: step1Data.email,
        password: step1Data.password,
        firstName: step2Data.firstName,
        lastName: step2Data.lastName,
        institution: step2Data.university,
        degreeProgram: step2Data.course,
        skills: step2Data.skills.trim() || undefined,
      });

      // Store auth data
      setAuthStorage(response);
      setAuthCookies(response.token, response.role);

      // Redirect to role-specific dashboard
      router.push(getDashboardPath(response.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/10 via-background to-accent/10 p-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary text-white mb-4 shadow-lg shadow-secondary/20">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {currentStep === 1 ? "Create Account" : "Complete Your Profile"}
          </h1>
          <p className="text-muted-foreground">
            {currentStep === 1 ? "Get started with Solvad today" : "Tell us about your academic background"}
          </p>
          
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className={`h-2 w-16 rounded-full transition-all ${currentStep === 1 ? 'bg-secondary' : 'bg-secondary/30'}`} />
            <div className={`h-2 w-16 rounded-full transition-all ${currentStep === 2 ? 'bg-secondary' : 'bg-border'}`} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Step {currentStep} of 2</p>
        </div>

        <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}
          
          {currentStep === 1 ? (
            <Step1
              data={step1Data}
              onChange={handleStep1Change}
              onSubmit={handleStep1Submit}
              isLoading={isLoading}              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showConfirmPassword={showConfirmPassword}
              setShowConfirmPassword={setShowConfirmPassword}            />
          ) : (
            <Step2
              data={step2Data}
              onChange={handleStep2Change}
              onSubmit={handleStep2Submit}
              onBack={() => setCurrentStep(1)}
              isLoading={isLoading}
              onUniversityChange={handleUniversityChange}
              onCourseChange={handleCourseChange}
            />
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-secondary hover:text-accent transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
