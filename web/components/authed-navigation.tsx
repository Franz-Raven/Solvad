"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Shield, ShieldCheck, Circle } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getDashboardPath } from "@/lib/auth-utils";
import ProfileDropdown from "@/components/profile-dropdown";

const baseLink =
  "px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer " +
  "active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

const activeLink = "text-accent bg-accent/10 shadow-sm border border-accent/20";
const inactiveLink = "text-slate-500 hover:text-accent hover:bg-slate-50 border border-transparent";

// --- Rank Gamification Configuration ---
export const RANK_TIERS = [
  { name: "Elite Solver", min: 10, icon: Shield, fill: true, color: "text-slate-700", iconColor: "text-slate-400", label: "10+ SOLUTIONS" },
  { name: "Proven Solver", min: 5, icon: ShieldCheck, fill: false, color: "text-slate-700", iconColor: "text-slate-400", label: "5-9 SOLUTIONS" },
  { name: "Contributor", min: 1, icon: Shield, fill: false, color: "text-slate-700", iconColor: "text-slate-400", label: "1-4 SOLUTIONS" },
  { name: "Initiate", min: 0, icon: Circle, fill: false, color: "text-slate-700", iconColor: "text-slate-400", label: "0 SOLUTIONS" },
];

export const getSolverRank = (completed: number) => {
  return RANK_TIERS.find(t => completed >= t.min) || RANK_TIERS[3];
};

export default function AuthedNavigation() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Optimized Fetch State for Solver Rank
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [rankLoading, setRankLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchSolverRank = async () => {
      if (user?.role !== "SOLVER" || !user?.id) {
        setRankLoading(false);
        return;
      }
      try {
        // Hitting your exact existing endpoint
        const res = await fetch(`/api/merit/solver/${user.id}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setCompletedCount(data.solutionsCompleted || 0);
        }
      } catch (err) {
        console.error("Failed to fetch solver rank metrics", err);
      } finally {
        if (isMounted) setRankLoading(false);
      }
    };

    fetchSolverRank();
    return () => { isMounted = false; };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push("/landing");
  };

  const homePath = user?.role ? getDashboardPath(user.role) : "/";
  const isActive = (path: string) => pathname === path;

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

  const linkClass = (active: boolean) =>
    `${baseLink} ${active ? activeLink : inactiveLink}`;

  const currentRank = getSolverRank(completedCount);
  const RankIcon = currentRank.icon;

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="container mx-auto px-6 md:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* ── Logo + wordmark ── */}
          <Link
            href={homePath}
            className="group flex items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 cursor-pointer active:scale-[0.98] transition-transform duration-200"
          >
            <img
              src="/solvad_logo.png"
              alt="Solvad Logo"
              className="h-12 w-auto md:h-14 object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <span className="text-[26px] md:text-[28px] font-extrabold leading-none tracking-tight text-slate-900 group-hover:text-accent transition-colors">
              Solvad
            </span>
          </Link>

          {/* ── Navigation Tabs ── */}
          <nav className="hidden md:flex items-center gap-2">
            {user?.role === "SEEKER" ? (
              <>
                <Link href="/seeker/dashboard" className={linkClass(isSeekerTabActive("home"))}>Home</Link>
                <Link href="/seeker/dashboard?tab=activity" className={linkClass(isSeekerTabActive("activity"))}>Recent Activity</Link>
                <Link href="/seeker/dashboard?tab=overview" className={linkClass(isSeekerTabActive("overview"))}>Overview</Link>
              </>
            ) : user?.role === "SOLVER" ? (
              <>
                <Link href="/solver/dashboard" className={linkClass(isSolverTabActive("home"))}>Home</Link>
                <Link href="/solver/dashboard?tab=workspace" className={linkClass(isSolverTabActive("workspace"))}>Workspace</Link>
                <Link href="/solver/dashboard?tab=overview" className={linkClass(isSolverTabActive("overview"))}>Overview</Link>
              </>
            ) : (
              <Link href={homePath} className={linkClass(isActive(homePath))}>Home</Link>
            )}

            {user?.role === "ADMIN" && (
              <Link href="/admin/add-industry" className={linkClass(isActive("/admin/add-industry"))}>Add Industry</Link>
            )}
          </nav>

          {/* ── Right Side ── */}
          <div className="flex items-center gap-4">
            {user?.role === "SOLVER" && !rankLoading && (
              <div className="relative group flex items-center">
                {/* Navbar Rank Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white cursor-help transition-all duration-200 hover:shadow-sm">
                  <RankIcon className="w-3.5 h-3.5 text-slate-500" fill={currentRank.fill ? "currentColor" : "none"} />
                  <span className="hidden sm:inline-block text-xs font-bold text-slate-700">
                    {currentRank.name}
                  </span>
                </div>

                {/* Rank Hover Explainer Modal */}
                <div className="absolute top-full right-0 mt-4 w-72 md:w-[340px] bg-white rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-6 translate-y-2 group-hover:translate-y-0">
                  <div className="absolute -top-2 right-12 w-4 h-4 bg-white border-t border-l border-slate-100 rotate-45" />
                  
                  <div className="relative z-10">
                    <h4 className="text-sm font-bold text-slate-900 mb-1.5">Solver Ranks</h4>
                    <p className="text-xs font-medium text-slate-500 mb-6 leading-relaxed">
                      Automated reliability metrics. Complete projects to level up your status and stand out to seekers.
                    </p>
                    <div className="space-y-4">
                      {RANK_TIERS.map((tier) => {
                        const TierIcon = tier.icon;
                        const isActiveTier = tier.name === currentRank.name;
                        return (
                          <div key={tier.name} className="flex items-center gap-4">
                            <div className="w-5 flex justify-center">
                              <TierIcon className={`w-4 h-4 ${isActiveTier ? 'text-emerald-600' : 'text-slate-400'}`} fill={tier.fill ? "currentColor" : "none"} />
                            </div>
                            <div className="flex-1">
                              <div className={`text-sm font-bold ${isActiveTier ? 'text-slate-900' : 'text-slate-700'}`}>{tier.name}</div>
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{tier.label}</div>
                            </div>
                            {isActiveTier && (
                              <div className="ml-auto text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                CURRENT
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <ProfileDropdown onLogout={handleLogout} />
          </div>
        </div>
      </div>
    </header>
  );
}