"use client";

import { GoogleSignInButton } from "@/components/google-button";

interface SocialLoginProps {
  onCredential: (credential: string) => void;
  isLoading: boolean;
  error: string | null;
}

export function SocialLogin({
  onCredential,
  isLoading,
  error,
}: SocialLoginProps) {
  return (
    <div className="mt-8 space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-100" />
        </div>
        <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
          <span className="bg-white px-4 text-slate-400">Or sign in with</span>
        </div>
      </div>

      <GoogleSignInButton onCredential={onCredential} />

      {isLoading && (
        <p className="text-center text-xs font-medium text-slate-500">
          Signing in with Google...
        </p>
      )}
      {error && (
        <p role="alert" className="text-center text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
