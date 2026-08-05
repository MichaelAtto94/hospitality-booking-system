import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const paymentSchema = z.object({
  bookingId: z.string().min(1, "Select a booking"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  method: z.enum(["CASH", "CARD", "BANK_TRANSFER", "MTN_MOBILE_MONEY", "AIRTEL_MONEY", "ZAMTEL_KWACHA"]),
  transactionId: z.string().trim().max(100).optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payments = await prisma.payment.findMany({
    where: { booking: { propertyId: user.propertyId } },
    include: { booking: { include: { guest: true, room: true } } },
    orderBy: { paidAt: "desc" },
  });

  return NextResponse.json(payments.map((payment) => ({
    ...payment,
    amount: Number(payment.amount),
    booking: { ...payment.booking, totalAmount: Number(payment.booking.totalAmount) },
  })));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!["SUPER_ADMIN", "MANAGER", "ACCOUNTANT", "RECEPTIONIST"].includes(user.role)) {
    return NextResponse.json({ message: "You do not have permission" }, { status: 403 });
  }

  const parsed = paymentSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid payment" }, { status: 400 });
  const data = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: { id: data.bookingId, propertyId: user.propertyId, status: { notIn: ["CANCELLED", "NO_SHOW"] } },
      include: { payments: { where: { status: "COMPLETED" } } },
    });
    if (!booking) throw new Error("BOOKING_NOT_FOUND");

    const paid = booking.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const balance = Number(booking.totalAmount) - paid;
    if (data.amount > balance + 0.001) throw new Error(`OVERPAYMENT:${balance}`);

    const receiptNumber = `RCT-${Date.now().toString().slice(-10)}-${Math.floor(Math.random() * 900 + 100)}`;
    const payment = await tx.payment.create({
      data: {
        receiptNumber,
        amount: data.amount,
        method: data.method,
        transactionId: data.transactionId || null,
        bookingId: booking.id,
        status: "COMPLETED",
      },
    });
    await tx.auditLog.create({
      data: {
        action: "RECORD_PAYMENT",
        entity: "Payment",
        entityId: payment.id,
        userId: user.id,
        details: { receiptNumber, bookingNumber: booking.bookingNumber, amount: data.amount, method: data.method },
      },
    });
    return { payment, balanceAfter: balance - data.amount };
  }).catch((error: Error) => ({ error: error.message }));

  if ("error" in result) {
    if (result.error === "BOOKING_NOT_FOUND") return NextResponse.json({ message: "Active booking not found" }, { status: 404 });
    if (result.error.startsWith("OVERPAYMENT:")) {
      const balance = Number(result.error.split(":")[1]);
      return NextResponse.json({ message: `Payment exceeds the outstanding balance of K ${balance.toLocaleString()}` }, { status: 409 });
    }
    return NextResponse.json({ message: "Unable to record payment" }, { status: 500 });
  }

  return NextResponse.json({
    ...result.payment,
    amount: Number(result.payment.amount),
    balanceAfter: result.balanceAfter,
  }, { status: 201 });
}
