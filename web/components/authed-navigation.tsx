"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getDashboardPath } from "@/lib/auth-utils";

export default function AuthedNavigation() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push("/landing");
  };

  // Get the home path based on user role
  const homePath = user?.role ? getDashboardPath(user.role) : "/";

  // Check if current path matches
  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={homePath} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary-foreground rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Solvad</span>
          </Link>

          {/* Tabs */}
          <nav className="flex items-center gap-8">
            <Link
              href={homePath}
              className={`text-gray-900 font-medium hover:text-primary-foreground transition-colors ${
                isActive(homePath) ? "border-b-2 border-accent pb-1" : ""
              }`}
            >
              Home
            </Link>
            
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

          {/* Right Side - User Info & Logout */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-xs text-gray-500">{user.email}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
