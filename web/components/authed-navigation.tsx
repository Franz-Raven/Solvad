"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getDashboardPath } from "@/lib/auth-utils";
import ProfileDropdown from "@/components/profile-dropdown";

// Shared nav link styles
const baseLink =
  "rounded text-sm font-bold text-slate-600 transition-colors hover:text-slate-900 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";
const activeLink = "text-accent border-b-2 border-accent pb-1";

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

  // Check if tab is active for solver dashboard
  const isSolverTabActive = (tab: string) => {
    if (pathname !== "/solver/dashboard") return false;
    const currentTab = searchParams.get("tab");
    if (!currentTab && tab === "home") return true;
    return currentTab === tab;
  };

  const linkClass = (active: boolean) =>
    `${baseLink} ${active ? activeLink : ""}`;

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
      {/* Width matches the page card so logo and profile line up with it */}
     <div className="container mx-auto px-6 md:px-8">
      <div className="flex items-center justify-between h-16">
          {/* ── Logo tile + wordmark ── */}
          <Link
            href={homePath}
            className="group flex items-center gap-2.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#22966a] to-[#0f4d36] shadow-md shadow-emerald-900/20 ring-1 ring-inset ring-white/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-emerald-900/30">
              <img
                src="/solvad_logo.png"
                alt="Solvad Logo"
                className="h-7 w-auto object-contain brightness-0 invert"
              />
            </span>
            <span className="text-[26px] font-extrabold leading-none tracking-tight text-slate-900">
              Solvad
            </span>
          </Link>

          {/* ── Navigation Tabs ── */}
          <nav className="flex items-center gap-8">
            {user?.role === "SEEKER" ? (
              <>
                <Link
                  href="/seeker/dashboard"
                  className={linkClass(isSeekerTabActive("home"))}
                >
                  Home
                </Link>
                <Link
                  href="/seeker/dashboard?tab=activity"
                  className={linkClass(isSeekerTabActive("activity"))}
                >
                  Recent Activity
                </Link>
                <Link
                  href="/seeker/dashboard?tab=overview"
                  className={linkClass(isSeekerTabActive("overview"))}
                >
                  Overview
                </Link>
              </>
            ) : user?.role === "SOLVER" ? (
              <>
                <Link
                  href="/solver/dashboard"
                  className={linkClass(isSolverTabActive("home"))}
                >
                  Home
                </Link>
                <Link
                  href="/solver/dashboard?tab=workspace"
                  className={linkClass(isSolverTabActive("workspace"))}
                >
                  Workspace
                </Link>
                <Link
                  href="/solver/dashboard?tab=overview"
                  className={linkClass(isSolverTabActive("overview"))}
                >
                  Overview
                </Link>
              </>
            ) : (
              <Link href={homePath} className={linkClass(isActive(homePath))}>
                Home
              </Link>
            )}

            {/* Admin-specific tabs */}
            {user?.role === "ADMIN" && (
              <Link
                href="/admin/add-industry"
                className={linkClass(isActive("/admin/add-industry"))}
              >
                Add Industry
              </Link>
            )}
          </nav>

          {/* ── Right Side - Profile Dropdown ── */}
          <div className="flex items-center">
            <ProfileDropdown onLogout={handleLogout} />
          </div>
        </div>
      </div>
    </header>
  );
}