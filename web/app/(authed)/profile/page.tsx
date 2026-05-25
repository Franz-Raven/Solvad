"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera } from "lucide-react";
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account information</p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === "profile"
                  ? "text-accent border-b-2 border-accent bg-accent/5"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === "settings"
                  ? "text-accent border-b-2 border-accent bg-accent/5"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              Settings
            </button>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700">
                ✓ Profile updated successfully!
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
              </div>
            ) : (
              <>
                {activeTab === "profile" && (
                  <div className="space-y-6">
                    {/* Profile Picture Upload */}
                    <div className="flex flex-col items-center pb-6 border-b border-gray-200">
                      <div className="relative group">
                        {user.profileUrl ? (
                          <img
                            src={user.profileUrl}
                            alt="Profile"
                            className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow-lg"
                          />
                        ) : (
                          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-accent to-primary-foreground flex items-center justify-center text-white font-bold text-4xl shadow-lg">
                            {getInitials()}
                          </div>
                        )}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingImage}
                          className="absolute bottom-0 right-0 p-3 bg-accent text-white rounded-full shadow-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-110"
                        >
                          <Camera className="w-5 h-5" />
                        </button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureUpload}
                        className="hidden"
                      />
                      {isUploadingImage && (
                        <p className="mt-3 text-sm text-gray-600">Uploading...</p>
                      )}
                      <p className="mt-3 text-sm text-gray-500">Click the camera icon to upload a profile picture</p>
                    </div>

                    {/* User Info (Read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role
                      </label>
                      <input
                        type="text"
                        value={user?.role || ""}
                        disabled
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                      />
                    </div>

                    {/* Seeker Profile Fields */}
                    {user?.role === "SEEKER" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                          />
                        </div>
                      </>
                    )}

                    {/* Solver Profile Fields */}
                    {user?.role === "SOLVER" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Institution/University
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
                            <SelectTrigger className="w-full px-4 py-3 !h-auto">
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
                          <label className="block text-sm font-medium text-gray-700 mb-2">
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
                            <SelectTrigger className="w-full px-4 py-3 !h-auto">
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
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Skills (comma-separated)
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
                            placeholder="Java, Python, React, etc."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === "settings" && (
                  <div className="space-y-4">
                    <p className="text-gray-500 text-center py-12">
                      Settings section coming soon...
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {activeTab === "profile" && (
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleBack}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || isLoading}
                className="px-6 py-2.5 bg-accent text-white font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
