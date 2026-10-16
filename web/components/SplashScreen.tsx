"use client";

import { useState, useEffect } from "react";

export function SplashScreen({ children }: { children?: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      const removeTimer = setTimeout(() => {
        setIsLoading(false);
      }, 500); // Matches the fade transition duration
      return () => clearTimeout(removeTimer);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {isLoading && (
        <div
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-slate-50 text-slate-900 p-8 transition-opacity duration-500 ease-out select-none ${
            isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          {/* Top spacing */}
          <div />

          {/* Center Branding with your official logo asset */}
          <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-3xl bg-white shadow-md shadow-slate-200 border border-slate-200/80 flex items-center justify-center p-3">
              <img 
                src="/solvad_logo.png" 
                alt="Solvad Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Solvad</h1>
          </div>

          {/* Bottom "from Beep Beep" team branding */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">from</span>
            <span className="text-xs font-bold tracking-wider text-accent uppercase">
              Beep Beep
            </span>
          </div>
        </div>
      )}

      {children}
    </>
  );
}