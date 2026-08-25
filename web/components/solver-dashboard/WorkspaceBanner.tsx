"use client";

import Link from "next/link";
import { Rocket, ArrowRight } from "lucide-react";

interface WorkspaceBannerProps {
  isLoading: boolean;
  activeCount: number;
}

export function WorkspaceBanner({ isLoading, activeCount }: WorkspaceBannerProps) {
  if (isLoading) {
    return (
      <div className="bg-secondary/5 border border-secondary/10 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-pulse">
        <div className="flex items-center gap-4 w-full">
          <div className="w-12 h-12 bg-gray-300/50 rounded-full shrink-0" />
          <div className="space-y-2 w-full max-w-md">
            <div className="h-4 bg-gray-300/50 rounded w-3/4" />
            <div className="h-3 bg-gray-200/50 rounded w-1/2" />
          </div>
        </div>
        <div className="w-40 h-10 bg-gray-300/50 rounded-lg shrink-0" />
      </div>
    );
  }

  if (activeCount === 0) return null;

  return (
    <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-secondary text-white rounded-full flex items-center justify-center shadow-sm shrink-0">
          <Rocket className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-secondary-dark text-base">
            You have {activeCount} active problem{activeCount > 1 ? "s" : ""} in your workspace
          </h3>
          <p className="text-sm text-gray-600">
            Keep up the momentum. Jump back in and finish your solution!
          </p>
        </div>
      </div>
      <Link
        href="/solver/workspace"
        className="px-6 py-2.5 bg-secondary hover:bg-accent text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap shadow-sm shrink-0 flex items-center gap-2"
      >
        Go to Workspace
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}