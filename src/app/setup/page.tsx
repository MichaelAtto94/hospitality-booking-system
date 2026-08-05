"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, LoaderCircle, LockKeyhole } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) return setError(result.message ?? "Setup failed");
    router.push("/login?setup=success");
  }

  const input = "mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl md:p-10">
        <div className="mb-8 flex items-center gap-3"><span className="rounded-2xl bg-emerald-600 p-3 text-white"><Building2 /></span><div><h1 className="text-2xl font-bold">Set up your property</h1><p className="text-sm text-slate-500">Create the first Super Administrator account.</p></div></div>
        <form onSubmit={submit} className="grid gap-5 md:grid-cols-2">
          <label className="md:col-span-2">Property name<input name="propertyName" required className={input} placeholder="Example: Mukuyu Lodge" /></label>
          <label>Property type<select name="propertyType" className={input}><option value="LODGE">Lodge</option><option value="HOTEL">Hotel</option><option value="GUEST_HOUSE">Guest house</option><option value="RESORT">Resort</option></select></label>
          <label>Phone<input name="phone" required className={input} placeholder="0977 000 000" /></label>
          <label className="md:col-span-2">Address<input name="address" required className={input} placeholder="Plot and street" /></label>
          <label>Town<input name="town" required className={input} placeholder="Lusaka" /></label>
          <label>Province<input name="province" required className={input} placeholder="Lusaka Province" /></label>
          <div className="md:col-span-2 mt-3 border-t pt-6"><h2 className="font-bold">Administrator details</h2></div>
          <label>First name<input name="firstName" required className={input} /></label>
          <label>Last name<input name="lastName" required className={input} /></label>
          <label className="md:col-span-2">Email<input name="email" type="email" required className={input} /></label>
          <label className="md:col-span-2">Password<input name="password" type="password" minLength={8} required className={input} /><span className="text-xs text-slate-500">At least 8 characters, one uppercase letter and one number.</span></label>
          {error && <p className="md:col-span-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button disabled={loading} className="md:col-span-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white disabled:opacity-60">{loading ? <LoaderCircle className="animate-spin" /> : <LockKeyhole size={19} />}{loading ? "Creating account..." : "Complete setup"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">Already configured? <Link className="font-bold text-emerald-700" href="/login">Sign in</Link></p>
      </div>
    </main>
  );
}
