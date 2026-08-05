"use client";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Booking = {
  id: string; bookingNumber: string; status: string; totalAmount: number;
  guest: { firstName: string; lastName: string };
  room: { roomNumber: string };
  payments: { amount: number; status: string }[];
};
type Payment = {
  id: string; receiptNumber: string; amount: number; method: string; paidAt: string;
  booking: Booking;
};

export default function PaymentsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const [bookingResponse, paymentResponse] = await Promise.all([fetch("/api/bookings"), fetch("/api/payments")]);
    if (bookingResponse.ok) setBookings(await bookingResponse.json());
    if (paymentResponse.ok) setPayments(await paymentResponse.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const openBookings = useMemo(() => bookings.filter((booking) => {
    const paid = booking.payments.filter((p) => p.status === "COMPLETED").reduce((sum, p) => sum + Number(p.amount), 0);
    return !["CANCELLED", "NO_SHOW"].includes(booking.status) && paid < booking.totalAmount;
  }), [bookings]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const response = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const result = await response.json();
    setMessage(response.ok ? `Payment saved. Receipt: ${result.receiptNumber}. Balance: K ${result.balanceAfter.toLocaleString()}` : result.message);
    if (response.ok) { form.reset(); load(); }
  }

  const input = "w-full rounded-xl border border-slate-300 px-3 py-2.5";
  return (
    <main className="p-5 md:p-8">
      <h1 className="text-3xl font-black">Payments</h1>
      <p className="text-slate-500">Deposits, settlement and cashier history.</p>
      <form onSubmit={save} className="mt-6 grid gap-3 rounded-2xl border bg-white p-5 md:grid-cols-2 xl:grid-cols-4">
        <select name="bookingId" required className={input}>
          <option value="">Select outstanding booking</option>
          {openBookings.map((booking) => {
            const paid = booking.payments.filter((p) => p.status === "COMPLETED").reduce((sum, p) => sum + Number(p.amount), 0);
            return <option key={booking.id} value={booking.id}>{booking.bookingNumber} Â· {booking.guest.firstName} {booking.guest.lastName} Â· Balance K {(booking.totalAmount - paid).toLocaleString()}</option>;
          })}
        </select>
        <input name="amount" type="number" min="0.01" step="0.01" required placeholder="Amount in ZMW" className={input} />
        <select name="method" className={input}>
          <option value="CASH">Cash</option><option value="CARD">Card</option><option value="BANK_TRANSFER">Bank transfer</option>
          <option value="MTN_MOBILE_MONEY">MTN Mobile Money</option><option value="AIRTEL_MONEY">Airtel Money</option><option value="ZAMTEL_KWACHA">Zamtel Kwacha</option>
        </select>
        <input name="transactionId" placeholder="Transaction reference (optional)" className={input} />
        <button className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white md:col-span-2 xl:col-span-4">Record payment</button>
      </form>
      {message && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      <div className="mt-6 overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-slate-50"><tr><th className="p-4">Receipt</th><th>Booking</th><th>Guest</th><th>Method</th><th>Amount</th><th>Date</th></tr></thead>
          <tbody>{payments.map((payment) => <tr key={payment.id} className="border-t"><td className="p-4 font-bold">{payment.receiptNumber}</td><td>{payment.booking.bookingNumber}</td><td>{payment.booking.guest.firstName} {payment.booking.guest.lastName}</td><td>{payment.method.replaceAll("_", " ")}</td><td className="font-bold">K {payment.amount.toLocaleString()}</td><td>{new Date(payment.paidAt).toLocaleString()}</td></tr>)}</tbody>
        </table>
      </div>
    </main>
  );
}
