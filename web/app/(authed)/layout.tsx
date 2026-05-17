"use client";

import type React from "react";
import { AuthProvider } from "@/context/auth-context";

export default function AuthedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen">
        {children}
      </div>
    </AuthProvider>
  );
}
