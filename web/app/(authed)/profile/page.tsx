"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle2, Mail, Settings2, Shield, User2, Loader2 } from "lucide-react";

import { getMyProfile as getSeekerProfile, updateMyProfile as updateSeekerProfile } from "./api/seeker";
import { getMyProfile as getSolverProfile, updateMyProfile as updateSolverProfile } from "./api/solver";
import { uploadProfilePicture } from "./api/user";

import { ProfileSidebar } from "./components/ProfileSidebar";
import { SeekerProfileForm } from "./components/SeekerProfileForm";
import { SolverProfileForm } from "./components/SolverProfileForm";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "settings">("profile");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [seekerData, setSeekerData] = useState({ organizationName: "", contactPerson: "", contactNumber: "" });
  const [solverData, setSolverData] = useState({ firstName: "", lastName: "", institution: "", degreeProgram: "", skills: "" });

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (user?.role === "SEEKER") {
        const profile = await getSeekerProfile();
        setSeekerData({
          organizationName: profile.organizationName,
          contactPerson: profile.contactPerson,
          contactNumber: profile.contactNumber || "",
        });
      } else if (user?.role === "SOLVER") {
        const profile = await getSolverProfile();
        setSolverData({
          firstName: profile.firstName,
          lastName: profile.lastName,
          institution: profile.institution,
          degreeProgram: profile.degreeProgram,
          skills: profile.skills || "",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      if (user.role === "SEEKER") {
        await updateSeekerProfile({
          organizationName: seekerData.organizationName,
          contactPerson: seekerData.contactPerson,
          contactNumber: seekerData.contactNumber || undefined,
        });
        setUser({ ...user, organizationName: seekerData.organizationName });
      } else if (user.role === "SOLVER") {
        await updateSolverProfile({
          firstName: solverData.firstName,
          lastName: solverData.lastName,
          institution: solverData.institution,
          degreeProgram: solverData.degreeProgram,
          skills: solverData.skills || undefined,
        });
        setUser({ ...user, firstName: solverData.firstName, lastName: solverData.lastName, institution: solverData.institution, degreeProgram: solverData.degreeProgram });
      }

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) return setError("Please select an image file");
    if (file.size > 5 * 1024 * 1024) return setError("Image size should be less than 5MB");

    setIsUploadingImage(true);
    setError(null);

    try {
      const response = await uploadProfilePicture(file);
      setUser({ ...user, profileUrl: response.profileUrl });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload profile picture");
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 relative overflow-hidden">
      {/* ── Background Decorators ── */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-3xl -z-10" />
      <div className="absolute top-48 -left-24 w-72 h-72 bg-slate-200/40 rounded-full blur-3xl -z-10" />

      <div className="mx-auto max-w-6xl px-4 relative z-10 animate-in fade-in duration-500">
        
        {/* ── Header ── */}
        <div className="mb-8 flex flex-col gap-2 items-start">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-emerald-600 transition-colors group cursor-pointer outline-none"
          >
            <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" /> Back
          </button>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-2">Account Profile</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          
          <ProfileSidebar 
            user={user} 
            solverData={solverData} 
            seekerData={seekerData} 
            isUploadingImage={isUploadingImage} 
            fileInputRef={fileInputRef} 
            onUploadPicture={handleProfilePictureUpload} 
          />

          {/* ── Main Content Area ── */}
          <div className="overflow-visible rounded-[2rem] border border-slate-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 delay-100 fill-mode-both">
            
            {/* ── Tabs Navigation ── */}
            <div className="border-b border-slate-100 bg-slate-50/80 p-2 shrink-0 rounded-t-[2rem]">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer outline-none ${
                    activeTab === "profile" 
                      ? "bg-white text-emerald-700 shadow-sm border border-slate-200" 
                      : "text-slate-400 hover:bg-slate-100/50 hover:text-slate-600 border border-transparent"
                  }`}
                >
                  <User2 className="h-4 w-4" /> Profile Details
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer outline-none ${
                    activeTab === "settings" 
                      ? "bg-white text-emerald-700 shadow-sm border border-slate-200" 
                      : "text-slate-400 hover:bg-slate-100/50 hover:text-slate-600 border border-transparent"
                  }`}
                >
                  <Settings2 className="h-4 w-4" /> Account Settings
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 flex-1 overflow-visible">
              
              {/* ── Status Alerts ── */}
              {success && (
                <div className="mb-8 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 animate-in fade-in zoom-in-95 duration-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-emerald-800 leading-relaxed">Profile updated successfully.</p>
                </div>
              )}

              {error && (
                <div className="mb-8 p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 animate-in fade-in zoom-in-95 duration-300">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-rose-800 leading-relaxed">{error}</p>
                </div>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : (
                <>
                  {activeTab === "profile" && (
                    <div className="space-y-6">
                      
                      {/* ── Generic Account Info ── */}
                      <div className="rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                        <div className="mb-8 flex items-center gap-4">
                          {/* 🚀 REMOVED BLACK COLOR: Changed to emerald theme */}
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-sm shrink-0">
                            <Shield className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Account Identity</h3>
                            <p className="text-sm font-medium text-slate-500">Read-only information tied to your login.</p>
                          </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                              <Mail className="h-3.5 w-3.5 text-slate-400" /> Email
                            </label>
                            <input 
                              type="email" 
                              value={user.email || ""} 
                              disabled 
                              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 font-medium opacity-80 cursor-not-allowed" 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                              <Shield className="h-3.5 w-3.5 text-slate-400" /> Role
                            </label>
                            <input 
                              type="text" 
                              value={user.role === "SOLVER" ? "Solver" : "Seeker"} 
                              disabled 
                              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 font-medium opacity-80 cursor-not-allowed" 
                            />
                          </div>
                        </div>
                      </div>

                      {/* ── Extracted Forms ── */}
                      {user.role === "SEEKER" && (
                        <SeekerProfileForm 
                          data={seekerData} 
                          onChange={(field, value) => setSeekerData(prev => ({ ...prev, [field]: value }))} 
                        />
                      )}
                      
                      {user.role === "SOLVER" && (
                        <SolverProfileForm 
                          data={solverData} 
                          onChange={(field, value) => setSolverData(prev => ({ ...prev, [field]: value }))} 
                        />
                      )}
                    </div>
                  )}

                  {/* ── Settings Tab Placeholder ── */}
                  {activeTab === "settings" && (
                    <div className="rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center animate-in fade-in zoom-in-95 duration-300">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm border border-slate-100 mb-5">
                        <Settings2 className="h-6 w-6" />
                      </div>
                      <h2 className="text-lg font-bold text-slate-900">Settings are staying light for now</h2>
                      <p className="mt-2 text-sm font-medium text-slate-500 max-w-md mx-auto">
                        More account controls can live here later, but the essential profile editing tools are already available in the details tab.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Footer Actions ── */}
            {activeTab === "profile" && (
              <div className="flex flex-col-reverse sm:flex-row gap-3 border-t border-slate-100 bg-slate-50/50 p-6 sm:px-8 shrink-0 rounded-b-[2rem]">
                <button
                  onClick={() => router.back()}
                  className="px-6 py-3.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-full transition-all hover:bg-slate-50 active:scale-[0.98] cursor-pointer shadow-sm sm:w-auto w-full text-center"
                >
                  Cancel
                </button>
                <div className="flex-1" />
                <button
                  onClick={handleSave}
                  disabled={isSaving || isLoading}
                  className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full transition-all shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer sm:w-auto w-full"
                >
                  {isSaving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5" />
                  )}
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}