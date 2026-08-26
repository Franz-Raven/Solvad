"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerSeeker } from "@/app/(public)/register/api/auth";

export default function AddIndustryPage() {
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (!formData.email || !formData.password || !formData.organizationName || !formData.contactPerson) {
      setError("All fields are required!");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await registerSeeker({
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

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create industry account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/10 via-background to-accent/10 p-4 py-12">
      <div className="w-full max-w-2xl">
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Add Industry Partner
          </h1>
          <p className="text-muted-foreground">
            Create a new account for an industry partner (Seeker)
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
          {/* Success Message */}
          {success && (
            <div className="mb-6 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 text-sm">
              ✓ Industry partner account created successfully!
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Credentials */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                Account Credentials
              </h2>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground"
                  placeholder="industry@company.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground"
                  placeholder="••••••••"
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Must be at least 8 characters with uppercase, lowercase, and special character
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Organization Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                Organization Information
              </h2>
              
              <div>
                <label htmlFor="organizationName" className="block text-sm font-medium text-foreground mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  id="organizationName"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground"
                  placeholder="Company Inc."
                  required
                />
              </div>

              <div>
                <label htmlFor="contactPerson" className="block text-sm font-medium text-foreground mb-2">
                  Contact Person
                </label>
                <input
                  type="text"
                  id="contactPerson"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label htmlFor="contactNumber" className="block text-sm font-medium text-foreground mb-2">
                  Contact Number
                </label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground"
                  placeholder="+63 912 345 6789"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Link
                href="/dashboard"
                className="flex-1 px-6 py-3 border border-border text-foreground font-semibold rounded-lg hover:bg-accent/10 transition-all text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-secondary hover:bg-accent text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating Account..." : "Create Industry Account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
