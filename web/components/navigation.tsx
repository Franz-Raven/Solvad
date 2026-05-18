"use client";

import Link from "next/link";

export default function Navigation() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-gray-200">
      <div className="container mx-auto px-4">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary-foreground rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Solvad</span>
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
