/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowLeft, KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";
import { StrongPasswordFields } from "@/components/strong-password-fields";

type Staff = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
};

export default function StaffPasswordRecoveryPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [allowed, setAllowed] = useState(true);

  const load = useCallback(async () => {
    const [staffResponse, accountResponse] = await Promise.all([
      fetch("/api/staff"),
      fetch("/api/account"),
    ]);
    if (!staffResponse.ok || !accountResponse.ok) {
      setAllowed(false);
      return;
    }
    const account = await accountResponse.json();
    if (account.role !== "SUPER_ADMIN") {
      setAllowed(false);
      return;
    }
    setStaff(await staffResponse.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const staffId = String(values.staffId ?? "");

    const response = await fetch("/api/staff/" + staffId + "/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: values.password,
        confirmPassword: values.confirmPassword,
      }),
    });
    const result = await response.json();
    setMessage(result.message ?? "Unable to reset password");
    if (response.ok) form.reset();
    setLoading(false);
  }

  return (
    <main className="min-h-full bg-slate-50 p-5 md:p-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard/staff"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft size={16} /> Back to staff
        </Link>

        <div className="mt-6 overflow-hidden rounded-[30px] border bg-white shadow-xl shadow-slate-200/60">
          <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-emerald-950 p-7 text-white md:p-10">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-emerald-300">
              <KeyRound size={27} />
            </div>
            <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
              Super Administrator
            </p>
            <h1 className="mt-2 text-3xl font-black md:text-4xl">
              Staff password recovery
            </h1>
            <p className="mt-3 max-w-xl text-slate-300">
              Issue a strong temporary password without exposing or storing the
              original password.
            </p>
          </div>

          <div className="p-6 md:p-10">
            {!allowed ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
                You are not authorized to use staff password recovery.
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-6">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Staff account
                  </span>
                  <select
                    name="staffId"
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="">Select a staff member</option>
                    {staff.map((member) => (
                      <option
                        key={member.id}
                        value={member.id}
                        disabled={!member.isActive}
                      >
                        {member.firstName} {member.lastName} -{" "}
                        {member.role.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>

                <StrongPasswordFields
                  passwordName="password"
                  confirmName="confirmPassword"
                  passwordLabel="New temporary password"
                  confirmLabel="Confirm temporary password"
                />

                <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <ShieldCheck className="shrink-0" size={20} />
                  Share the temporary password privately and ask the staff
                  member to change it from My Account after signing in.
                </div>

                {message && (
                  <p className="rounded-xl bg-slate-100 p-4 text-sm font-semibold text-slate-800">
                    {message}
                  </p>
                )}

                <button
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 font-black text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-60"
                >
                  {loading ? (
                    <LoaderCircle className="animate-spin" size={18} />
                  ) : (
                    <KeyRound size={18} />
                  )}
                  {loading ? "Resetting password..." : "Reset staff password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
