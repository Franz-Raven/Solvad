"use client";

import type React from "react";
import { AuthProvider } from "@/context/auth-context";
import AuthedNavigation from "@/components/authed-navigation";

export default function AuthedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col isolate">
        <AuthedNavigation />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
