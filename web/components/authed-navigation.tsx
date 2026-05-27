"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getDashboardPath } from "@/lib/auth-utils";
import ProfileDropdown from "@/components/profile-dropdown";

export default function AuthedNavigation() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleLogout = async () => {
    await logout();
    router.push("/landing");
  };

  // Get the home path based on user role
  const homePath = user?.role ? getDashboardPath(user.role) : "/";

  // Check if current path matches
  const isActive = (path: string) => pathname === path;
  
  // Check if tab is active for seeker dashboard
  const isSeekerTabActive = (tab: string) => {
    if (pathname !== "/seeker/dashboard") return false;
    const currentTab = searchParams.get("tab");
    if (!currentTab && tab === "home") return true;
    return currentTab === tab;
  };

  const isSolverTabActive = (tab: string) => {
    if (pathname !== "/solver/dashboard") return false;
    const currentTab = searchParams.get("tab");
    if (!currentTab && tab === "home") return true;
    return currentTab === tab;
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur ...">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={homePath} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary-foreground rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Solvad</span>
          </Link>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-8">
            {user?.role === "SEEKER" ? (
              <>
                <Link
                  href="/seeker/dashboard"
                  className={`text-gray-900 font-medium hover:text-primary-foreground transition-colors ${
                    isSeekerTabActive("home") ? "border-b-2 border-accent pb-1" : ""
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/seeker/dashboard?tab=activity"
                  className={`text-gray-900 font-medium hover:text-primary-foreground transition-colors ${
                    isSeekerTabActive("activity") ? "border-b-2 border-accent pb-1" : ""
                  }`}
                >
                  Recent Activity
                </Link>
                <Link
                  href="/seeker/dashboard?tab=overview"
                  className={`text-gray-900 font-medium hover:text-primary-foreground transition-colors ${
                    isSeekerTabActive("overview") ? "border-b-2 border-accent pb-1" : ""
                  }`}
                >
                  Overview
                </Link>
              </>
            ) : user?.role === "SOLVER" ? (
              <>
                <Link
                  href="/solver/dashboard"
                  className={`text-gray-900 font-medium hover:text-primary-foreground transition-colors ${
                    isSolverTabActive("home") ? "border-b-2 border-accent pb-1" : ""
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/solver/dashboard?tab=overview"
                  className={`text-gray-900 font-medium hover:text-primary-foreground transition-colors ${
                    isSolverTabActive("overview") ? "border-b-2 border-accent pb-1" : ""
                  }`}
                >
                  Overview
                </Link>
              </>
            ) : (
              <Link
                href={homePath}
                className={`text-gray-900 font-medium hover:text-primary-foreground transition-colors ${
                  isActive(homePath) ? "border-b-2 border-accent pb-1" : ""
                }`}
              >
                Home
              </Link>
            )}

            {/* Admin-specific tabs */}
            {user?.role === "ADMIN" && (
              <Link
                href="/admin/add-industry"
                className={`text-gray-900 font-medium hover:text-primary-foreground transition-colors ${
                  isActive("/admin/add-industry") ? "border-b-2 border-accent pb-1" : ""
                }`}
              >
                Add Industry
              </Link>
            )}
          </nav>

          {/* Right Side - Profile Dropdown */}
          <div className="flex items-center">
            <ProfileDropdown onLogout={handleLogout} />
          </div>
        </div>
      </div>
    </header>
  );
}
