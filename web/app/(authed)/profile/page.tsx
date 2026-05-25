"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Camera,
  CheckCircle2,
  GraduationCap,
  Mail,
  Phone,
  Settings2,
  Shield,
  Sparkles,
  User2,
  Users2,
} from "lucide-react";
import { getMyProfile as getSeekerProfile, updateMyProfile as updateSeekerProfile } from "@/lib/api/seeker";
import { getMyProfile as getSolverProfile, updateMyProfile as updateSolverProfile } from "@/lib/api/solver";
import { uploadProfilePicture } from "@/lib/api/user";
import { cebuUniversities } from "@/lib/data/universities";
import { programCategories } from "@/lib/data/programs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "settings">("profile");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Seeker profile state
  const [seekerData, setSeekerData] = useState({
    organizationName: "",
    contactPerson: "",
    contactNumber: "",
  });

  // Solver profile state
  const [solverData, setSolverData] = useState({
    firstName: "",
    lastName: "",
    institution: "",
    degreeProgram: "",
    skills: "",
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      if (user.role === "SEEKER") {
        const profile = await getSeekerProfile();
        setSeekerData({
          organizationName: profile.organizationName,
          contactPerson: profile.contactPerson,
          contactNumber: profile.contactNumber || "",
        });
      } else if (user.role === "SOLVER") {
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
        // Update user context with new organization name
        setUser({
          ...user,
          organizationName: seekerData.organizationName,
        });
      } else if (user.role === "SOLVER") {
        await updateSolverProfile({
          firstName: solverData.firstName,
          lastName: solverData.lastName,
          institution: solverData.institution,
          degreeProgram: solverData.degreeProgram,
          skills: solverData.skills || undefined,
        });
        // Update user context with new name and profile data
        setUser({
          ...user,
          firstName: solverData.firstName,
          lastName: solverData.lastName,
          institution: solverData.institution,
          degreeProgram: solverData.degreeProgram,
        });
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setIsUploadingImage(true);
    setError(null);

    try {
      const response = await uploadProfilePicture(file);
      
      // Update user context with new profile URL
      setUser({
        ...user,
        profileUrl: response.profileUrl,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload profile picture");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const getInitials = () => {
    if (!user) return "U";
    if (user.role === "SOLVER" && user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.role === "SEEKER" && user.organizationName) {
      return user.organizationName[0].toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  const getDisplayName = () => {
    if (!user) return "Your profile";
    if (user.role === "SOLVER") {
      const fullName = [solverData.firstName, solverData.lastName].filter(Boolean).join(" ").trim();
      return fullName || "Solver profile";
    }
    return seekerData.organizationName || "Seeker profile";
  };

  const getRoleLabel = () => {
    if (!user) return "";
    return user.role === "SOLVER" ? "Solver" : "Seeker";
  };

  const parsedSkills = solverData.skills
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button
              onClick={handleBack}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Profile</h1>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="relative group">
                  {user.profileUrl ? (
                    <img
                      src={user.profileUrl}
                      alt="Profile"
                      className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-md ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent/80 text-3xl font-semibold text-white shadow-md">
                      {getInitials()}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="absolute -bottom-1 -right-1 rounded-full border border-white bg-slate-900 p-2.5 text-white shadow-md transition-transform hover:scale-105 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                />

                <h2 className="mt-4 text-xl font-semibold text-slate-900">{getDisplayName()}</h2>
                <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                  <Shield className="h-3.5 w-3.5" />
                  {getRoleLabel()}
                </span>

                {isUploadingImage ? (
                  <p className="mt-4 text-sm text-slate-500">Uploading image...</p>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    Upload a clean square image for the best result.
                  </p>
                )}
              </div>

              <div className="mt-6 space-y-3 border-t border-slate-100 pt-6 text-sm text-slate-600">
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="truncate">{user.email}</span>
                </div>

                {user.role === "SOLVER" ? (
                  <>
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <span className="truncate">{solverData.institution || "No institution selected"}</span>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                      <GraduationCap className="h-4 w-4 text-slate-400" />
                      <span className="truncate">{solverData.degreeProgram || "No degree program selected"}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <span className="truncate">{seekerData.organizationName || "No organization set"}</span>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                      <User2 className="h-4 w-4 text-slate-400" />
                      <span className="truncate">{seekerData.contactPerson || "No contact person set"}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

          </aside>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 pt-4 sm:px-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`inline-flex items-center gap-2 rounded-t-2xl px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "profile"
                      ? "bg-accent/5 text-accent"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <User2 className="h-4 w-4" />
                  Profile information
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`inline-flex items-center gap-2 rounded-t-2xl px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "settings"
                      ? "bg-accent/5 text-accent"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <Settings2 className="h-4 w-4" />
                  Settings
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8">
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
                        <p className="mt-1 text-sm text-slate-600">
                          Review your basic account details and update the fields that matter most.
                        </p>
                      </div>

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
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                              <Mail className="h-4 w-4 text-slate-400" />
                              Email
                            </label>
                            <input
                              type="email"
                              value={user.email || ""}
                              disabled
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500"
                            />
                          </div>

                          <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                              <Shield className="h-4 w-4 text-slate-400" />
                              Role
                            </label>
                            <input
                              type="text"
                              value={getRoleLabel()}
                              disabled
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500"
                            />
                          </div>
                        </div>
                      </div>

                      {user.role === "SEEKER" && (
                        <div className="rounded-3xl border border-slate-200 p-5">
                          <div className="mb-5 flex items-center gap-3">
                            <div className="rounded-2xl bg-slate-100 p-2 text-slate-700">
                              <Users2 className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">Organization details</h3>
                              <p className="text-sm text-slate-500">This helps solvers identify and contact your team.</p>
                            </div>
                          </div>

                          <div className="grid gap-4">
                            <div>
                              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                                <Building2 className="h-4 w-4 text-slate-400" />
                                Organization Name
                              </label>
                              <input
                                type="text"
                                value={seekerData.organizationName}
                                onChange={(e) =>
                                  setSeekerData({
                                    ...seekerData,
                                    organizationName: e.target.value,
                                  })
                                }
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
                              />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                                  <User2 className="h-4 w-4 text-slate-400" />
                                  Contact Person
                                </label>
                                <input
                                  type="text"
                                  value={seekerData.contactPerson}
                                  onChange={(e) =>
                                    setSeekerData({
                                      ...seekerData,
                                      contactPerson: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
                                />
                              </div>

                              <div>
                                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                                  <Phone className="h-4 w-4 text-slate-400" />
                                  Contact Number
                                </label>
                                <input
                                  type="tel"
                                  value={seekerData.contactNumber}
                                  onChange={(e) =>
                                    setSeekerData({
                                      ...seekerData,
                                      contactNumber: e.target.value,
                                    })
                                  }
                                  placeholder="+63 912 345 6789"
                                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {user.role === "SOLVER" && (
                        <div className="rounded-3xl border border-slate-200 p-5">
                          <div className="mb-5 flex items-center gap-3">
                            <div className="rounded-2xl bg-slate-100 p-2 text-slate-700">
                              <BriefcaseBusiness className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">Academic and skill profile</h3>
                              <p className="text-sm text-slate-500">Keep this current so problem recommendations stay relevant.</p>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                                <User2 className="h-4 w-4 text-slate-400" />
                                First Name
                              </label>
                              <input
                                type="text"
                                value={solverData.firstName}
                                onChange={(e) =>
                                  setSolverData({
                                    ...solverData,
                                    firstName: e.target.value,
                                  })
                                }
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
                              />
                            </div>

                            <div>
                              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                                <User2 className="h-4 w-4 text-slate-400" />
                                Last Name
                              </label>
                              <input
                                type="text"
                                value={solverData.lastName}
                                onChange={(e) =>
                                  setSolverData({
                                    ...solverData,
                                    lastName: e.target.value,
                                  })
                                }
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
                              />
                            </div>
                          </div>

                          <div className="mt-4 grid gap-4">
                            <div>
                              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                                <Building2 className="h-4 w-4 text-slate-400" />
                                Institution / University
                              </label>
                              <Select
                                value={solverData.institution}
                                onValueChange={(value) =>
                                  setSolverData({
                                    ...solverData,
                                    institution: value,
                                  })
                                }
                              >
                                <SelectTrigger className="!h-auto w-full rounded-2xl border-slate-300 px-4 py-3">
                                  <SelectValue placeholder="Select your university" />
                                </SelectTrigger>
                                <SelectContent>
                                  {cebuUniversities.map((university) => (
                                    <SelectItem key={university} value={university}>
                                      {university}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                                <GraduationCap className="h-4 w-4 text-slate-400" />
                                Degree Program
                              </label>
                              <Select
                                value={solverData.degreeProgram}
                                onValueChange={(value) =>
                                  setSolverData({
                                    ...solverData,
                                    degreeProgram: value,
                                  })
                                }
                              >
                                <SelectTrigger className="!h-auto w-full rounded-2xl border-slate-300 px-4 py-3">
                                  <SelectValue placeholder="Select your degree program" />
                                </SelectTrigger>
                                <SelectContent>
                                  {programCategories.map((category) => (
                                    <div key={category.name}>
                                      {category.programs.map((program) => (
                                        <SelectItem key={program} value={program}>
                                          {program}
                                        </SelectItem>
                                      ))}
                                    </div>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                                <Sparkles className="h-4 w-4 text-slate-400" />
                                Skills
                              </label>
                              <input
                                type="text"
                                value={solverData.skills}
                                onChange={(e) =>
                                  setSolverData({
                                    ...solverData,
                                    skills: e.target.value,
                                  })
                                }
                                placeholder="Java, Python, React, SQL"
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
                              />
                              <p className="mt-2 text-sm text-slate-500">
                                Add comma-separated keywords to improve matching quality.
                              </p>

                              {parsedSkills.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {parsedSkills.map((skill) => (
                                    <span
                                      key={skill}
                                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "settings" && (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm">
                        <Settings2 className="h-5 w-5" />
                      </div>
                      <h2 className="mt-4 text-lg font-semibold text-slate-900">Settings are staying light for now</h2>
                      <p className="mt-2 text-sm text-slate-600">
                        More account controls can live here later, but the essential profile editing tools are already available in the profile tab.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {activeTab === "profile" && (
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
                <button
                  onClick={handleBack}
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
