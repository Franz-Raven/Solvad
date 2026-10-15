"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Target, Puzzle, GitBranch, Network, Sparkles, Search, ArrowLeft } from "lucide-react";
import { LoginForm } from "./components/LoginForm";
import { SocialLogin } from "./components/SocialLogin";

const carouselSlides = [
  {
    title: "Bridge the Gap",
    desc: "Connect with industry partners, tackle real-world challenges, and build impactful solutions for the future.",
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
    bg: "bg-slate-800",
    glow: "bg-slate-500",
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

export default function LoginPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
  };

  const SlideIcon1 = carouselSlides[currentSlide].icon1;
  const SlideIcon2 = carouselSlides[currentSlide].icon2;

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50 p-4 sm:p-8 relative overflow-hidden">
      
      {/* Background Decorators */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-emerald-50/50 to-transparent -z-10" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl -z-10" />
      <div className="absolute top-48 -left-24 w-72 h-72 bg-slate-200/40 rounded-full blur-3xl -z-10" />

      {/* Main Container - Balanced height constraint to completely avoid inner page scrolling */}
      <div className="max-w-5xl w-full bg-white rounded-[2rem] shadow-[0_8px_40px_rgba(0,0,0,0.06)] flex flex-col lg:flex-row h-[720px] max-h-[90vh] border border-slate-100 relative z-10 overflow-hidden">

        {/* ── Left Side: Interactive Dynamic Branding Panel ── */}
        <div 
          onClick={handleNextSlide}
          className={`hidden lg:flex w-1/2 relative flex-col justify-between p-10 overflow-hidden cursor-pointer group transition-colors duration-1000 ${carouselSlides[currentSlide].bg}`}
        >
          {/* Subtle Interaction Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 z-20" />

          {/* Premium Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:24px_24px] z-0" />

          {/* Dynamic Glowing Orbs */}
          <div className={`absolute -top-24 -left-24 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse transition-colors duration-1000 z-0 ${carouselSlides[currentSlide].glow}`} />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-slate-900/40 rounded-full mix-blend-multiply filter blur-3xl opacity-30 z-0" />

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

        {/* ── Right Side: Login Form ── */}
        <div className="w-full lg:w-1/2 flex flex-col bg-white relative">
          
          {/* Optimized padding to keep everything completely visible without scrolling */}
          <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 py-8">
            <div className="w-full max-w-sm mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
              
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-emerald-600 transition-colors mb-6 group self-start"
              >
                <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" /> Back to Home
              </Link>

              <div className="text-left mb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Welcome Back</h1>
                <p className="text-xs font-medium text-slate-500">Sign in to access your dashboard</p>
              </div>

              <LoginForm />
              <SocialLogin />

              <p className="text-center text-xs font-medium text-slate-500 mt-6">
                New to Solvad?{" "}
                <Link
                  href="/register"
                  className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors hover:underline underline-offset-4"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}