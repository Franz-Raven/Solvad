import { Building2, Camera, GraduationCap, Mail, Shield, User2 } from "lucide-react";
import type { RefObject } from "react";

interface ProfileSidebarProps {
  user: any;
  solverData: { institution: string; degreeProgram: string; };
  seekerData: { organizationName: string; contactPerson: string; };
  isUploadingImage: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onUploadPicture: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProfileSidebar({
  user,
  solverData,
  seekerData,
  isUploadingImage,
  fileInputRef,
  onUploadPicture,
}: ProfileSidebarProps) {
  const getInitials = () => {
    if (user.role === "SOLVER" && user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.role === "SEEKER" && user.organizationName) {
      return user.organizationName[0].toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  const getDisplayName = () => {
    if (user.role === "SOLVER") {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
      return fullName || "Solver profile";
    }
    return user.organizationName || "Seeker profile";
  };

  const getRoleLabel = () => user.role === "SOLVER" ? "Solver" : "Seeker";

  return (
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
            onChange={onUploadPicture}
            className="hidden"
          />

          <h2 className="mt-4 text-xl font-semibold text-slate-900">{getDisplayName()}</h2>
          <p className="mt-1 text-sm text-slate-500">{user.email}</p>
          <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
            <Shield className="h-3.5 w-3.5" />
            {getRoleLabel()}
          </span>

          <p className="mt-4 text-sm text-slate-500">
            {isUploadingImage ? "Uploading image..." : "Upload a clean square image for the best result."}
          </p>
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
  );
}