import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPaymentReceipt } from "@/lib/receipt-email";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid client email"),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (
    !["SUPER_ADMIN", "MANAGER", "ACCOUNTANT", "RECEPTIONIST"].includes(
      user.role,
    )
  ) {
    return NextResponse.json({ message: "Permission denied" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid email" },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  try {
    const payment = await sendPaymentReceipt({
      paymentId: id,
      propertyId: user.propertyId,
      recipient: parsed.data.email,
    });

    await prisma.auditLog.create({
      data: {
        action: "EMAIL_RECEIPT",
        entity: "Payment",
        entityId: payment.id,
        userId: user.id,
        details: {
          receiptNumber: payment.receiptNumber,
          recipient: parsed.data.email,
        },
      },
    });

    return NextResponse.json({
      message: "Receipt emailed successfully to " + parsed.data.email,
    });
  } catch (error) {
    console.error("Receipt email failed", error);
    const message =
      error instanceof Error && error.message.includes("not configured")
        ? "Receipt email is not configured. Check the SMTP settings."
        : "Unable to email the receipt. Please try again.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
