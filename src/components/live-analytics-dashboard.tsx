"use client";

import {
  Activity,
  BedDouble,
  CalendarCheck,
  CircleDollarSign,
  Clock3,
  CreditCard,
  LoaderCircle,
  RefreshCw,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Item = { name: string; count: number; amount?: number };
type Analytics = {
  generatedAt: string;
  timezone: string;
  metrics: {
    totalRooms: number; availableRooms: number; occupiedRooms: number; occupancyRate: number;
    arrivalsToday: number; departuresToday: number; pendingBookings: number;
    revenueToday: number; averageRoomRevenue: number; revenueMonth: number; expensesMonth: number; netMonth: number;
  };
  trend: { key: string; label: string; revenue: number; expenses: number }[];
  paymentMethods: Item[];
  bookingStatuses: Item[];
  roomStatuses: Item[];
  bookingSources: Item[];
};

const colours = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500", "bg-cyan-500", "bg-rose-500"];
const money = (value: number) => `K ${value.toLocaleString("en-ZM", { maximumFractionDigits: 0 })}`;
const pretty = (value: string) => value.replaceAll("_", " ");

function Distribution({ title, subtitle, items }: { title: string; subtitle: string; items: Item[] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  return (
    <div className="rounded-[24px] border bg-white p-6 shadow-sm">
      <h2 className="font-black text-slate-950">{title}</h2><p className="text-sm text-slate-500">{subtitle}</p>
      <div className="mt-6 space-y-4">
        {items.map((item, index) => {
          const percentage = total === 0 ? 0 : Math.round((item.count / total) * 100);
          return <div key={item.name}><div className="mb-2 flex justify-between gap-3 text-xs"><span className="font-bold text-slate-600">{pretty(item.name)}</span><span className="text-slate-400">{item.count} Â· {percentage}%</span></div><div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${colours[index % colours.length]}`} style={{ width: `${percentage}%` }} /></div></div>;
        })}
        {items.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No data available yet.</p>}
      </div>
    </div>
  );
}

export function LiveAnalyticsDashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    try {
      const response = await fetch("/api/analytics/live", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Unable to load analytics");
      setData(result);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load analytics");
    } finally {
      if (!quiet) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => { void load(); }, 0);
    const interval = window.setInterval(() => { void load(true); }, 30000);
    return () => { window.clearTimeout(initial); window.clearInterval(interval); };
  }, [load]);

  const chartMaximum = useMemo(() => Math.max(1, ...(data?.trend.flatMap((day) => [day.revenue, day.expenses]) ?? [1])), [data]);

  if (!data && !error) return <div className="grid min-h-[500px] place-items-center"><div className="text-center"><LoaderCircle className="mx-auto animate-spin text-blue-600" /><p className="mt-3 text-sm text-slate-500">Loading live analytics...</p></div></div>;

  return (
    <main className="p-5 md:p-8 xl:p-10">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div><div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Live Â· refreshes every 30 seconds</div><h1 className="mt-4 text-4xl font-black tracking-[-0.045em] text-slate-950">Real-time analytics</h1><p className="mt-2 text-slate-500">Revenue, occupancy and operational performance in Africa/Lusaka time.</p></div>
        <button onClick={() => void load()} disabled={refreshing} className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm disabled:opacity-60"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh now</button>
      </div>

      {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
      {data && <>
        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Occupancy", value: `${data.metrics.occupancyRate}%`, note: `${data.metrics.occupiedRooms} of ${data.metrics.totalRooms} rooms`, icon: BedDouble, tone: "bg-blue-50 text-blue-700" },
            { label: "Revenue today", value: money(data.metrics.revenueToday), note: `Average ${money(data.metrics.averageRoomRevenue)} per occupied room`, icon: CircleDollarSign, tone: "bg-emerald-50 text-emerald-700" },
            { label: "Net this month", value: money(data.metrics.netMonth), note: `${money(data.metrics.revenueMonth)} revenue`, icon: TrendingUp, tone: data.metrics.netMonth >= 0 ? "bg-violet-50 text-violet-700" : "bg-red-50 text-red-700" },
            { label: "Expenses this month", value: money(data.metrics.expensesMonth), note: `${data.metrics.pendingBookings} bookings pending`, icon: WalletCards, tone: "bg-amber-50 text-amber-700" },
          ].map(({ label, value, note, icon: Icon, tone }) => <div key={label} className="rounded-[24px] border bg-white p-5 shadow-sm"><span className={`inline-flex rounded-[16px] p-3 ${tone}`}><Icon size={21} /></span><p className="mt-5 text-sm font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-950">{value}</p><p className="mt-2 text-xs text-slate-400">{note}</p></div>)}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.7fr]">
          <div className="rounded-[26px] border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between"><div><h2 className="font-black text-slate-950">Seven-day financial trend</h2><p className="text-sm text-slate-500">Completed revenue compared with recorded expenses</p></div><Activity className="text-blue-600" /></div>
            <div className="mt-8 flex h-64 items-end gap-3 border-b border-slate-200 px-2">
              {data.trend.map((day) => <div key={day.key} className="flex h-full flex-1 flex-col justify-end"><div className="flex flex-1 items-end justify-center gap-1"><div title={`Revenue ${money(day.revenue)}`} className="w-3 rounded-t bg-gradient-to-t from-blue-700 to-cyan-400 sm:w-5" style={{ height: `${Math.max(day.revenue ? 5 : 0, (day.revenue / chartMaximum) * 100)}%` }} /><div title={`Expenses ${money(day.expenses)}`} className="w-3 rounded-t bg-gradient-to-t from-amber-600 to-orange-300 sm:w-5" style={{ height: `${Math.max(day.expenses ? 5 : 0, (day.expenses / chartMaximum) * 100)}%` }} /></div><p className="py-3 text-center text-[10px] font-bold text-slate-500 sm:text-xs">{day.label}</p></div>)}
            </div>
            <div className="mt-4 flex gap-5 text-xs font-bold text-slate-500"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-blue-500" />Revenue</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-amber-500" />Expenses</span></div>
          </div>

          <div className="space-y-4">
            {[
              { label: "Arrivals today", value: data.metrics.arrivalsToday, icon: CalendarCheck, tone: "text-blue-600 bg-blue-50" },
              { label: "Departures today", value: data.metrics.departuresToday, icon: Clock3, tone: "text-violet-600 bg-violet-50" },
              { label: "Available rooms", value: data.metrics.availableRooms, icon: BedDouble, tone: "text-emerald-600 bg-emerald-50" },
            ].map(({ label, value, icon: Icon, tone }) => <div key={label} className="flex items-center gap-4 rounded-[20px] border bg-white p-5 shadow-sm"><span className={`rounded-[14px] p-3 ${tone}`}><Icon size={20} /></span><div><p className="text-xs font-bold text-slate-500">{label}</p><p className="text-2xl font-black text-slate-950">{value}</p></div></div>)}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <Distribution title="Booking status" subtitle="All reservation records" items={data.bookingStatuses} />
          <Distribution title="Room status" subtitle="Current property inventory" items={data.roomStatuses} />
          <div className="rounded-[24px] border bg-white p-6 shadow-sm"><h2 className="font-black text-slate-950">Payment methods</h2><p className="text-sm text-slate-500">Completed payments this month</p><div className="mt-6 space-y-3">{data.paymentMethods.map((item, index) => <div key={item.name} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><div className="flex items-center gap-3"><span className={`rounded-lg p-2 text-white ${colours[index % colours.length]}`}><CreditCard size={15} /></span><div><p className="text-xs font-black text-slate-700">{pretty(item.name)}</p><p className="text-[10px] text-slate-400">{item.count} payment(s)</p></div></div><p className="text-sm font-black text-slate-900">{money(item.amount ?? 0)}</p></div>)}{data.paymentMethods.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No payments this month.</p>}</div></div>
        </section>

        <p className="mt-6 text-right text-xs text-slate-400">Last updated {new Date(data.generatedAt).toLocaleTimeString("en-ZM")}</p>
      </>}
    </main>
  );
}
