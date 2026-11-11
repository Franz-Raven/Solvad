"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Circle, Eye, EyeOff, KeyRound, Loader2, Lock } from "lucide-react";
import { changePassword } from "../api/account";

// Same rules as registration (register/components/step1.tsx) and the backend ChangePasswordRequest
const PASSWORD_REQUIREMENTS = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Contains uppercase & lowercase", test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: "Includes special character", test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

const EMPTY_FORM = { currentPassword: "", newPassword: "", confirmPassword: "" };
type Field = keyof typeof EMPTY_FORM;

function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
  invalid = false,
}: {
  id: Field;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  invalid?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">
        <Lock className="h-3.5 w-3.5 text-emerald-600" /> {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-4 py-3.5 pr-12 bg-slate-50/50 border rounded-xl text-slate-900 font-medium transition-colors focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 ${
            invalid ? "border-rose-300" : "border-slate-200"
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function ChangePasswordForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const requirements = useMemo(
    () => PASSWORD_REQUIREMENTS.map((req) => ({ label: req.label, met: req.test(form.newPassword) })),
    [form.newPassword]
  );

  const meetsRequirements = requirements.every((r) => r.met);
  const confirmMismatch = form.confirmPassword.length > 0 && form.confirmPassword !== form.newPassword;
  const sameAsCurrent = form.newPassword.length > 0 && form.newPassword === form.currentPassword;
  const canSubmit =
    form.currentPassword.length > 0 &&
    meetsRequirements &&
    form.confirmPassword === form.newPassword &&
    !sameAsCurrent &&
    !isSubmitting;

  const update = (field: Field) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm(EMPTY_FORM);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 animate-in fade-in zoom-in-95 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-sm font-bold text-emerald-800 leading-relaxed">
            Password updated. Use your new password the next time you sign in.
          </p>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 animate-in fade-in zoom-in-95 duration-300">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-sm font-bold text-rose-800 leading-relaxed">{error}</p>
        </div>
      )}

      <PasswordInput
        id="currentPassword"
        label="Current Password"
        value={form.currentPassword}
        onChange={update("currentPassword")}
        autoComplete="current-password"
      />

      <div className="grid gap-6 md:grid-cols-2">
        <PasswordInput
          id="newPassword"
          label="New Password"
          value={form.newPassword}
          onChange={update("newPassword")}
          autoComplete="new-password"
          invalid={sameAsCurrent}
        />
        <PasswordInput
          id="confirmPassword"
          label="Confirm New Password"
          value={form.confirmPassword}
          onChange={update("confirmPassword")}
          autoComplete="new-password"
          invalid={confirmMismatch}
        />
      </div>

      <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2">
        {requirements.map((req) => (
          <p key={req.label} className={`flex items-center gap-2 text-xs font-semibold ${req.met ? "text-emerald-700" : "text-slate-500"}`}>
            {req.met ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-slate-300" />}
            {req.label}
          </p>
        ))}
        {confirmMismatch && (
          <p className="flex items-center gap-2 text-xs font-semibold text-rose-600">
            <AlertCircle className="h-4 w-4" /> Passwords don&apos;t match
          </p>
        )}
        {sameAsCurrent && (
          <p className="flex items-center gap-2 text-xs font-semibold text-rose-600">
            <AlertCircle className="h-4 w-4" /> New password must be different from your current one
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full transition-all shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
        >
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}
          {isSubmitting ? "Updating..." : "Update Password"}
        </button>
      </div>
    </form>
  );
}
