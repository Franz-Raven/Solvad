"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, AlertCircle, Building2, Lock, Eye, EyeOff, Check, X } from "lucide-react";
import { registerSeeker } from "../api/add";

const passwordRequirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Contains uppercase & lowercase", test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: "Includes special character", test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export function IndustryFormHeader() {
  return (
    <div className="text-center mb-10 animate-in slide-in-from-bottom-4 duration-500 fade-in">
    </div>
  );
}

export default function AddIndustryForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    organizationName: "",
    contactPerson: "",
    contactNumber: "",
  });

  const passwordValidation = useMemo(() => {
    return passwordRequirements.map((req) => ({ label: req.label, met: req.test(formData.password) }));
  }, [formData.password]);

  const isPasswordValid = passwordValidation.every((req) => req.met);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!isPasswordValid) {
      setError("Please ensure all password requirements are met.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    
    try {
      await registerSeeker({
        email: formData.email,
        password: formData.password,
        organizationName: formData.organizationName,
        contactPerson: formData.contactPerson,
        contactNumber: formData.contactNumber || undefined,
      });
      
      setSuccess(true);
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        organizationName: "",
        contactPerson: "",
        contactNumber: "",
      });

      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      
      <IndustryFormHeader />

      <div className="bg-white rounded-[2rem] shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-slate-100 p-8 sm:p-12">
        {success && (
          <div className="mb-8 p-5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-emerald-100 p-2 rounded-xl shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-base font-bold text-emerald-900 tracking-tight">Account Created Successfully</h4>
              <p className="text-sm font-medium text-emerald-700 mt-1 leading-relaxed">The industry partner can now securely log into the platform using these credentials.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 p-5 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-rose-100 p-2 rounded-xl shrink-0">
              <AlertCircle className="w-6 h-6 text-rose-600" />
            </div>
            <div className="pt-1">
              <p className="text-sm font-bold text-rose-800 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          
          {/* ── Account Credentials Section ── */}
          <div className="space-y-6">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" /> Account Credentials
            </h2>
            
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                placeholder="industry@company.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 pr-12 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Dynamic Password Validation Box */}
              {formData.password && (
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
              <label htmlFor="confirmPassword" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-3.5 pr-12 bg-slate-50/50 border rounded-xl focus:outline-none focus:ring-4 transition-all text-slate-900 placeholder:text-slate-400 font-medium ${formData.confirmPassword && formData.password !== formData.confirmPassword ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" : "border-slate-200 focus:ring-emerald-500/10 focus:border-emerald-500"}`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs font-bold text-rose-600 mt-1.5 pl-1">Passwords do not match</p>
              )}
            </div>
          </div>

          {/* ── Organization Information Section ── */}
          <div className="space-y-6 pt-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" /> Organization Profile
            </h2>
            
            <div className="space-y-1.5">
              <label htmlFor="organizationName" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Organization Name</label>
              <input
                type="text"
                id="organizationName"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                placeholder="E.g., Global Tech Innovations"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label htmlFor="contactPerson" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Primary Contact Person</label>
                <input
                  type="text"
                  id="contactPerson"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="contactNumber" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Contact Number <span className="normal-case tracking-normal">(Optional)</span></label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                  placeholder="+63 912 345 6789"
                />
              </div>
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex flex-col-reverse sm:flex-row gap-4 pt-8 border-t border-slate-100">
            <Link
              href="/admin/dashboard"
              className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-full transition-all hover:bg-slate-50 active:scale-[0.98] cursor-pointer shadow-sm text-center flex items-center justify-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading || !isPasswordValid || formData.password !== formData.confirmPassword}
              className="flex-1 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full transition-all shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center cursor-pointer gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Industry Account"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}