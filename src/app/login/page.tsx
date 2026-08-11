"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  BedDouble,
  Check,
  Eye,
  EyeOff,
  Hotel,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const highlights = [
  "Secure role-based access",
  "Live room and booking operations",
  "Payments, reports and audit records",
];

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(
          result.message ??
            "Unable to sign in. Check your details and try again.",
        );
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("The server could not be reached. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      id="zedstay-login"
      className="min-h-screen bg-slate-50 text-slate-900"
    >
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden min-h-screen border-0 bg-[#071126] p-10 text-white lg:flex lg:flex-col xl:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(37,99,235,0.32),transparent_30rem),radial-gradient(circle_at_88%_80%,rgba(5,150,105,0.23),transparent_28rem)]" />
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(148,163,184,0.13)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.13)_1px,transparent_1px)] [background-size:42px_42px]" />

          <div className="relative flex h-full flex-col">
            <Link href="/" className="flex w-fit items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-[17px] bg-gradient-to-br from-emerald-400 to-blue-600 shadow-lg shadow-blue-950/40">
                <Hotel size={25} />
              </span>
              <div>
                <p className="text-2xl font-black tracking-tight text-white">
                  ZedStay
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Hospitality management
                </p>
              </div>
            </Link>

            <div className="my-auto max-w-xl py-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-xs font-bold text-emerald-300">
                <ShieldCheck size={15} /> Protected staff workspace
              </div>
              <h1
                className="mt-7 text-5xl font-black leading-[1.05] tracking-[-0.05em] xl:text-6xl"
                style={{ color: "#ffffff" }}
              >
                Welcome back to better hospitality operations.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
                Sign in to manage guests, rooms, reservations, payments and
                daily property performance.
              </p>

              <div className="mt-9 space-y-4">
                {highlights.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 text-sm font-semibold text-slate-300"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
                      <Check size={15} />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: BedDouble, label: "Rooms" },
                { icon: Sparkles, label: "Operations" },
                { icon: BarChart3, label: "Reports" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="rounded-[18px] border border-white/10 bg-white/5 p-4 backdrop-blur"
                >
                  <Icon size={19} className="text-emerald-300" />
                  <p className="mt-3 text-xs font-bold text-slate-300">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative flex min-h-screen items-center justify-center border-0 bg-white px-5 py-10 sm:px-8 lg:bg-slate-50">
          <div className="absolute left-5 top-5 sm:left-8 sm:top-7 lg:hidden">
            <Link
              href="/"
              className="flex items-center gap-2 font-black text-slate-950"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 text-white">
                <Hotel size={18} />
              </span>
              ZedStay
            </Link>
          </div>

          <Link
            href="/"
            className="absolute right-5 top-6 hidden items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-700 sm:right-8 lg:inline-flex"
          >
            <ArrowLeft size={16} /> Back to home
          </Link>

          <div className="w-full max-w-md pt-14 lg:pt-0">
            <div className="mb-8">
              <span className="inline-flex rounded-[16px] bg-blue-50 p-3 text-blue-700">
                <LockKeyhole size={23} />
              </span>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
                Staff portal
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.045em] text-slate-950">
                Sign in securely
              </h2>
              <p className="mt-3 leading-7 text-slate-500">
                Enter the email address and password assigned to your staff
                account.
              </p>
            </div>

            <form
              onSubmit={submit}
              className="space-y-5 rounded-[26px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-7"
            >
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Email address
                </span>
                <span className="relative block">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    autoFocus
                    placeholder="name@yourproperty.com"
                    className="h-13 w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Password
                </span>
                <span className="relative block">
                  <KeyRound
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
                    className="h-13 w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-12 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>

              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-bold text-emerald-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 px-5 py-3.5 font-black text-white shadow-lg shadow-blue-500/20 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <LoaderCircle className="animate-spin" size={19} />
                ) : (
                  <LogIn size={19} />
                )}
                {loading ? "Signing you in..." : "Sign in to dashboard"}
              </button>
            </form>

            <div className="mt-6 flex items-start gap-3 rounded-[18px] bg-slate-100 p-4 text-sm text-slate-600">
              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-emerald-600"
              />
              <p>
                <b className="text-slate-800">Authorised access only.</b>
                <br />
                Contact your property administrator if you cannot access your
                account.
              </p>
            </div>

            <p className="mt-8 text-center text-xs text-slate-400">
              Protected by secure sessions and role-based access control.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
