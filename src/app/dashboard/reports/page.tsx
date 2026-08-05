import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const user = await getCurrentUser(); if (!user) redirect("/login");
  const params = await searchParams; const now = new Date(); const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const from = params.from ? new Date(`${params.from}T00:00:00`) : first; const to = params.to ? new Date(`${params.to}T23:59:59.999`) : now;
  const [revenue, expenses, bookings, rooms, occupied] = await Promise.all([
    prisma.payment.aggregate({ where: { booking: { propertyId: user.propertyId }, status: "COMPLETED", paidAt: { gte: from, lte: to } }, _sum: { amount: true }, _count: true }),
    prisma.expense.aggregate({ where: { propertyId: user.propertyId, expenseDate: { gte: from, lte: to } }, _sum: { amount: true }, _count: true }),
    prisma.booking.count({ where: { propertyId: user.propertyId, createdAt: { gte: from, lte: to }, status: { notIn: ["CANCELLED", "NO_SHOW"] } } }),
    prisma.room.count({ where: { propertyId: user.propertyId, status: { not: "OUT_OF_SERVICE" } } }),
    prisma.room.count({ where: { propertyId: user.propertyId, status: "OCCUPIED" } }),
  ]);
  const income = Number(revenue._sum.amount ?? 0); const costs = Number(expenses._sum.amount ?? 0); const net = income - costs; const occupancy = rooms ? Math.round((occupied / rooms) * 100) : 0;
  const cards = [{label:"Revenue",value:`K ${income.toLocaleString()}`,tone:"text-emerald-700"},{label:"Expenses",value:`K ${costs.toLocaleString()}`,tone:"text-red-700"},{label:"Net position",value:`K ${net.toLocaleString()}`,tone:net>=0?"text-blue-700":"text-red-700"},{label:"Current occupancy",value:`${occupancy}%`,tone:"text-violet-700"}];
  return <main className="p-5 md:p-8"><h1 className="text-3xl font-black">Financial reports</h1><p className="text-slate-500">Revenue, costs and operating performance.</p><form className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border bg-white p-5"><label className="text-sm">From<input name="from" type="date" defaultValue={from.toISOString().slice(0,10)} className="mt-1 block rounded-xl border px-3 py-2"/></label><label className="text-sm">To<input name="to" type="date" defaultValue={to.toISOString().slice(0,10)} className="mt-1 block rounded-xl border px-3 py-2"/></label><button className="rounded-xl bg-slate-950 px-5 py-2.5 font-bold text-white">Apply dates</button></form><section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(card=><article key={card.label} className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">{card.label}</p><p className={`mt-2 text-2xl font-black ${card.tone}`}>{card.value}</p></article>)}</section><section className="mt-6 grid gap-4 md:grid-cols-3"><article className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Bookings created</p><p className="text-3xl font-black">{bookings}</p></article><article className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Payment transactions</p><p className="text-3xl font-black">{revenue._count}</p></article><article className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Expense entries</p><p className="text-3xl font-black">{expenses._count}</p></article></section></main>;
}
