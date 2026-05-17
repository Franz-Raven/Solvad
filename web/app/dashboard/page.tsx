"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setUserEmail(localStorage.getItem("userEmail") || "");
    setUserRole(localStorage.getItem("userRole") || "");
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/10 via-background to-accent/10 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-card rounded-2xl shadow-xl border border-border p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome to Solvad
              </h1>
              <p className="text-muted-foreground">
                Logged in as: <span className="font-medium text-foreground">{userEmail}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Role: <span className="font-medium text-secondary">{userRole}</span>
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Dashboard
          </h2>
          <p className="text-muted-foreground">
            Your dashboard content will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
