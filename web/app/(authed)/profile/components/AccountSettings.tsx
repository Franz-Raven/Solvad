"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AlertCircle, BadgeCheck, CalendarDays, KeyRound, Loader2, LogIn, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import type { AccountSettings as AccountSettingsData } from "@/types/account";
import { getAccountSettings } from "../api/account";
import { ChangePasswordForm } from "./ChangePasswordForm";

function SettingsCard({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
      <div className="mb-8 flex items-center gap-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-sm shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
          <p className="text-sm font-medium text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function InfoTile({ icon, label, value, badge }: { icon: ReactNode; label: string; value: string; badge?: ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3.5">
      <p className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        {icon} {label}
      </p>
      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
        <p className="text-sm font-bold text-slate-900">{value}</p>
        {badge}
      </div>
    </div>
  );
}

export function AccountSettings() {
  const { logout } = useAuth();
  const [settings, setSettings] = useState<AccountSettingsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  useEffect(() => {
    let isActive = true;
    getAccountSettings()
      .then((data) => {
        if (isActive) setSettings(data);
      })
      .catch((err) => {
        if (isActive) setError(err instanceof Error ? err.message : "Failed to load account settings");
      });
    return () => {
      isActive = false;
    };
  }, [reloadCount]);

  const retry = useCallback(() => {
    setError(null);
    setReloadCount((count) => count + 1);
  }, []);

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <p className="flex-1 text-sm font-bold text-rose-800 leading-relaxed">{error}</p>
        <button onClick={retry} className="text-sm font-bold text-rose-700 hover:underline cursor-pointer">Retry</button>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const isGoogle = settings.authProvider === "GOOGLE";
  const memberSince = new Date(settings.createdAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Overview ── */}
      <SettingsCard icon={<ShieldCheck className="h-5 w-5" />} title="Account Overview" description="How you sign in and the status of your account.">
        <div className="grid gap-4 md:grid-cols-3">
          <InfoTile
            icon={<LogIn className="h-3.5 w-3.5" />}
            label="Sign-in method"
            value={isGoogle ? "Google" : "Email & password"}
          />
          <InfoTile
            icon={<BadgeCheck className="h-3.5 w-3.5" />}
            label="Email status"
            value={settings.verified ? "Verified" : "Not verified"}
            badge={
              <span className={`h-2 w-2 rounded-full ${settings.verified ? "bg-emerald-500" : "bg-amber-500"}`} aria-hidden />
            }
          />
          <InfoTile icon={<CalendarDays className="h-3.5 w-3.5" />} label="Member since" value={memberSince} />
        </div>
      </SettingsCard>

      {/* ── Password ── */}
      <SettingsCard
        icon={<KeyRound className="h-5 w-5" />}
        title="Change Password"
        description={isGoogle ? "Your password is managed by Google." : "Use a strong password you don't use anywhere else."}
      >
        {settings.hasPassword ? (
          <ChangePasswordForm />
        ) : (
          <p className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm font-medium text-slate-600 leading-relaxed">
            You sign in to Solvad with your Google account ({settings.email}), so there&apos;s no Solvad password to change.
            To update your password, change it in your Google account settings.
          </p>
        )}
      </SettingsCard>

      {/* ── Session ── */}
      <SettingsCard icon={<LogOut className="h-5 w-5" />} title="Session" description="Sign out of Solvad on this device.">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm font-medium text-slate-500 leading-relaxed">
            {confirmSignOut ? "Are you sure you want to sign out?" : "You'll need to sign in again to access your dashboard."}
          </p>
          <div className="flex gap-3 shrink-0">
            {confirmSignOut && (
              <button
                onClick={() => setConfirmSignOut(false)}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-full hover:bg-slate-50 transition-colors shadow-sm text-sm cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => (confirmSignOut ? logout() : setConfirmSignOut(true))}
              className="px-6 py-3 bg-white border border-rose-200 text-rose-600 font-bold rounded-full hover:bg-rose-50 transition-colors shadow-sm text-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="h-4 w-4" /> {confirmSignOut ? "Yes, sign out" : "Sign out"}
            </button>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
