"use client";

import Link from "next/link";

export default function Navigation() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-gray-200">
      <div className="container mx-auto px-4">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo with Light Green Box & Photo Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm transition-transform duration-300 group-hover:scale-105 p-2">
              <img
                src="/solvad_logo.png"
                alt="Solvad Logo"
                className="h-full w-auto object-contain"
              />
            </div>
            <span className="text-2xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">Solvad</span>
          </Link>

          {/* Right Side - Login & Sign Up */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-gray-700 hover:text-[#288760] font-medium transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-6 py-2.5 bg-[#5CA87C] hover:bg-[#288760] text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}