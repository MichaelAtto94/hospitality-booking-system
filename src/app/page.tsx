import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BedDouble,
  CalendarCheck,
  Check,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Hotel,
  Menu,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

const features = [
  {
    icon: CalendarCheck,
    title: "Smart reservations",
    description: "Manage walk-ins, online requests and future stays while automatically preventing double bookings.",
    colour: "bg-blue-50 text-blue-700",
  },
  {
    icon: BedDouble,
    title: "Room operations",
    description: "See availability, occupancy, cleaning and maintenance status from one real-time workspace.",
    colour: "bg-emerald-50 text-emerald-700",
  },
  {
    icon: Users,
    title: "Guest management",
    description: "Keep organised guest profiles, identification details, contact information and stay history.",
    colour: "bg-violet-50 text-violet-700",
  },
  {
    icon: CreditCard,
    title: "Zambian payments",
    description: "Record cash, cards, bank transfers and local mobile-money payments with professional receipts.",
    colour: "bg-amber-50 text-amber-700",
  },
  {
    icon: Sparkles,
    title: "Housekeeping workflow",
    description: "Coordinate room cleaning and maintenance so reception always knows which rooms are ready.",
    colour: "bg-pink-50 text-pink-700",
  },
  {
    icon: BarChart3,
    title: "Management reports",
    description: "Monitor revenue, expenses, occupancy and operations with clear reports and audit records.",
    colour: "bg-cyan-50 text-cyan-700",
  },
];

const benefits = [
  "Purpose-built for hotels and lodges",
  "Secure role-based staff access",
  "Prices and reports in Zambian Kwacha",
  "Works on desktop, tablet and mobile",
];

