"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getValidToken } from "@/lib/auth-utils";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = getValidToken();
      if (!token) {
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  return <>{children}</>;
}
