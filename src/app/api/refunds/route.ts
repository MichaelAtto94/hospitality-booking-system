import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { verifyOwnPassword } from "@/lib/financial-access";
import { prisma } from "@/lib/prisma";
import { refundableBalance } from "@/lib/refund-rules";

const allowed = ["SUPER_ADMIN", "MANAGER", "ACCOUNTANT", "RECEPTIONIST"];
const schema = z.object({
  paymentId: z.string().min(1),
  amount: z.coerce.number().positive().max(100000000),
  method: z.enum(["CASH", "CARD", "BANK_TRANSFER", "MTN_MOBILE_MONEY", "AIRTEL_MONEY", "ZAMTEL_KWACHA"]),
  reason: z.string().trim().min(5, "Give a clear refund reason").max(250),
  notes: z.string().trim().max(1000).optional(),
  transactionId: z.string().trim().max(100).optional(),
  password: z.string().min(1, "Enter your account password"),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!allowed.includes(user.role)) return NextResponse.json({ message: "Permission denied" }, { status: 403 });
  const refunds = await prisma.refund.findMany({
    where: { payment: { booking: { propertyId: user.propertyId } } },
    include: {
      payment: { include: { booking: { include: { guest: true } } } },
      requestedBy: { select: { firstName: true, lastName: true, role: true } },
      approvedBy: { select: { firstName: true, lastName: true, role: true } },
    },
    orderBy: { requestedAt: "desc" }, take: 250,
  });
  return NextResponse.json({ viewerRole: user.role, refunds: refunds.map((refund) => ({ ...refund, amount: Number(refund.amount), payment: { ...refund.payment, amount: Number(refund.payment.amount) } })) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!allowed.includes(user.role)) return NextResponse.json({ message: "Permission denied" }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid refund request" }, { status: 400 });
  if (!await verifyOwnPassword(user.id, parsed.data.password)) return NextResponse.json({ message: "Password is incorrect" }, { status: 401 });

  const payment = await prisma.payment.findFirst({
    where: { id: parsed.data.paymentId, booking: { propertyId: user.propertyId }, status: { in: ["COMPLETED", "REFUNDED"] } },
    include: { refunds: { where: { status: { in: ["PENDING", "APPROVED"] } } }, booking: true },
  });
  if (!payment) return NextResponse.json({ message: "Payment was not found" }, { status: 404 });
  const committed = payment.refunds.reduce((sum, refund) => sum + Number(refund.amount), 0);
  const available = refundableBalance(Number(payment.amount), committed);
  if (parsed.data.amount > available + 0.001) return NextResponse.json({ message: `Refund exceeds the available amount of K ${available.toLocaleString()}` }, { status: 409 });

  const refundNumber = `RFD-${Date.now().toString().slice(-10)}-${Math.floor(Math.random() * 900 + 100)}`;
  const refund = await prisma.$transaction(async (tx) => {
    const created = await tx.refund.create({ data: {
      refundNumber, paymentId: payment.id, amount: parsed.data.amount, method: parsed.data.method,
      reason: parsed.data.reason, notes: parsed.data.notes || null, transactionId: parsed.data.transactionId || null,
      requestedById: user.id,
    } });
    await tx.auditLog.create({ data: {
      action: "REQUEST_REFUND", entity: "Refund", entityId: created.id, userId: user.id,
      details: { refundNumber, receiptNumber: payment.receiptNumber, bookingNumber: payment.booking.bookingNumber, amount: parsed.data.amount, method: parsed.data.method, reason: parsed.data.reason },
    } });
    return created;
  });
  return NextResponse.json({ id: refund.id, refundNumber, message: "Refund request submitted for management approval" }, { status: 201 });
}
