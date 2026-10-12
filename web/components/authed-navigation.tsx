"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getDashboardPath } from "@/lib/auth-utils";
import ProfileDropdown from "@/components/profile-dropdown";

// 🚀 Modern shared nav link styles with interactive cursors, smooth scaling, and pill design
const baseLink =
  "px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer " +
  "active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

const activeLink = "text-accent bg-accent/10 shadow-sm border border-accent/20";
const inactiveLink = "text-slate-500 hover:text-accent hover:bg-slate-50 border border-transparent";

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
    `${baseLink} ${active ? activeLink : inactiveLink}`;

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="container mx-auto px-6 md:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* ── Logo tile + wordmark ── */}
          <Link
            href={homePath}
            className="group flex items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 cursor-pointer active:scale-[0.98] transition-transform duration-200"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#22966a] to-[#0f4d36] shadow-md shadow-emerald-900/20 ring-1 ring-inset ring-white/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-emerald-900/30">
              <img
                src="/solvad_logo.png"
                alt="Solvad Logo"
                className="h-7 w-auto object-contain brightness-0 invert"
              />
            </span>
            <span className="text-[26px] font-extrabold leading-none tracking-tight text-slate-900 group-hover:text-accent transition-colors">
              Solvad
            </span>
          </Link>

          {/* ── Navigation Tabs ── */}
          <nav className="hidden md:flex items-center gap-2">
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
          <div className="flex items-center gap-4">
            <ProfileDropdown onLogout={handleLogout} />
          </div>
        </div>
      </div>
    </header>
  );
}