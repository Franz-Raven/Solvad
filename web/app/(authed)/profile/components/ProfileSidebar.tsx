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
    <aside className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="rounded-[2rem] border border-slate-100 bg-white p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        
        {/* ── Avatar Section ── */}
        <div className="flex flex-col items-center text-center">
          <div className="relative group cursor-pointer">
            {user.profileUrl ? (
              <img
                src={user.profileUrl}
                alt="Profile"
                className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-md ring-1 ring-slate-100 group-hover:ring-emerald-200 transition-all"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 border-4 border-white shadow-md ring-1 ring-slate-100 text-3xl font-bold text-white group-hover:ring-emerald-200 transition-all">
                {getInitials()}
              </div>
            )}
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              className="absolute -bottom-1 -right-1 rounded-full border border-white bg-slate-900 p-2.5 text-white shadow-md transition-all hover:bg-emerald-600 active:scale-[0.92] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
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

          <h2 className="mt-5 text-xl font-bold text-slate-900 tracking-tight">{getDisplayName()}</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">{user.email}</p>
          
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 shadow-sm">
            <Shield className="h-3.5 w-3.5" />
            {getRoleLabel()}
          </span>

          <p className="mt-5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {isUploadingImage ? "Uploading image..." : "Upload a clean square image"}
          </p>
        </div>

        {/* ── Information Rows ── */}
        <div className="mt-8 space-y-3 border-t border-slate-100 pt-8 text-sm font-medium text-slate-600">
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3.5 hover:border-slate-200 transition-colors">
            <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-100 shrink-0">
              <Mail className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="truncate">{user.email}</span>
          </div>

          {user.role === "SOLVER" ? (
            <>
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3.5 hover:border-slate-200 transition-colors">
                <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-100 shrink-0">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="truncate">{solverData.institution || "No institution selected"}</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3.5 hover:border-slate-200 transition-colors">
                <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-100 shrink-0">
                  <GraduationCap className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="truncate">{solverData.degreeProgram || "No degree program selected"}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3.5 hover:border-slate-200 transition-colors">
                <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-100 shrink-0">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="truncate">{seekerData.organizationName || "No organization set"}</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3.5 hover:border-slate-200 transition-colors">
                <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-100 shrink-0">
                  <User2 className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="truncate">{seekerData.contactPerson || "No contact person set"}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}