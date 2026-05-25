"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User, UserRole } from "@/types/auth";
import { performLogout } from "@/lib/auth-utils";
import { getMyProfile as getSeekerProfile } from "@/lib/api/seeker";
import { getMyProfile as getSolverProfile } from "@/lib/api/solver";

type AuthContextValue = {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  logout: () => void;
  isAuthenticated: boolean;
  role: UserRole | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    // Clear all auth data
    setUser(null);
    performLogout();
    router.push("/landing");
  }, [router]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        const userEmail = localStorage.getItem("userEmail");
        const userRole = localStorage.getItem("userRole") as UserRole | null;

        if (token && userId && userEmail && userRole) {
          // Set basic user info first
          const basicUser: User = {
            id: userId,
            email: userEmail,
            firstName: "",
            lastName: "",
            role: userRole,
          };
          
          setUser(basicUser);

          // Fetch full profile based on role
          try {
            if (userRole === "SEEKER") {
              const seekerProfile = await getSeekerProfile();
              setUser({
                ...basicUser,
                organizationName: seekerProfile.organizationName,
                profileUrl: seekerProfile.profileUrl,
              });
            } else if (userRole === "SOLVER") {
              const solverProfile = await getSolverProfile();
              setUser({
                ...basicUser,
                firstName: solverProfile.firstName,
                lastName: solverProfile.lastName,
                institution: solverProfile.institution,
                degreeProgram: solverProfile.degreeProgram,
                profileUrl: solverProfile.profileUrl,
              });
            }
          } catch (profileErr) {
            console.error("Failed to fetch profile", profileErr);
            // Keep basic user info even if profile fetch fails
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to initialize auth", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const contextValue: AuthContextValue = {
    user,
    setUser,
    loading,
    logout,
    isAuthenticated: !!user,
    role: user?.role || null,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
