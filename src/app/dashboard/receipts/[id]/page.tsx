import { notFound, redirect } from "next/navigation";

import { PrintButton } from "@/components/print-button";
import { ReceiptActions } from "@/components/receipt-actions";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const payment = await prisma.payment.findFirst({
    where: { id, booking: { propertyId: user.propertyId } },
    include: {
      booking: {
        include: {
          property: true,
          guest: true,
          room: { include: { roomType: true } },
          payments: { where: { status: "COMPLETED" } },
        },
      },
    },
  });
  if (!payment) notFound();

  const total = Number(payment.booking.totalAmount);
  const paid = payment.booking.payments.reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );
  const balance = Math.max(0, total - paid);
  const property = payment.booking.property;
  const guest = payment.booking.guest;

  return (
    <main className="min-h-screen bg-slate-100 p-4 print:bg-white print:p-0 dark:bg-slate-950 md:p-10">
      <div className="mx-auto mb-5 flex max-w-3xl justify-end print:hidden">
        <ReceiptActions
          paymentId={payment.id}
          defaultEmail={guest.email ?? ""}
        />
      </div>

      <article className="mx-auto max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl print:rounded-none print:shadow-none dark:bg-slate-900">
        <header className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-emerald-950 px-8 py-9 text-white md:px-12">
          <div className="absolute -right-16 -top-20 h-60 w-60 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                Hospitality management
              </p>
              <h1 className="mt-2 text-3xl font-black">{property.name}</h1>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
                {property.address}, {property.town}
                <br />
                {property.phone}
                {property.tpin ? " Â· TPIN " + property.tpin : ""}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Official receipt
              </p>
              <p className="mt-1 font-mono text-sm font-bold text-white">
                {payment.receiptNumber}
              </p>
            </div>
          </div>
        </header>

        <div className="p-8 md:p-12">
          <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-7 text-center dark:border-emerald-500/20 dark:from-emerald-500/10 dark:to-teal-500/5">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
              Amount received
            </p>
            <p className="mt-2 text-5xl font-black tracking-tight text-emerald-800 dark:text-emerald-300">
              K{" "}
              {Number(payment.amount).toLocaleString("en-ZM", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="mt-2 text-sm text-emerald-700/70 dark:text-emerald-300/70">
              Payment completed successfully
            </p>
          </div>

          <section className="mt-9">
            <h2 className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Payment information
            </h2>
            <dl className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200 px-5 dark:divide-white/10 dark:border-white/10">
              <ReceiptRow
                label="Received from"
                value={guest.firstName + " " + guest.lastName}
                strong
              />
              <ReceiptRow
                label="Booking"
                value={payment.booking.bookingNumber}
              />
              <ReceiptRow
                label="Room"
                value={
                  payment.booking.room.roomNumber +
                  " Â· " +
                  payment.booking.room.roomType.name
                }
              />
              <ReceiptRow
                label="Payment method"
                value={payment.method.replaceAll("_", " ")}
              />
              <ReceiptRow
                label="Transaction reference"
                value={payment.transactionId ?? "â€”"}
              />
              <ReceiptRow
                label="Payment date"
                value={payment.paidAt.toLocaleString("en-ZM")}
              />
            </dl>
          </section>

          <section className="mt-7 rounded-2xl bg-slate-50 p-5 dark:bg-white/5">
            <div className="space-y-3 text-sm">
              <BalanceRow label="Booking total" value={total} />
              <BalanceRow label="Total paid" value={paid} />
              <div className="border-t border-slate-200 pt-3 dark:border-white/10">
                <BalanceRow
                  label="Outstanding balance"
                  value={balance}
                  strong
                />
              </div>
            </div>
          </section>

          <footer className="mt-10 flex flex-col justify-between gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500 dark:border-white/10 sm:flex-row sm:items-center">
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300">
                Thank you for choosing {property.name}.
              </p>
              <p className="mt-1">
                Computer-generated receipt; valid without a signature.
              </p>
            </div>
            <PrintButton />
          </footer>
        </div>
      </article>
    </main>
  );
}

function ReceiptRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_1.3fr] gap-4 py-4 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd
        className={
          "text-right text-slate-800 dark:text-slate-200 " +
          (strong ? "font-black" : "font-semibold")
        }
      >
        {value}
      </dd>
    </div>
  );
}

function BalanceRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span
        className={
          strong
            ? "font-black text-slate-900 dark:text-white"
            : "text-slate-600 dark:text-slate-300"
        }
      >
        {label}
      </span>
      <span
        className={
          strong
            ? "font-black text-slate-900 dark:text-white"
            : "font-bold text-slate-800 dark:text-slate-200"
        }
      >
        K{" "}
        {value.toLocaleString("en-ZM", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
    </div>
  );
}
