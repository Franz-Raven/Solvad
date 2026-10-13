"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";

interface ProfileDropdownProps {
  onLogout: () => void;
}

export default function ProfileDropdown({ onLogout }: ProfileDropdownProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

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
    if (!user) return "";
    if (user.role === "SOLVER" && user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.role === "SEEKER" && user.organizationName) {
      return user.organizationName;
    }
    return user.email;
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    router.push("/profile");
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
    router.push("/profile?tab=settings");
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    onLogout();
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* ── Profile Trigger ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer group"
      >
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">
            {getDisplayName()}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {user.role}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {user.profileUrl ? (
            <img
              src={user.profileUrl}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-200 group-hover:border-emerald-500 transition-colors"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-sm border border-emerald-400/50 group-hover:shadow-md transition-all">
              {getInitials()}
            </div>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* ── Dropdown Menu ── */}
      {isOpen && (
        <>
          {/* Invisible Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 origin-top-right">
            
            {/* Profile Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                {user.profileUrl ? (
                  <img
                    src={user.profileUrl}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-sm border border-emerald-400/50">
                    {getInitials()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2 px-2">
              <button
                onClick={handleProfileClick}
                className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-slate-50 rounded-xl transition-colors text-left group cursor-pointer active:scale-[0.98]"
              >
                <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-100 group-hover:border-emerald-100 transition-colors">
                  <User className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">
                  View Profile
                </span>
              </button>

              <button
                onClick={handleSettingsClick}
                className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-slate-50 rounded-xl transition-colors text-left group cursor-pointer active:scale-[0.98]"
              >
                <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-100 group-hover:border-emerald-100 transition-colors">
                  <Settings className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">
                  Account Settings
                </span>
              </button>
            </div>

            {/* Logout */}
            <div className="p-2 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={handleLogoutClick}
                className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-rose-50 rounded-xl transition-colors text-left group cursor-pointer active:scale-[0.98]"
              >
                <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-100 group-hover:border-rose-100 transition-colors">
                  <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
                </div>
                <span className="text-sm font-bold text-slate-600 group-hover:text-rose-700 transition-colors">
                  Sign Out
                </span>
              </button>
            </div>

          </div>
        </>
      )}
    </div>
  );
}