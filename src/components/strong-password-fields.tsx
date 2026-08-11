"use client";

import { Check, Eye, EyeOff, KeyRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  passwordName: string;
  confirmName?: string;
  passwordLabel?: string;
  confirmLabel?: string;
};

export function StrongPasswordFields({
  passwordName,
  confirmName = "confirmPassword",
  passwordLabel = "Strong password",
  confirmLabel = "Confirm password",
}: Props) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const confirmationRef = useRef<HTMLInputElement>(null);

  const checks = [
    { label: "12 or more characters", valid: password.length >= 12 },
    { label: "One uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "One lowercase letter", valid: /[a-z]/.test(password) },
    { label: "One number", valid: /[0-9]/.test(password) },
    { label: "One special character", valid: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((check) => check.valid).length;
  const matches = confirmation.length > 0 && confirmation === password;

  useEffect(() => {
    confirmationRef.current?.setCustomValidity(
      confirmation.length > 0 && confirmation !== password ? "Passwords do not match" : "",
    );
  }, [password, confirmation]);

  useEffect(() => {
    const form = confirmationRef.current?.form;
    const clearFields = () => { setPassword(""); setConfirmation(""); };
    form?.addEventListener("reset", clearFields);
    return () => form?.removeEventListener("reset", clearFields);
  }, []);

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-bold text-slate-700">{passwordLabel}</span>
        <span className="relative mt-2 block">
          <KeyRound size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            name={passwordName}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={12}
            maxLength={72}
            required
            autoComplete="new-password"
            placeholder="Create a strong password"
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-11 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
          <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>

      <div>
        <div className="flex gap-1.5">
          {checks.map((check, index) => <span key={check.label} className={`h-1.5 flex-1 rounded-full ${index < score ? score < 3 ? "bg-red-500" : score < 5 ? "bg-amber-500" : "bg-emerald-500" : "bg-slate-200"}`} />)}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {checks.map((check) => <span key={check.label} className={`flex items-center gap-1.5 text-[11px] font-semibold ${check.valid ? "text-emerald-700" : "text-slate-400"}`}>{check.valid ? <Check size={12} /> : <X size={12} />}{check.label}</span>)}
        </div>
      </div>

      <label className="block">
        <span className="text-sm font-bold text-slate-700">{confirmLabel}</span>
        <span className="relative mt-2 block">
          <KeyRound size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={confirmationRef}
            name={confirmName}
            type={showConfirmation ? "text" : "password"}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            minLength={12}
            maxLength={72}
            required
            autoComplete="new-password"
            placeholder="Enter the same password again"
            className={`h-12 w-full rounded-xl border bg-white px-11 text-slate-900 outline-none focus:ring-4 ${confirmation.length === 0 ? "border-slate-300 focus:border-blue-500 focus:ring-blue-500/10" : matches ? "border-emerald-500 focus:ring-emerald-500/10" : "border-red-400 focus:ring-red-500/10"}`}
          />
          <button type="button" aria-label={showConfirmation ? "Hide confirmation" : "Show confirmation"} onClick={() => setShowConfirmation((value) => !value)} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            {showConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
        {confirmation.length > 0 && <span className={`mt-2 flex items-center gap-1.5 text-xs font-bold ${matches ? "text-emerald-700" : "text-red-600"}`}>{matches ? <Check size={13} /> : <X size={13} />}{matches ? "Passwords match" : "Passwords do not match"}</span>}
      </label>
    </div>
  );
}
