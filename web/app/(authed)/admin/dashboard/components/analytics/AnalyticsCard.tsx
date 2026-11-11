"use client";

import type { ReactNode } from "react";
import { BarChart2 } from "lucide-react";

export const AXIS_TICK = { fontSize: 12, fill: "#94a3b8", fontWeight: 500 } as const;
export const GRID_STROKE = "rgba(15, 23, 42, 0.06)";

export function AnalyticsCard({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full hover:border-accent/20 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
          {subtitle && <p className="text-sm font-medium text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {badge}
      </div>
      <div className="flex-1 flex flex-col justify-end">{children}</div>
    </div>
  );
}

export function AnalyticsBadge({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs font-bold bg-accent/10 text-accent px-3 py-1 rounded-full uppercase tracking-wide border border-accent/20 whitespace-nowrap">
      {children}
    </span>
  );
}

export function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-64 flex flex-col items-center justify-center gap-3 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 p-6">
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
        <BarChart2 className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-500">{message}</p>
    </div>
  );
}

export function ChartCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full flex flex-col animate-pulse min-h-[340px]">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-1/4 mb-8" />
      <div className="flex-1 flex items-end justify-between gap-3 pt-4 border-b border-l border-gray-100 pb-2 pl-2">
        {[40, 70, 45, 90, 65, 30].map((h, i) => (
          <div key={i} className="w-full bg-gray-200 rounded-t-md opacity-50" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}
