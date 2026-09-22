"use client";

import { FormEvent, useState } from "react";
import { Banknote, Building2, CheckCircle2, CreditCard, Download, KeyRound, LockKeyhole, RotateCcw, ShieldCheck, Smartphone } from "lucide-react";

const TODAY = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lusaka" });
type Person = { firstName: string; lastName: string; role: string };
type Closing = {
  id: string; status: "SUBMITTED" | "APPROVED" | "REOPENED"; countedCash: number; cashVariance: number;
  preparedAt: string; approvedAt: string | null; notes: string | null; preparedBy: Person; approvedBy: Person | null;
};
type Report = {
  date: string; viewerRole: string; totals: Record<string, number>; refundAmount: number; expenseAmount: number;
  refundCount: number; expenseCount: number; transactionCount: number;
  calculated: { gross: number; net: number; expectedCash: number }; closing: Closing | null;
};
type SecureAction = "SUBMIT" | "APPROVE" | "REOPEN" | "EXPORT";

const money = (value: number) => {
  const normalized = Math.abs(value) < 0.005 ? 0 : value;
  return `K ${normalized.toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function DailyClosePage() {
  const [date, setDate] = useState(TODAY);
  const [report, setReport] = useState<Report | null>(null);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [action, setAction] = useState<SecureAction | null>(null);
  const [actionPassword, setActionPassword] = useState("");
  const [countedCash, setCountedCash] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadReport(selected = date) {
    const response = await fetch(`/api/reports/daily-close?date=${encodeURIComponent(selected)}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message ?? "Unable to load the report");
    setReport(data); setCountedCash(String(data.closing?.countedCash ?? data.calculated.expectedCash)); setNotes(data.closing?.notes ?? "");
  }

  async function unlock(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/reports/financial-unlock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: unlockPassword }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message);
      setUnlockPassword(""); await loadReport(); setMessage(data.message);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to unlock figures"); }
    finally { setBusy(false); }
  }

  async function changeDate(value: string) {
    setDate(value); setBusy(true); setMessage("");
    try { await loadReport(value); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load report"); }
    finally { setBusy(false); }
  }

  async function secureSubmit(event: FormEvent) {
    event.preventDefault(); if (!action || !report) return;
    setBusy(true); setMessage("");
    try {
      if (action === "SUBMIT") {
        const response = await fetch("/api/reports/daily-close", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date, countedCash, notes, password: actionPassword }) });
        const data = await response.json(); if (!response.ok) throw new Error(data.message); setMessage(data.message);
      } else if (action === "EXPORT") {
        const response = await fetch(`/api/reports/daily-close/${report.closing?.id}/pdf`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: actionPassword }) });
        if (!response.ok) { const data = await response.json(); throw new Error(data.message); }
        const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement("a");
        link.href = url; link.download = `daily-close-${date}.pdf`; link.click(); URL.revokeObjectURL(url); setMessage("PDF report downloaded");
      } else {
        const response = await fetch(`/api/reports/daily-close/${report.closing?.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, password: actionPassword }) });
        const data = await response.json(); if (!response.ok) throw new Error(data.message); setMessage(data.message);
      }
      setAction(null); setActionPassword(""); await loadReport();
    } catch (error) { setMessage(error instanceof Error ? error.message : "The secure action failed"); }
    finally { setBusy(false); }
  }

  if (!report) return (
    <main className="daily-close-page min-h-[calc(100vh-4rem)] p-5 md:p-8">
      <div className="mx-auto mt-10 max-w-lg overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">
        <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-emerald-950 p-8 text-white"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/20"><LockKeyhole /></div><p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-emerald-300">Protected financial area</p><h1 className="mt-2 text-3xl font-black">End-of-day closing</h1><p className="mt-2 text-sm text-slate-300">Confirm your identity before sensitive figures are displayed.</p></div>
        <form onSubmit={unlock} className="space-y-5 p-8"><label className="block text-sm font-bold text-slate-700">Your account password<div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-300 px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100"><KeyRound size={19} className="text-slate-400"/><input type="password" value={unlockPassword} onChange={(event)=>setUnlockPassword(event.target.value)} required autoFocus className="w-full bg-transparent py-3.5 outline-none" placeholder="Enter your password"/></div></label>{message&&<p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}<button disabled={busy} className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-600 py-3.5 font-black text-white shadow-lg disabled:opacity-60">{busy?"Verifying...":"Unlock financial report"}</button><p className="text-center text-xs text-slate-500">Access automatically locks again after five minutes.</p></form>
      </div>
    </main>
  );

  const cards = [
    ["Cash", report.totals.CASH, Banknote, "bg-emerald-50 text-emerald-600"], ["Card", report.totals.CARD, CreditCard, "bg-blue-50 text-blue-600"],
    ["Bank transfer", report.totals.BANK_TRANSFER, Building2, "bg-slate-100 text-slate-600"], ["MTN Mobile Money", report.totals.MTN_MOBILE_MONEY, Smartphone, "bg-yellow-50 text-yellow-600"],
    ["Airtel Money", report.totals.AIRTEL_MONEY, Smartphone, "bg-red-50 text-red-600"], ["Zamtel Kwacha", report.totals.ZAMTEL_KWACHA, Smartphone, "bg-violet-50 text-violet-600"],
  ] as const;
  const canApprove = ["SUPER_ADMIN", "MANAGER"].includes(report.viewerRole);

  return <main className="daily-close-page p-5 md:p-8">
    <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-emerald-950 p-6 text-white shadow-xl md:p-8"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300 ring-1 ring-emerald-300/20"><ShieldCheck size={15}/> Secure financial control</div><h1 className="mt-4 text-3xl font-black md:text-4xl">End-of-day closing</h1><p className="mt-2 max-w-2xl text-sm text-slate-300">Reconcile every payment channel, expenses and physical cash before management approval.</p></div><label className="text-xs font-bold uppercase tracking-wider text-slate-300">Business date<input type="date" value={date} onChange={(event)=>changeDate(event.target.value)} className="mt-2 block rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white [color-scheme:dark]"/></label></div></div>
    {message&&<p className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-800">{message}</p>}
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label,value,Icon,tone])=><article key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}><Icon size={21}/></span><span className="text-xs font-bold text-slate-400">COMPLETED</span></div><p className="mt-5 text-sm font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-950">{money(value)}</p></article>)}</section>
    <section className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_.8fr]"><article className="rounded-3xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Daily financial summary</h2><div className="mt-5 space-y-3 text-sm">{[["Gross receipts",report.calculated.gross],[`Refunds (${report.refundCount})`,-report.refundAmount],[`Expenses (${report.expenseCount})`,-report.expenseAmount]].map(([label,value])=><div key={String(label)} className="flex justify-between border-b border-slate-100 pb-3"><span className="text-slate-500">{label}</span><b>{money(Number(value))}</b></div>)}<div className="flex justify-between rounded-2xl bg-slate-950 p-5 text-white"><span className="font-bold">Net collection</span><strong className="text-xl text-emerald-300">{money(report.calculated.net)}</strong></div><p className="text-xs text-slate-500">{report.transactionCount} completed payment transaction(s)</p></div></article>
      <article className="rounded-3xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Cash reconciliation</h2><p className="mt-1 text-sm text-slate-500">Expected cash: <b>{money(report.calculated.expectedCash)}</b></p><label className="mt-5 block text-sm font-bold">Physical cash counted<input type="number" min="0" step="0.01" value={countedCash} disabled={report.closing?.status==="APPROVED"} onChange={(event)=>setCountedCash(event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 text-lg font-black"/></label><label className="mt-4 block text-sm font-bold">Closing notes<textarea value={notes} disabled={report.closing?.status==="APPROVED"} onChange={(event)=>setNotes(event.target.value)} className="mt-2 min-h-24 w-full rounded-2xl border px-4 py-3 font-normal" placeholder="Cash explanation or handover notes"/></label>{(!report.closing||report.closing.status==="REOPENED")&&<button onClick={()=>setAction("SUBMIT")} className="mt-4 w-full rounded-2xl bg-emerald-600 py-3 font-black text-white">Submit final figures</button>}</article></section>
    {report.closing&&report.closing.status!=="REOPENED"&&<section className="mt-6 rounded-3xl border bg-white p-6 shadow-sm"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-center"><div><div className="flex items-center gap-2"><CheckCircle2 className={report.closing.status==="APPROVED"?"text-emerald-600":"text-amber-500"}/><h2 className="text-xl font-black">{report.closing.status==="APPROVED"?"Financial day approved":"Awaiting management approval"}</h2></div><p className="mt-2 text-sm text-slate-500">Prepared by {report.closing.preparedBy.firstName} {report.closing.preparedBy.lastName} · Cash variance <b>{money(report.closing.cashVariance)}</b></p></div><div className="flex flex-wrap gap-2">{report.closing.status==="SUBMITTED"&&canApprove&&<button onClick={()=>setAction("APPROVE")} className="rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-white">Approve & lock</button>}<button onClick={()=>setAction("EXPORT")} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 font-bold"><Download size={17}/> Export PDF</button>{report.closing.status==="APPROVED"&&report.viewerRole==="SUPER_ADMIN"&&<button onClick={()=>setAction("REOPEN")} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 font-bold text-red-700"><RotateCcw size={17}/> Reopen</button>}</div></div></section>}
    {action&&<div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm"><form onSubmit={secureSubmit} className="w-full max-w-md rounded-[2rem] bg-white p-7 shadow-2xl"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600"><KeyRound/></div><h2 className="mt-5 text-2xl font-black">Confirm secure action</h2><p className="mt-2 text-sm text-slate-500">Enter your own account password to {action.toLowerCase()} this financial report.</p><input type="password" required autoFocus value={actionPassword} onChange={(event)=>setActionPassword(event.target.value)} className="mt-5 w-full rounded-2xl border px-4 py-3" placeholder="Account password"/><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={()=>{setAction(null);setActionPassword("")}} className="rounded-xl border px-4 py-2.5 font-bold">Cancel</button><button disabled={busy} className="rounded-xl bg-slate-950 px-5 py-2.5 font-bold text-white disabled:opacity-60">{busy?"Processing...":"Confirm"}</button></div></form></div>}
  </main>;
}
