"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { registerSeeker } from "../api/add";

export default function AddIndustryForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    organizationName: "",
    contactPerson: "",
    contactNumber: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

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
    <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 p-8 animate-in fade-in duration-500 delay-150 fill-mode-both">
      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-emerald-800">Account Created Successfully</h4>
            <p className="text-sm text-emerald-600 mt-1">The industry partner can now log in using these credentials.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-rose-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Account Credentials Section */}
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
            Account Credentials
          </h2>
          
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-slate-900 placeholder:text-slate-400 font-medium"
              placeholder="industry@company.com"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                placeholder="••••••••"
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-700 mb-2">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-400">
            Must be at least 8 characters with uppercase, lowercase, and a special character.
          </p>
        </div>

        {/* Organization Information Section */}
        <div className="space-y-5 pt-2">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
            Organization Profile
          </h2>
          
          <div>
            <label htmlFor="organizationName" className="block text-sm font-bold text-slate-700 mb-2">Organization Name</label>
            <input
              type="text"
              id="organizationName"
              name="organizationName"
              value={formData.organizationName}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-slate-900 placeholder:text-slate-400 font-medium"
              placeholder="E.g., Global Tech Innovations"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="contactPerson" className="block text-sm font-bold text-slate-700 mb-2">Primary Contact Person</label>
              <input
                type="text"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label htmlFor="contactNumber" className="block text-sm font-bold text-slate-700 mb-2">Contact Number <span className="text-slate-400 font-normal">(Optional)</span></label>
              <input
                type="tel"
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                placeholder="+63 912 345 6789"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t border-slate-100">
          <Link
            href="/admin/dashboard"
            className="flex-1 px-6 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
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
  );
}