export default function HomePage() {
  return (
    <main id="zedstay-landing" className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative min-h-[760px] border-0 bg-[#061126] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(37,99,235,0.28),transparent_34rem),radial-gradient(circle_at_86%_22%,rgba(5,150,105,0.22),transparent_30rem)]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(148,163,184,0.13)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.13)_1px,transparent_1px)] [background-size:42px_42px]" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <header className="flex h-20 items-center justify-between border-b border-white/10">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-[16px] bg-gradient-to-br from-emerald-400 to-blue-600 shadow-lg shadow-blue-950/40">
                <Hotel size={23} />
              </span>
              <div>
                <p className="text-xl font-black tracking-tight text-white">ZedStay</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Hospitality management</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-300 md:flex">
              <a href="#features" className="hover:text-white">Features</a>
              <a href="#why-zedstay" className="hover:text-white">Why ZedStay</a>
              <a href="#contact" className="hover:text-white">Get started</a>
            </nav>

            <div className="flex items-center gap-2">
              <Link href="/login" className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/10 sm:inline-flex">Staff login</Link>
              <Link href="/book" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 shadow-lg hover:bg-emerald-50">
                Book a stay <ArrowRight size={16} />
              </Link>
              <Menu className="ml-1 md:hidden" size={21} />
            </div>
          </header>

          <div className="grid items-center gap-14 py-20 lg:grid-cols-[1.02fr_0.98fr] lg:py-28">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-bold text-emerald-300">
                <ShieldCheck size={15} /> Built for Zambian hotels and lodges
              </div>
              <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[1.03] tracking-[-0.055em] md:text-6xl xl:text-7xl" style={{ color: "#ffffff" }}>
                Every stay.
                <span className="block bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">One simple system.</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">
                Run reservations, rooms, guests, front desk, payments and reports from a secure platform designed around real hospitality operations.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-emerald-950/30 hover:brightness-110">
                  Open dashboard <ArrowRight size={17} />
                </Link>
                <a href="#features" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-black text-white hover:border-white/40 hover:bg-white/10">
                  Explore features <ChevronRight size={17} />
                </a>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3">
                {benefits.slice(0, 3).map((benefit) => (
                  <span key={benefit} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <Check size={14} className="text-emerald-400" /> {benefit}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-8 rounded-full bg-blue-500/15 blur-3xl" />
              <div className="relative rounded-[30px] border border-white/15 bg-white/10 p-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
                <div className="rounded-[22px] bg-slate-50 p-5 text-slate-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400">PROPERTY OVERVIEW</p>
                      <p className="mt-1 font-black text-slate-950">Today at your lodge</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700">LIVE</span>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {[
                      { label: "Available", value: "18", icon: BedDouble, tone: "text-emerald-600 bg-emerald-50" },
                      { label: "Arrivals", value: "06", icon: CalendarCheck, tone: "text-blue-600 bg-blue-50" },
                      { label: "In-house", value: "24", icon: Users, tone: "text-violet-600 bg-violet-50" },
                      { label: "Revenue", value: "K 18,450", icon: CircleDollarSign, tone: "text-amber-600 bg-amber-50" },
                    ].map(({ label, value, icon: Icon, tone }) => (
                      <div key={label} className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
                        <span className={`inline-flex rounded-xl p-2 ${tone}`}><Icon size={17} /></span>
                        <p className="mt-4 text-[11px] font-semibold text-slate-500">{label}</p>
                        <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-[18px] bg-[#0b1634] p-4 text-white">
                    <div className="flex items-center justify-between text-xs"><span>Room occupancy</span><b>72%</b></div>
                    <div className="mt-3 h-2 rounded-full bg-white/10"><div className="h-2 w-[72%] rounded-full bg-gradient-to-r from-emerald-400 to-blue-400" /></div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-5 hidden rounded-[18px] border border-white/15 bg-[#0c1a37]/90 p-4 text-white shadow-xl backdrop-blur lg:block">
                <div className="flex items-center gap-3"><Star className="fill-amber-400 text-amber-400" size={18} /><div><p className="text-xs text-slate-400">Guest experience</p><p className="text-sm font-black">Faster service</p></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-6 border-0 bg-white px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Complete property control</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">Everything your team needs to operate confidently.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-500">From the first booking request to checkout and reporting, every department works from the same reliable information.</p>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map(({ icon: Icon, title, description, colour }, index) => (
              <div key={title} className="group rounded-[24px] border border-slate-200 bg-slate-50/70 p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-xl hover:shadow-slate-200/60">
                <div className="flex items-start justify-between">
                  <span className={`inline-flex rounded-[16px] p-3 ${colour}`}><Icon size={22} /></span>
                  <span className="text-xs font-black text-slate-300">0{index + 1}</span>
                </div>
                <h3 className="mt-6 text-xl font-black text-slate-950">{title}</h3>
                <p className="mt-3 leading-7 text-slate-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="why-zedstay" className="border-0 bg-slate-50 px-5 py-24 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Made for local operations</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">Professional software without unnecessary complexity.</h2>
            <p className="mt-6 text-lg leading-8 text-slate-500">ZedStay gives managers, receptionists, accountants and housekeepers the tools relevant to their responsibilities.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {benefits.map((benefit) => <div key={benefit} className="flex items-start gap-3 rounded-[18px] border border-slate-200 bg-white p-4"><span className="mt-0.5 rounded-full bg-emerald-100 p-1 text-emerald-700"><Check size={14} /></span><span className="text-sm font-bold text-slate-700">{benefit}</span></div>)}
            </div>
          </div>
          <div className="rounded-[30px] bg-gradient-to-br from-blue-600 to-emerald-600 p-8 text-white shadow-2xl shadow-blue-500/20 md:p-10">
            <ShieldCheck size={38} />
            <h3 className="mt-8 text-3xl font-black" style={{ color: "white" }}>Secure by design.</h3>
            <p className="mt-4 leading-7 text-blue-50">Role-based access, protected routes, secure passwords, audit records, database backups and automated quality checks help protect your operation.</p>
            <Link href="/login" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-blue-700">Access staff portal <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      <section id="contact" className="border-0 bg-[#071126] px-5 py-20 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 rounded-[30px] border border-white/10 bg-white/5 p-8 text-center md:flex-row md:p-12 md:text-left">
          <div><p className="text-sm font-bold text-emerald-300">Ready to improve your property operations?</p><h2 className="mt-2 text-3xl font-black" style={{ color: "white" }}>Start managing every stay with confidence.</h2></div>
          <div className="flex flex-col gap-3 sm:flex-row"><Link href="/book" className="rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-black text-white">Book a stay</Link><Link href="/login" className="rounded-xl border border-white/20 px-6 py-3.5 text-sm font-black text-white">Staff login</Link></div>
        </div>
        <footer className="mx-auto mt-12 flex max-w-7xl flex-col justify-between gap-4 border-t border-white/10 pt-7 text-xs text-slate-500 sm:flex-row"><p>Â© {new Date().getFullYear()} ZedStay Hospitality Management.</p><p>Built for Zambia Â· Secure Â· Reliable Â· Responsive</p></footer>
      </section>
    </main>
  );
}
