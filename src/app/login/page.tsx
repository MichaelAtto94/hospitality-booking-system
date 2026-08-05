"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) return setError(result.message ?? "Login failed");
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen bg-slate-950 px-4 text-slate-900 md:place-items-center">
      <div className="my-auto w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl md:p-10">
        <p className="font-bold text-emerald-700">ZedStay Hospitality</p><h1 className="mt-2 text-3xl font-black">Staff sign in</h1><p className="mt-2 text-slate-500">Use your authorized staff account.</p>
        <form onSubmit={submit} className="mt-7 space-y-5">
          <label className="block">Email<input name="email" type="email" autoComplete="email" required className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600" /></label>
          <label className="block">Password<input name="password" type="password" autoComplete="current-password" required className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600" /></label>
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white disabled:opacity-60">{loading ? <LoaderCircle className="animate-spin" /> : <LogIn size={19} />}{loading ? "Signing in..." : "Sign in"}</button>
        </form>
      </div>
    </main>
  );
}
