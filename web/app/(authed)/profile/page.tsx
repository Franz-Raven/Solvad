"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle2, Mail, Settings2, Shield, User2 } from "lucide-react";

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
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
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

  // 🚀 FIX: Return a proper full-screen JSX loader instead of `null`
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 py-8 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent/20 border-b-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Profile</h1>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          
          {/* Extracted Sidebar Component */}
          <ProfileSidebar 
            user={user} 
            solverData={solverData} 
            seekerData={seekerData} 
            isUploadingImage={isUploadingImage} 
            fileInputRef={fileInputRef} 
            onUploadPicture={handleProfilePictureUpload} 
          />

          {/* Main Content Area */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col">
            
            {/* Tabs Navigation */}
            <div className="border-b border-slate-200 px-4 pt-4 sm:px-6 shrink-0">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`inline-flex items-center gap-2 rounded-t-2xl px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "profile" ? "bg-accent/5 text-accent" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <User2 className="h-4 w-4" /> Profile information
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`inline-flex items-center gap-2 rounded-t-2xl px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "settings" ? "bg-accent/5 text-accent" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <Settings2 className="h-4 w-4" /> Settings
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 flex-1">
              {success && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Profile updated successfully.</span>
                </div>
              )}

              {error && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent/20 border-b-accent"></div>
                </div>
              ) : (
                <>
                  {activeTab === "profile" && (
                    <div className="space-y-6">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5">
                        <h2 className="text-lg font-semibold text-slate-900">Profile overview</h2>
                        <p className="mt-1 text-sm text-slate-600">Review your basic account details and update the fields that matter most.</p>
                      </div>

                      {/* Generic Account Info */}
                      <div className="rounded-3xl border border-slate-200 p-5">
                        <div className="mb-5 flex items-center gap-3">
                          <div className="rounded-2xl bg-slate-100 p-2 text-slate-700">
                            <Shield className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">Account</h3>
                            <p className="text-sm text-slate-500">Read-only information tied to your login.</p>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700"><Mail className="h-4 w-4 text-slate-400" /> Email</label>
                            <input type="email" value={user.email || ""} disabled className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500" />
                          </div>
                          <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700"><Shield className="h-4 w-4 text-slate-400" /> Role</label>
                            <input type="text" value={user.role === "SOLVER" ? "Solver" : "Seeker"} disabled className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500" />
                          </div>
                        </div>
                      </div>

                      {/* Extracted Forms */}
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

                  {/* Settings Tab Placeholder */}
                  {activeTab === "settings" && (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm"><Settings2 className="h-5 w-5" /></div>
                      <h2 className="mt-4 text-lg font-semibold text-slate-900">Settings are staying light for now</h2>
                      <p className="mt-2 text-sm text-slate-600">More account controls can live here later, but the essential profile editing tools are already available in the profile tab.</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer Actions */}
            {activeTab === "profile" && (
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-end shrink-0">
                <button
                  onClick={() => router.back()}
                  className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || isLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
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