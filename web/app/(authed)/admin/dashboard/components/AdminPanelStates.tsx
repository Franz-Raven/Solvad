"use client";

import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

export function PanelEmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100 text-slate-400">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PanelError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-rose-800 text-sm font-bold">Couldn&apos;t load this section</p>
        <p className="text-rose-700 text-sm font-medium mt-0.5">{message}</p>
      </div>
      <button onClick={onRetry} className="text-sm font-bold text-rose-700 hover:text-rose-900 hover:underline cursor-pointer">
        Retry
      </button>
    </div>
  );
}

/** Row skeletons for table-based panels. */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden">
      <div className="h-11 bg-slate-50 border-b border-slate-100" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-slate-50 last:border-b-0 animate-pulse">
          <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-slate-200 rounded-md w-1/3" />
            <div className="h-3 bg-slate-100 rounded-md w-1/2" />
          </div>
          <div className="hidden md:block h-5 w-20 bg-slate-100 rounded-md" />
          <div className="hidden md:block h-3 w-16 bg-slate-100 rounded-md" />
        </div>
      ))}
    </div>
  );
}

/** Shown by next/dynamic while a tab's code chunk downloads. */
export function TabChunkSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex flex-col md:flex-row gap-3 md:justify-between">
        <div className="h-10 bg-slate-100 rounded-lg w-full md:w-80" />
        <div className="h-10 bg-slate-100 rounded-lg w-full md:w-52" />
      </div>
      <TableSkeleton rows={4} />
    </div>
  );
}
