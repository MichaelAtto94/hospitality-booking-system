"use client";

import Link from "next/link";
import { StrongPasswordFields } from "@/components/strong-password-fields";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Hotel,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

const provinces = [
  "Central Province",
  "Copperbelt Province",
  "Eastern Province",
  "Luapula Province",
  "Lusaka Province",
  "Muchinga Province",
  "Northern Province",
  "North-Western Province",
  "Southern Province",
  "Western Province",
];

const inputClass = "mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

export default function SetupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.message ?? "Unable to complete setup. Check the information and try again.");
        return;
      }
      router.push("/login?setup=success");
    } catch {
      setError("The server could not be reached. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main id="zedstay-setup" className="min-h-screen bg-slate-50 text-slate-900">
      <div className="min-h-screen lg:grid lg:grid-cols-[340px_1fr]">
        <aside className="relative hidden overflow-hidden bg-[#071126] p-8 text-white lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.34),transparent_24rem),radial-gradient(circle_at_70%_90%,rgba(5,150,105,0.22),transparent_22rem)]" />
          <div className="relative flex h-full flex-col">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-[16px] bg-gradient-to-br from-emerald-400 to-blue-600"><Hotel size={23} /></span>
              <div><p className="text-xl font-black text-white">ZedStay</p><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Initial configuration</p></div>
            </Link>

            <div className="my-auto">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Getting started</p>
              <h1 className="mt-4 text-4xl font-black leading-tight tracking-[-0.045em]" style={{ color: "white" }}>Set up your property securely.</h1>
              <p className="mt-5 leading-7 text-slate-300">This one-time process creates your property and its first Super Administrator.</p>

              <div className="mt-10 space-y-6">
                {[
                  { number: "01", title: "Property profile", note: "Business identity and location" },
                  { number: "02", title: "Administrator", note: "Your first secure staff account" },
                  { number: "03", title: "Start operating", note: "Add rooms, rates and staff" },
                ].map((step, index) => (
                  <div key={step.number} className="flex gap-4">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-black ${index < 2 ? "bg-emerald-400 text-slate-950" : "border border-white/20 bg-white/5 text-slate-400"}`}>{step.number}</span>
                    <div><p className="font-bold text-white">{step.title}</p><p className="mt-1 text-xs text-slate-400">{step.note}</p></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
              <div className="flex gap-3"><ShieldCheck size={20} className="shrink-0 text-emerald-300" /><p className="text-xs leading-5 text-slate-400">Setup is disabled automatically after the first administrator has been created.</p></div>
            </div>
          </div>
        </aside>

        <section className="border-0 px-5 py-8 sm:px-8 lg:px-12 lg:py-10 xl:px-16">
          <div className="mx-auto max-w-5xl">
            <header className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-700"><ArrowLeft size={16} /> Back home</Link>
              <p className="text-sm text-slate-500">Already configured? <Link href="/login" className="font-black text-blue-700">Sign in</Link></p>
            </header>

            <div className="mt-10">
              <div className="flex items-start gap-4">
                <span className="grid h-13 w-13 shrink-0 place-items-center rounded-[18px] bg-gradient-to-br from-blue-600 to-emerald-500 text-white shadow-lg shadow-blue-500/20"><Building2 size={25} /></span>
                <div><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">One-time configuration</p><h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-4xl">Create your hospitality workspace</h2><p className="mt-2 text-slate-500">Enter accurate property and administrator details. You can update property settings later.</p></div>
              </div>

              <form onSubmit={submit} className="mt-8 space-y-7 rounded-[28px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-8">
                <section className="border-0">
                  <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-700"><Building2 size={18} /></span>
                    <div><h3 className="font-black text-slate-950">Property information</h3><p className="text-xs text-slate-500">How your hotel or lodge will appear in the system</p></div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="md:col-span-2"><span className="text-sm font-bold text-slate-700">Property name</span><input name="propertyName" required className={inputClass} placeholder="Example: Mukuyu Lodge" /></label>
                    <label><span className="text-sm font-bold text-slate-700">Property type</span><select name="propertyType" className={inputClass}><option value="LODGE">Lodge</option><option value="HOTEL">Hotel</option><option value="GUEST_HOUSE">Guest house</option><option value="RESORT">Resort</option></select></label>
                    <label><span className="text-sm font-bold text-slate-700">Business phone</span><span className="relative block"><Phone size={17} className="absolute left-4 top-[26px] text-slate-400" /><input name="phone" required className={`${inputClass} pl-11`} placeholder="0977 000 000" /></span></label>
                    <label className="md:col-span-2"><span className="text-sm font-bold text-slate-700">Physical address</span><span className="relative block"><MapPin size={17} className="absolute left-4 top-[26px] text-slate-400" /><input name="address" required className={`${inputClass} pl-11`} placeholder="Plot number and street" /></span></label>
                    <label><span className="text-sm font-bold text-slate-700">Town or district</span><input name="town" required className={inputClass} placeholder="Lusaka" /></label>
                    <label><span className="text-sm font-bold text-slate-700">Province</span><select name="province" required className={inputClass} defaultValue=""><option value="" disabled>Select province</option>{provinces.map((province) => <option key={province}>{province}</option>)}</select></label>
                  </div>
                </section>

                <section className="border-0">
                  <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><UserRound size={18} /></span>
                    <div><h3 className="font-black text-slate-950">Super Administrator</h3><p className="text-xs text-slate-500">The first account with complete system access</p></div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <label><span className="text-sm font-bold text-slate-700">First name</span><input name="firstName" required autoComplete="given-name" className={inputClass} /></label>
                    <label><span className="text-sm font-bold text-slate-700">Last name</span><input name="lastName" required autoComplete="family-name" className={inputClass} /></label>
                    <label className="md:col-span-2"><span className="text-sm font-bold text-slate-700">Email address</span><span className="relative block"><Mail size={17} className="absolute left-4 top-[26px] text-slate-400" /><input name="email" type="email" required autoComplete="email" className={`${inputClass} pl-11`} placeholder="admin@yourproperty.com" /></span></label>
                    <div className="md:col-span-2"><StrongPasswordFields passwordName="password" passwordLabel="Strong administrator password" /></div>
                  </div>
                </section>

                {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

                <div className="flex flex-col justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={16} className="text-emerald-600" /> Your password is stored securely.</div>
                  <button disabled={loading} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 px-6 py-3.5 font-black text-white shadow-lg shadow-blue-500/20 hover:brightness-110 disabled:opacity-60">{loading ? <LoaderCircle className="animate-spin" size={19} /> : <LockKeyhole size={19} />}{loading ? "Creating workspace..." : "Complete secure setup"}</button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

