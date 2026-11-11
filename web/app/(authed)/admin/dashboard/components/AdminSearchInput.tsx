"use client";

import { Search, X } from "lucide-react";

interface AdminSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function AdminSearchInput({ value, onChange, placeholder }: AdminSearchInputProps) {
  return (
    <div className="relative w-full md:w-80">
      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-9 py-2.5 bg-white rounded-lg border border-slate-200 text-sm shadow-sm font-medium text-slate-900 placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
