"use client";

import type React from "react";
import { Suspense } from "react";
import { AuthProvider } from "@/context/auth-context";
import AuthedNavigation from "@/components/authed-navigation";
import { AuthGuard } from "@/components/auth-guard";
import { NotificationProvider } from "@/context/notification-context";

export default function AuthedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>
         <NotificationProvider>
          <div className="min-h-screen flex flex-col isolate">
            <Suspense fallback={<header className="h-16 w-full border-b border-slate-200 bg-white/95" />}>
              <AuthedNavigation />
            </Suspense>
            <main className="flex-1">
              {children}
            </main>
          </div>
        </NotificationProvider>
      </AuthGuard>
    </AuthProvider>
  );
}
