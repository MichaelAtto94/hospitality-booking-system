"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LockKeyhole, Save, ShieldCheck, UserRound } from "lucide-react";
import { StrongPasswordFields } from "@/components/strong-password-fields";

type Account = { firstName: string; lastName: string; email: string; phone: string | null; role: string };
const input = "mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

export default function AccountPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"success" | "error">("success");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => { fetch("/api/account").then((response) => response.json()).then(setAccount); }, []);

  async function profile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
    const result = await response.json();
    setTone(response.ok ? "success" : "error"); setMessage(response.ok ? "Profile updated successfully" : result.message);
    if (response.ok) setAccount(result);
  }

  async function password(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSavingPassword(true); setMessage("");
    const response = await fetch("/api/account/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
    const result = await response.json(); setSavingPassword(false); setTone(response.ok ? "success" : "error"); setMessage(result.message);
    if (response.ok) setTimeout(() => { router.replace("/login"); router.refresh(); }, 1200);
  }

  if (!account) return <main className="grid min-h-[500px] place-items-center"><LoaderCircle className="animate-spin text-blue-600" /></main>;

  return <main className="p-5 md:p-8 xl:p-10"><div className="flex items-center gap-4"><span className="rounded-[16px] bg-blue-50 p-3 text-blue-700"><UserRound /></span><div><h1 className="text-4xl font-black tracking-[-0.04em]">My account</h1><p className="text-slate-500">Profile information and password security.</p></div></div>{message && <p className={`mt-6 rounded-xl border p-4 text-sm font-bold ${tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>{message}</p>}<div className="mt-7 grid gap-6 xl:grid-cols-2"><form onSubmit={profile} className="space-y-5 rounded-[26px] border bg-white p-6 shadow-sm"><div className="border-b border-slate-100 pb-4"><h2 className="text-lg font-black">Profile details</h2><p className="text-sm text-slate-500">Keep your staff information accurate.</p></div><label className="block text-sm font-bold text-slate-700">First name<input name="firstName" defaultValue={account.firstName} required className={input} /></label><label className="block text-sm font-bold text-slate-700">Last name<input name="lastName" defaultValue={account.lastName} required className={input} /></label><label className="block text-sm font-bold text-slate-700">Email<input value={account.email} disabled className={`${input} bg-slate-100`} /></label><label className="block text-sm font-bold text-slate-700">Phone<input name="phone" defaultValue={account.phone ?? ""} className={input} /></label><button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-black text-white"><Save size={17} />Save profile</button></form><form onSubmit={password} className="space-y-5 rounded-[26px] border bg-white p-6 shadow-sm"><div className="flex items-start gap-3 border-b border-slate-100 pb-4"><span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><ShieldCheck size={19} /></span><div><h2 className="text-lg font-black">Change password</h2><p className="text-sm text-slate-500">You will sign in again after changing it.</p></div></div><label className="block text-sm font-bold text-slate-700">Current password<input name="currentPassword" type="password" required autoComplete="current-password" className={input} /></label><StrongPasswordFields passwordName="newPassword" passwordLabel="New strong password" /><button disabled={savingPassword} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 font-black text-white disabled:opacity-60">{savingPassword ? <LoaderCircle className="animate-spin" size={18} /> : <LockKeyhole size={18} />}{savingPassword ? "Changing password..." : "Change password securely"}</button></form></div></main>;
}
