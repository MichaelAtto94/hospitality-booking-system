import Link from "next/link";
import { BedDouble, CalendarDays, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-7xl items-center px-6 py-20">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
            <ShieldCheck size={17} /> Built for Zambian hotels and lodges
          </div>
          <h1 className="text-5xl font-black leading-tight tracking-tight md:text-7xl">Manage every stay from one simple system.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Handle room availability, reservations, guest records, check-ins, mobile-money payments, expenses and management reports.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/dashboard" className="rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950">Open dashboard</Link>
            <a href="#features" className="rounded-xl border border-slate-700 px-6 py-3 font-bold">View features</a>
          </div>
          <div id="features" className="mt-14 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><BedDouble className="text-emerald-400" /><h2 className="mt-3 font-bold">Room management</h2><p className="mt-1 text-sm text-slate-400">Live room status, types, rates and maintenance.</p></div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><CalendarDays className="text-emerald-400" /><h2 className="mt-3 font-bold">Booking calendar</h2><p className="mt-1 text-sm text-slate-400">Prevent double bookings and manage arrivals.</p></div>
          </div>
        </div>
      </section>
    </main>
  );
}
