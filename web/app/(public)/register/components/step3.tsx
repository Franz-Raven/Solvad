"use client";

import { Loader2 } from "lucide-react";

interface Step3Props {
  email: string;
  token: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onResend: () => void;
  isLoading: boolean;
  isResending: boolean;
  resendMessage: string | null;
}

export default function Step3({
  email, token, onChange, onSubmit, onResend, isLoading, isResending, resendMessage
}: Step3Props) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="text-center mb-6">
        <p className="text-[13px] font-medium text-slate-500">
          We've sent a 6-digit verification code to
        </p>
        <p className="text-[14px] font-bold text-slate-800 mt-1">{email}</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="token" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">
          Verification Code
        </label>
        <input
          id="token" name="token" type="text" maxLength={6}
          value={token} onChange={onChange}
          className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-900 placeholder:text-slate-400 font-bold text-center tracking-[1em] text-lg"
          placeholder="000000" required
        />
      </div>

      {resendMessage && (
        <p className={`text-[12px] font-bold text-center mt-2 ${resendMessage.includes("sent") ? "text-emerald-600" : "text-rose-600"}`}>
          {resendMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading || token.length !== 6}
        className="w-full px-6 py-4 mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full transition-all shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center cursor-pointer"
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Account"}
      </button>

      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-[12px] font-medium text-amber-800">
        Your verification code expires 15 minutes after it is sent. If it expires, request a new code.
      </p>

      <div className="text-center mt-5">
        <p className="text-[11px] font-medium text-slate-400">
          Didn't receive a code?{" "}
          <button
            type="button"
            onClick={onResend}
            disabled={isResending}
            className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors hover:underline underline-offset-4 disabled:opacity-50 disabled:no-underline cursor-pointer"
          >
            {isResending ? "Sending..." : "Resend Code"}
          </button>
        </p>
      </div>
    </form>
  );
}