"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { User, Settings, LogOut } from "lucide-react";

interface ProfileDropdownProps {
  onLogout: () => void;
}

export default function ProfileDropdown({
  onLogout,
}: ProfileDropdownProps) {
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
      {/* Profile Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <span className="text-sm font-medium text-gray-900 hidden sm:block">
          {getDisplayName()}
        </span>
        {user.profileUrl ? (
          <img
            src={user.profileUrl}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover shadow-md border-2 border-gray-100"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary-foreground flex items-center justify-center text-white font-semibold shadow-md">
            {getInitials()}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute right-0 mt-3 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
            {/* Profile Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-br from-secondary/5 to-accent/5">
              <div className="flex items-center gap-3">
                {user.profileUrl ? (
                  <img
                    src={user.profileUrl}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover shadow-md border-2 border-gray-100"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-primary-foreground flex items-center justify-center text-white font-semibold text-lg shadow-md">
                    {getInitials()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={handleProfileClick}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
              >
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">
                  Profile
                </span>
              </button>

              <button
                onClick={handleSettingsClick}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
              >
                <Settings className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">
                  Settings
                </span>
              </button>
            </div>

            {/* Logout */}
            <div className="border-t border-gray-200 py-2">
              <button
                onClick={handleLogoutClick}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-50 transition-colors text-left group"
              >
                <LogOut className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-600">
                  Logout
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
