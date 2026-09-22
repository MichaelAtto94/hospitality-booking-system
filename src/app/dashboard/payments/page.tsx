"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Banknote, CheckCircle2, KeyRound, RotateCcw, ShieldCheck, XCircle } from "lucide-react";

type Booking = {
  id: string; bookingNumber: string; status: string; totalAmount: number;
  guest: { firstName: string; lastName: string }; room: { roomNumber: string };
  payments: { amount: number; status: string }[];
};
type Payment = {
  id: string; receiptNumber: string; amount: number; refundableAmount: number; method: string; status: string; paidAt: string;
  booking: Booking;
};
type Refund = {
  id: string; refundNumber: string; amount: number; method: string; status: string; reason: string; requestedAt: string;
  payment: { receiptNumber: string; booking: { bookingNumber: string; guest: { firstName: string; lastName: string } } };
  requestedBy: { firstName: string; lastName: string }; approvedBy: { firstName: string; lastName: string } | null;
};
type Decision = { refund: Refund; action: "APPROVE" | "REJECT" };

const methods = [
  ["CASH", "Cash"], ["CARD", "Card"], ["BANK_TRANSFER", "Bank transfer"],
  ["MTN_MOBILE_MONEY", "MTN Mobile Money"], ["AIRTEL_MONEY", "Airtel Money"], ["ZAMTEL_KWACHA", "Zamtel Kwacha"],
];
const money = (value: number) => `K ${value.toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PaymentsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [viewerRole, setViewerRole] = useState("");
  const [selected, setSelected] = useState<Payment | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [bookingResponse, paymentResponse, refundResponse] = await Promise.all([fetch("/api/bookings"), fetch("/api/payments"), fetch("/api/refunds")]);
    if (bookingResponse.ok) setBookings(await bookingResponse.json());
    if (paymentResponse.ok) setPayments(await paymentResponse.json());
    if (refundResponse.ok) { const data = await refundResponse.json(); setRefunds(data.refunds); setViewerRole(data.viewerRole); }
  }, []);

  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);

  const openBookings = useMemo(() => bookings.filter((booking) => {
    const paid = booking.payments.filter((payment) => payment.status === "COMPLETED").reduce((sum, payment) => sum + Number(payment.amount), 0);
    return !["CANCELLED", "NO_SHOW"].includes(booking.status) && paid < booking.totalAmount;
  }), [bookings]);
  const canApprove = ["SUPER_ADMIN", "MANAGER"].includes(viewerRole);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget;
    const response = await fetch("/api/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    const result = await response.json();
    setMessage(response.ok ? `Payment saved. Receipt: ${result.receiptNumber}. Balance: ${money(result.balanceAfter)}` : result.message);
    if (response.ok) { form.reset(); await load(); }
  }

  async function requestRefund(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return; setBusy(true); setMessage("");
    const form = event.currentTarget;
    const body = { ...Object.fromEntries(new FormData(form)), paymentId: selected.id };
    const response = await fetch("/api/refunds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json(); setBusy(false);
    if (!response.ok) { setMessage(result.message); return; }
    setSelected(null); setMessage(`${result.refundNumber}: ${result.message}`); await load();
  }

  async function decideRefund(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!decision) return; setBusy(true); setMessage("");
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    const response = await fetch(`/api/refunds/${decision.refund.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: decision.action, password }) });
    const result = await response.json(); setBusy(false);
    if (!response.ok) { setMessage(result.message); return; }
    setDecision(null); setMessage(result.message); await load();
  }

  const input = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5";
  return <main className="p-5 md:p-8">
    <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-emerald-950 p-6 text-white shadow-xl md:p-8"><div className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300"><Banknote/></span><div><p className="text-xs font-black uppercase tracking-[.18em] text-emerald-300">Finance control</p><h1 className="text-3xl font-black !text-white">Payments & refunds</h1><p className="mt-1 text-sm text-slate-300">Record receipts and process controlled full or partial refunds.</p></div></div></div>
    {message&&<p className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-800">{message}</p>}
    <form onSubmit={save} className="mt-6 grid gap-3 rounded-2xl border bg-white p-5 md:grid-cols-2 xl:grid-cols-4"><select name="bookingId" required className={input}><option value="">Select outstanding booking</option>{openBookings.map((booking)=>{const paid=booking.payments.filter((payment)=>payment.status==="COMPLETED").reduce((sum,payment)=>sum+Number(payment.amount),0);return <option key={booking.id} value={booking.id}>{booking.bookingNumber} - {booking.guest.firstName} {booking.guest.lastName} - Balance {money(booking.totalAmount-paid)}</option>})}</select><input name="amount" type="number" min="0.01" step="0.01" required placeholder="Amount in ZMW" className={input}/><select name="method" className={input}>{methods.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><input name="transactionId" placeholder="Transaction reference (optional)" className={input}/><button className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white md:col-span-2 xl:col-span-4">Record payment</button></form>
    <section className="mt-7"><div className="mb-3"><h2 className="text-xl font-black">Payment history</h2><p className="text-sm text-slate-500">Original receipts remain unchanged when refunds are processed.</p></div><div className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-4">Receipt</th><th>Booking</th><th>Guest</th><th>Method</th><th>Amount</th><th>Refundable</th><th>Date</th><th className="pr-4 text-right">Action</th></tr></thead><tbody>{payments.map((payment)=><tr key={payment.id} className="border-t"><td className="p-4 font-bold">{payment.receiptNumber}</td><td>{payment.booking.bookingNumber}</td><td>{payment.booking.guest.firstName} {payment.booking.guest.lastName}</td><td>{payment.method.replaceAll("_"," ")}</td><td className="font-bold">{money(payment.amount)}</td><td>{money(payment.refundableAmount)}</td><td>{new Date(payment.paidAt).toLocaleString()}</td><td className="pr-4 text-right"><button disabled={payment.refundableAmount<=0} onClick={()=>setSelected(payment)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-40"><RotateCcw size={14} className="mr-1 inline"/>Refund</button></td></tr>)}</tbody></table></div></section>
    <section className="mt-7"><div className="mb-3"><h2 className="text-xl font-black">Refund requests</h2><p className="text-sm text-slate-500">Pending requests require management approval before affecting financial reports.</p></div><div className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-4">Refund</th><th>Original receipt</th><th>Guest</th><th>Reason</th><th>Method</th><th>Amount</th><th>Status</th><th className="pr-4 text-right">Management</th></tr></thead><tbody>{refunds.length===0?<tr><td colSpan={8} className="p-10 text-center text-slate-500">No refund requests recorded.</td></tr>:refunds.map((refund)=><tr key={refund.id} className="border-t"><td className="p-4 font-bold">{refund.refundNumber}</td><td>{refund.payment.receiptNumber}</td><td>{refund.payment.booking.guest.firstName} {refund.payment.booking.guest.lastName}</td><td className="max-w-52 truncate">{refund.reason}</td><td>{refund.method.replaceAll("_"," ")}</td><td className="font-bold text-red-700">{money(refund.amount)}</td><td><span className={`rounded-full px-3 py-1 text-xs font-bold ${refund.status==="APPROVED"?"bg-emerald-50 text-emerald-700":refund.status==="REJECTED"?"bg-red-50 text-red-700":"bg-amber-50 text-amber-700"}`}>{refund.status}</span></td><td className="pr-4 text-right">{refund.status==="PENDING"&&canApprove?<div className="flex justify-end gap-2"><button onClick={()=>setDecision({refund,action:"APPROVE"})} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Approve</button><button onClick={()=>setDecision({refund,action:"REJECT"})} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Reject</button></div>:<span className="text-xs text-slate-400">{refund.approvedBy?`${refund.approvedBy.firstName} ${refund.approvedBy.lastName}`:"-"}</span>}</td></tr>)}</tbody></table></div></section>
    {selected&&<div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm"><form onSubmit={requestRefund} className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-7 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-[.18em] text-red-600">Controlled refund</p><h2 className="mt-1 text-2xl font-black">Request payment refund</h2><p className="mt-1 text-sm text-slate-500">{selected.receiptNumber} · Available {money(selected.refundableAmount)}</p></div><button type="button" onClick={()=>setSelected(null)} className="rounded-xl border p-2"><XCircle size={20}/></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Refund amount<input name="amount" type="number" min="0.01" max={selected.refundableAmount} step="0.01" defaultValue={selected.refundableAmount} required className={`${input} mt-2`}/></label><label className="text-sm font-bold">Refund method<select name="method" defaultValue={selected.method} className={`${input} mt-2`}>{methods.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label className="text-sm font-bold sm:col-span-2">Reason<input name="reason" minLength={5} required className={`${input} mt-2`} placeholder="Example: booking cancellation"/></label><label className="text-sm font-bold sm:col-span-2">Transaction reference<input name="transactionId" className={`${input} mt-2`} placeholder="Required for electronic refunds"/></label><label className="text-sm font-bold sm:col-span-2">Notes<textarea name="notes" className={`${input} mt-2 min-h-20`} placeholder="Additional approval information"/></label><label className="text-sm font-bold sm:col-span-2">Confirm your password<div className="mt-2 flex items-center gap-2 rounded-xl border px-3"><KeyRound size={17} className="text-slate-400"/><input name="password" type="password" required className="w-full bg-transparent py-3 outline-none"/></div></label></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={()=>setSelected(null)} className="rounded-xl border px-4 py-2.5 font-bold">Cancel</button><button disabled={busy} className="rounded-xl bg-red-600 px-5 py-2.5 font-bold text-white disabled:opacity-60">{busy?"Submitting...":"Submit refund request"}</button></div></form></div>}
    {decision&&<div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm"><form onSubmit={decideRefund} className="w-full max-w-md rounded-[2rem] bg-white p-7 shadow-2xl"><div className={`grid h-12 w-12 place-items-center rounded-2xl ${decision.action==="APPROVE"?"bg-emerald-50 text-emerald-600":"bg-red-50 text-red-600"}`}>{decision.action==="APPROVE"?<CheckCircle2/>:<XCircle/>}</div><h2 className="mt-5 text-2xl font-black">{decision.action==="APPROVE"?"Approve refund":"Reject refund"}</h2><p className="mt-2 text-sm text-slate-500">{decision.refund.refundNumber} · {money(decision.refund.amount)}. Confirm with your management password.</p><div className="mt-5 flex items-center gap-2 rounded-xl border px-3"><ShieldCheck size={18} className="text-slate-400"/><input name="password" type="password" required autoFocus className="w-full bg-transparent py-3 outline-none" placeholder="Account password"/></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={()=>setDecision(null)} className="rounded-xl border px-4 py-2.5 font-bold">Cancel</button><button disabled={busy} className={`rounded-xl px-5 py-2.5 font-bold text-white disabled:opacity-60 ${decision.action==="APPROVE"?"bg-emerald-600":"bg-red-600"}`}>{busy?"Processing...":"Confirm"}</button></div></form></div>}
  </main>;
}
