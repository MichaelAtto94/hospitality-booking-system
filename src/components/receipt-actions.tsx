"use client";

import { Download, LoaderCircle, Mail, Send, X } from "lucide-react";
import { FormEvent, useState } from "react";

export function ReceiptActions({
  paymentId,
  defaultEmail,
}: {
  paymentId: string;
  defaultEmail: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);
    const email = String(new FormData(event.currentTarget).get("email") ?? "");

    try {
      const response = await fetch(
        "/api/payments/" + paymentId + "/email-receipt",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );
      const result = await response.json();
      setMessage(result.message ?? "Unable to send receipt");
      setSuccess(response.ok);
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap justify-end gap-2 print:hidden">
        <a
          href={"/api/payments/" + paymentId + "/receipt"}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:border-blue-200 hover:text-blue-700"
        >
          <Download size={16} /> Download PDF
        </a>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-600/20"
        >
          <Mail size={16} /> Email receipt
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm print:hidden">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md overflow-hidden rounded-[26px] border border-white/10 bg-white shadow-2xl dark:bg-slate-900"
          >
            <div className="flex items-start justify-between bg-gradient-to-r from-slate-950 to-emerald-950 p-6 text-white">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">
                  Client delivery
                </p>
                <h2 className="mt-2 text-2xl font-black">Email PDF receipt</h2>
                <p className="mt-1 text-sm text-slate-300">
                  Confirm the client email before sending.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-xl p-2 text-slate-300 hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={send} className="space-y-5 p-6">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                  Client email address
                </span>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    name="email"
                    type="email"
                    required
                    defaultValue={defaultEmail}
                    placeholder="client@example.com"
                    className="h-14 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-slate-950"
                  />
                </div>
              </label>
              <p className="rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800 dark:bg-blue-500/10 dark:text-blue-300">
                The client will receive a professional PDF attachment containing
                the payment and booking details.
              </p>
              {message && (
                <p
                  className={
                    "rounded-xl p-3 text-sm font-semibold " +
                    (success
                      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300")
                  }
                >
                  {message}
                </p>
              )}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-5 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border px-4 py-2.5 text-sm font-bold"
                >
                  Close
                </button>
                <button
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-60"
                >
                  {loading ? (
                    <LoaderCircle className="animate-spin" size={16} />
                  ) : (
                    <Send size={16} />
                  )}
                  {loading ? "Sending..." : "Send receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
