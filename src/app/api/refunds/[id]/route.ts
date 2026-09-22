import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { verifyOwnPassword } from "@/lib/financial-access";
import { prisma } from "@/lib/prisma";
import { isFullRefund } from "@/lib/refund-rules";

const schema = z.object({ action: z.enum(["APPROVE", "REJECT"]), password: z.string().min(1) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!["SUPER_ADMIN", "MANAGER"].includes(user.role)) return NextResponse.json({ message: "Only management can approve or reject refunds" }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: "Invalid refund action" }, { status: 400 });
  if (!await verifyOwnPassword(user.id, parsed.data.password)) return NextResponse.json({ message: "Password is incorrect" }, { status: 401 });
  const { id } = await params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const refund = await tx.refund.findFirst({
        where: { id, status: "PENDING", payment: { booking: { propertyId: user.propertyId } } },
        include: { payment: { include: { refunds: { where: { status: "APPROVED" } }, booking: true } } },
      });
      if (!refund) throw new Error("NOT_FOUND");
      if (parsed.data.action === "REJECT") {
        await tx.refund.update({ where: { id }, data: { status: "REJECTED", approvedById: user.id, rejectedAt: new Date() } });
        await tx.auditLog.create({ data: { action: "REJECT_REFUND", entity: "Refund", entityId: id, userId: user.id, details: { refundNumber: refund.refundNumber, amount: Number(refund.amount) } } });
        return "Refund request rejected";
      }
      const approvedBefore = refund.payment.refunds.reduce((sum, row) => sum + Number(row.amount), 0);
      const approvedTotal = approvedBefore + Number(refund.amount);
      if (approvedTotal > Number(refund.payment.amount) + 0.001) throw new Error("OVER_REFUND");
      const now = new Date();
      const full = isFullRefund(Number(refund.payment.amount), approvedTotal);
      await tx.refund.update({ where: { id }, data: { status: "APPROVED", approvedById: user.id, approvedAt: now } });
      if (full) await tx.payment.update({ where: { id: refund.paymentId }, data: { status: "REFUNDED", refundedAt: now } });
      await tx.auditLog.create({ data: {
        action: "APPROVE_REFUND", entity: "Refund", entityId: id, userId: user.id,
        details: { refundNumber: refund.refundNumber, receiptNumber: refund.payment.receiptNumber, bookingNumber: refund.payment.booking.bookingNumber, amount: Number(refund.amount), fullRefund: full, sameUserApproval: refund.requestedById === user.id },
      } });
      return full ? "Full refund approved" : "Partial refund approved";
    });
    return NextResponse.json({ message: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "NOT_FOUND") return NextResponse.json({ message: "Pending refund was not found" }, { status: 404 });
    if (message === "OVER_REFUND") return NextResponse.json({ message: "Approval would exceed the original payment" }, { status: 409 });
    return NextResponse.json({ message: "Unable to process the refund" }, { status: 500 });
  }
}
