"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { StrongPasswordFields } from "@/components/strong-password-fields";
type Step = "email" | "code" | "password" | "complete";
export default function ForgotPassword() {
  const [step, setStep] = useState<Step>("email"),
    [email, setEmail] = useState(""),
    [token, setToken] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  async function send(path: string, body: object) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch(path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
        d = await r.json();
      if (!r.ok) {
        setError(d.message ?? "Unable to continue");
        return null;
      }
      setMessage(d.message ?? "");
      return d;
    } catch {
      setError("Network error. Try again.");
      return null;
    } finally {
      setLoading(false);
    }
  }
  async function request(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = String(new FormData(e.currentTarget).get("email") ?? "")
        .trim()
        .toLowerCase(),
      d = await send("/api/auth/forgot-password/request", { email: value });
    if (d) {
      setEmail(value);
      setStep("code");
    }
  }
  async function verify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? ""),
      d = await send("/api/auth/forgot-password/verify", { email, code });
    if (d?.resetToken) {
      setToken(d.resetToken);
      setStep("password");
    }
  }
  async function reset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget,
      v = new FormData(f),
      d = await send("/api/auth/forgot-password/reset", {
        email,
        resetToken: token,
        password: v.get("password"),
        confirmPassword: v.get("confirmPassword"),
      });
    if (d) {
      f.reset();
      setToken("");
      setStep("complete");
    }
  }
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] px-5 py-10 text-white">
      <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
      <section className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl items-center">
        <div className="grid overflow-hidden rounded-[34px] border border-white/10 shadow-2xl lg:grid-cols-[.85fr_1.15fr]">
          <aside className="bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-800 p-9 sm:p-12">
            <ShieldCheck size={38} />
            <p className="mt-10 text-xs font-black uppercase tracking-[.2em]">
              Secure recovery
            </p>
            <h1 className="mt-3 text-4xl font-black">Confirm your identity.</h1>
            <p className="mt-5 leading-7 text-white/85">
              We send a private six-digit code to your registered staff email
              before allowing a password change.
            </p>
            <div className="mt-9 space-y-3 text-sm">
              <p className="flex gap-2">
                <CheckCircle2 size={18} />
                Ten-minute expiry
              </p>
              <p className="flex gap-2">
                <CheckCircle2 size={18} />
                Five-attempt limit
              </p>
            </div>
          </aside>
          <div className="bg-white p-8 text-slate-950 sm:p-12">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-500"
            >
              <ArrowLeft size={16} />
              Back to sign in
            </Link>
            <div className="mt-8">
              {step === "email" && (
                <>
                  <Heading
                    n="1"
                    title="Find your account"
                    text="Enter the email registered on your staff account."
                  />
                  <form
                    onSubmit={request}
                    className="mt-8 space-y-5 rounded-[26px] border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80 p-5 shadow-[0_24px_60px_-35px_rgba(15,23,42,0.45)] sm:p-6"
                  >
                    <label className="group block">
                      <b className="mb-2.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-600">
                        Email address
                      </b>
                      <div className="relative rounded-2xl bg-white shadow-sm transition duration-200 focus-within:-translate-y-0.5 focus-within:shadow-[0_16px_35px_-20px_rgba(16,185,129,0.65)]">
                        <Mail
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600"
                          size={19}
                        />
                        <input
                          name="email"
                          type="email"
                          required
                          autoComplete="email"
                          className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-[15px] font-semibold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                          placeholder="name@example.com"
                        />
                      </div>
                    </label>
                    <Button busy={loading} text="Send verification code" />
                  </form>
                </>
              )}
              {step === "code" && (
                <>
                  <Heading
                    n="2"
                    title="Enter your code"
                    text={"Check the inbox for " + email + "."}
                  />
                  <form
                    onSubmit={verify}
                    className="mt-8 space-y-5 rounded-[26px] border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80 p-5 shadow-[0_24px_60px_-35px_rgba(15,23,42,0.45)] sm:p-6"
                  >
                    <input
                      name="code"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      autoComplete="one-time-code"
                      className="h-16 w-full rounded-2xl border border-slate-200 bg-white px-4 text-center text-3xl font-black tracking-[0.42em] text-slate-900 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                      placeholder="000000"
                    />
                    <Button busy={loading} text="Confirm identity" />
                    <button
                      type="button"
                      onClick={() => setStep("email")}
                      className="w-full rounded-xl py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      Use another email
                    </button>
                  </form>
                </>
              )}
              {step === "password" && (
                <>
                  <Heading
                    n="3"
                    title="Create a new password"
                    text="Choose a strong password you have not used before."
                  />
                  <form
                    onSubmit={reset}
                    className="mt-8 space-y-5 rounded-[26px] border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80 p-5 shadow-[0_24px_60px_-35px_rgba(15,23,42,0.45)] sm:p-6"
                  >
                    <StrongPasswordFields
                      passwordName="password"
                      confirmName="confirmPassword"
                      passwordLabel="New password"
                      confirmLabel="Confirm new password"
                    />
                    <Button busy={loading} text="Reset password" />
                  </form>
                </>
              )}
              {step === "complete" && (
                <div className="py-10 text-center">
                  <CheckCircle2
                    className="mx-auto text-emerald-600"
                    size={64}
                  />
                  <h2 className="mt-5 text-3xl font-black">Password changed</h2>
                  <p className="mt-3 text-slate-500">{message}</p>
                  <Link
                    href="/login"
                    className="mt-7 inline-flex rounded-xl bg-emerald-600 px-6 py-3 font-black text-white"
                  >
                    Sign in
                  </Link>
                </div>
              )}
              {error && (
                <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">
                  {error}
                </p>
              )}
              {message && step !== "complete" && (
                <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
function Heading({
  n,
  title,
  text,
}: {
  n: string;
  title: string;
  text: string;
}) {
  return (
    <>
      <p className="text-xs font-black uppercase tracking-[.18em] text-emerald-700">
        Step {n}
      </p>
      <h2 className="mt-2 text-3xl font-black">{title}</h2>
      <p className="mt-2 text-slate-500">{text}</p>
    </>
  );
}
function Button({ busy, text }: { busy: boolean; text: string }) {
  return (
    <button
      disabled={busy}
      className="group/button relative inline-flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 px-5 font-black text-white shadow-[0_18px_35px_-18px_rgba(5,150,105,0.9)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_40px_-18px_rgba(79,70,229,0.8)] focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
    >
      {busy ? (
        <LoaderCircle className="animate-spin" size={18} />
      ) : (
        <KeyRound size={18} />
      )}{" "}
      {busy ? "Please wait..." : text}
    </button>
  );
}
