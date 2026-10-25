"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Target, Puzzle, GitBranch, Network, Sparkles, Search, ArrowLeft } from "lucide-react";
import Step1 from "@/app/(public)/register/components/step1";
import Step2 from "@/app/(public)/register/components/step2";
import Step3 from "@/app/(public)/register/components/step3";
import { registerSolver, verifyEmailCode, resendVerificationCode } from "@/app/(public)/register/api/auth";
import { setAuthCookies, setAuthStorage, getDashboardPath } from "@/lib/auth-utils";

const carouselSlides = [
  {
    title: "Join the Network",
    desc: "Apply your academic skills to solve real-world industry problems and build your professional portfolio.",
    icon1: Target,
    icon2: Puzzle,
    bg: "bg-emerald-600",
    glow: "bg-emerald-400",
  },
  {
    title: "Trace Every Step",
    desc: "Monitor the evolution of your solutions with an immutable, transparent solution tree and version control.",
    icon1: GitBranch,
    icon2: Network,
    bg: "bg-blue-600",
    glow: "bg-blue-400",
  },
  {
    title: "AI-Powered Insights",
    desc: "Leverage intelligent semantic search to detect duplicates and generate comparative gap analyses.",
    icon1: Sparkles,
    icon2: Search,
    bg: "bg-teal-700",
    glow: "bg-teal-500",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [authResponse, setAuthResponse] = useState<any>(null);

  const [step1Data, setStep1Data] = useState({ email: "", password: "", confirmPassword: "" });
  const [step2Data, setStep2Data] = useState({ firstName: "", lastName: "", university: "", course: "", skills: "" });
  const [step3Data, setStep3Data] = useState({ token: "" });

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
  };

  const handleStep1Change = (e: React.ChangeEvent<HTMLInputElement>) => setStep1Data({ ...step1Data, [e.target.name]: e.target.value });
  const handleStep2Change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setStep2Data({ ...step2Data, [e.target.name]: e.target.value });
  const handleStep3Change = (e: React.ChangeEvent<HTMLInputElement>) => setStep3Data({ token: e.target.value.replace(/[^0-9]/g, "") });
  
  const handleUniversityChange = (value: string) => setStep2Data({ ...step2Data, university: value });
  const handleCourseChange = (value: string) => setStep2Data({ ...step2Data, course: value });

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step1Data.password !== step1Data.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError(null);
    setCurrentStep(2);
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

      setAuthResponse(response);
      setCurrentStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResendMessage(null);

    try {
      await verifyEmailCode(step3Data.token);
      setAuthStorage(authResponse);
      setAuthCookies(authResponse.token, authResponse.role);
      router.push(getDashboardPath(authResponse.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setResendMessage(null);
    setError(null);
    try {
      await resendVerificationCode(step1Data.email);
      setResendMessage("Verification code sent to your email.");
    } catch (err) {
      setResendMessage("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const SlideIcon1 = carouselSlides[currentSlide].icon1;
  const SlideIcon2 = carouselSlides[currentSlide].icon2;

  const getStepTitle = () => {
    if (currentStep === 1) return "Create Account";
    if (currentStep === 2) return "Complete Profile";
    return "Verify Email";
  };

  const getStepSubtitle = () => {
    if (currentStep === 1) return "Step 1 of 3: Setup your credentials";
    if (currentStep === 2) return "Step 2 of 3: Tell us about your background";
    return "Step 3 of 3: Verify your email address";
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50 p-4 sm:p-8 relative overflow-hidden">
      
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-emerald-50/50 to-transparent -z-10" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl -z-10" />
      <div className="absolute top-48 -left-24 w-72 h-72 bg-slate-200/40 rounded-full blur-3xl -z-10" />

      <div className="max-w-5xl w-full bg-white rounded-[2rem] shadow-[0_8px_40px_rgba(0,0,0,0.06)] flex flex-col lg:flex-row h-[720px] max-h-[90vh] border border-slate-100 relative z-10 overflow-hidden">

        <div 
          onClick={handleNextSlide}
          className={`hidden lg:flex w-1/2 relative flex-col justify-between p-10 overflow-hidden cursor-pointer group transition-colors duration-1000 ${carouselSlides[currentSlide].bg}`}
        >
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-500 z-20" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:24px_24px] z-0" />
          
          <div className={`absolute -top-24 -left-24 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse transition-colors duration-1000 z-0 ${carouselSlides[currentSlide].glow}`} />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/20 rounded-full mix-blend-overlay filter blur-3xl opacity-40 z-0" />

          <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
            <div key={`icons-${currentSlide}`} className="relative w-40 h-40 flex items-center justify-center animate-in fade-in zoom-in-95 duration-500 transition-transform group-hover:scale-105">
              <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl" />
              <div className="relative bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/20 transform -rotate-6 shadow-xl">
                 <SlideIcon1 className="w-14 h-14 text-white" />
              </div>
              <div className="absolute -bottom-4 -right-3 bg-white/20 p-4 rounded-2xl backdrop-blur-md border border-white/30 transform rotate-12 shadow-lg">
                 <SlideIcon2 className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="relative z-10 text-center h-28 flex flex-col justify-end">
            <div key={`text-${currentSlide}`} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h2 className="text-xl font-bold text-white mb-2 tracking-tight drop-shadow-sm">{carouselSlides[currentSlide].title}</h2>
              <p className="text-white/90 text-xs font-medium max-w-sm mx-auto leading-relaxed">
                {carouselSlides[currentSlide].desc}
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-2 mt-6">
              {carouselSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrentSlide(i); }}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    currentSlide === i ? "w-6 bg-white" : "w-1.5 bg-white/30 hover:bg-white/60"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col bg-white relative overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
          
          <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 py-6">
            <div className="w-full max-w-sm mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
              
              <Link 
                href="/" 
                className={`inline-flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-emerald-600 transition-colors mb-4 group self-start ${currentStep === 3 ? "pointer-events-none opacity-0" : ""}`}
              >
                <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" /> Back to Home
              </Link>

              <div className="mb-5">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mb-1">
                  {getStepTitle()}
                </h1>
                <p className="text-xs font-medium text-slate-500">
                  {getStepSubtitle()}
                </p>
                
                <div className="flex items-center gap-2 mt-3">
                  <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${currentStep >= 1 ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                  <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${currentStep >= 2 ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                  <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${currentStep >= 3 ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 animate-in fade-in zoom-in-95 duration-300">
                  <p className="text-xs font-bold text-rose-800 leading-relaxed">{error}</p>
                </div>
              )}
              
              <div key={currentStep} className={`flex-1 animate-in fade-in duration-300 slide-in-from-right-8`}>
                {currentStep === 1 && (
                  <Step1
                    data={step1Data} onChange={handleStep1Change} onSubmit={handleStep1Submit} isLoading={isLoading}
                    showPassword={showPassword} setShowPassword={setShowPassword}
                    showConfirmPassword={showConfirmPassword} setShowConfirmPassword={setShowConfirmPassword}            
                  />
                )}
                {currentStep === 2 && (
                  <Step2
                    data={step2Data} onChange={handleStep2Change} onSubmit={handleStep2Submit} onBack={() => setCurrentStep(1)}
                    isLoading={isLoading} onUniversityChange={handleUniversityChange} onCourseChange={handleCourseChange}
                  />
                )}
                {currentStep === 3 && (
                  <Step3
                    email={step1Data.email} token={step3Data.token} onChange={handleStep3Change} onSubmit={handleStep3Submit}
                    onResend={handleResendCode} isLoading={isLoading} isResending={isResending} resendMessage={resendMessage}
                  />
                )}
              </div>

              {currentStep !== 3 && (
                <p className="text-center text-xs font-medium text-slate-500 mt-5">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors hover:underline underline-offset-4"
                  >
                    Sign in
                  </Link>
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}