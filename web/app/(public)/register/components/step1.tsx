"use client";

import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { useMemo } from "react";

interface Step1Props {
  data: { email: string; password: string; confirmPassword: string };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (value: boolean) => void;
}

const passwordRequirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Contains uppercase & lowercase", test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: "Includes special character", test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export default function Step1({ 
  data, onChange, onSubmit, isLoading, showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword 
}: Step1Props) {
  
  const passwordValidation = useMemo(() => {
    return passwordRequirements.map((req) => ({ label: req.label, met: req.test(data.password) }));
  }, [data.password]);

  const isPasswordValid = passwordValidation.every((req) => req.met);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid || data.password !== data.confirmPassword) return;
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">
          Email Address
        </label>
        <input
          id="email" name="email" type="email"
          value={data.email} onChange={onChange}
          className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
          placeholder="e.g., student@university.edu" required
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">
          Password
        </label>
        <div className="relative">
          <input
            id="password" name="password" type={showPassword ? "text" : "password"}
            value={data.password} onChange={onChange}
            className="w-full px-4 py-3.5 pr-12 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
            placeholder="••••••••" required
          />
          <button
            type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        
        {data.password && (
          <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Password Requirements:</p>
            <div className="space-y-2">
              {passwordValidation.map((req, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${req.met ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-400"}`}>
                    {req.met ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className={`text-xs font-medium transition-colors ${req.met ? "text-emerald-700" : "text-slate-500"}`}>{req.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">
          Confirm Password
        </label>
        <div className="relative">
          <input
            id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"}
            value={data.confirmPassword} onChange={onChange}
            className={`w-full px-4 py-3.5 pr-12 bg-slate-50/50 border rounded-xl focus:outline-none focus:ring-4 transition-all text-slate-900 placeholder:text-slate-400 font-medium ${data.confirmPassword && data.password !== data.confirmPassword ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" : "border-slate-200 focus:ring-emerald-500/10 focus:border-emerald-500"}`}
            placeholder="••••••••" required
          />
          <button
            type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {data.confirmPassword && data.password !== data.confirmPassword && (
          <p className="text-xs font-bold text-rose-600 mt-1.5 pl-1">Passwords do not match</p>
        )}
      </div>

      {/* 🚀 FIX: Removed black background, replaced with emerald theme */}
      <button
        type="submit"
        disabled={isLoading || !isPasswordValid || data.password !== data.confirmPassword}
        className="w-full px-6 py-4 mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full transition-all shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center cursor-pointer"
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue to Next Step"}
      </button>
    </form>
  );
}