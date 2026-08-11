import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { createReceiptPdf, getReceiptData } from "@/lib/receipt-pdf";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const payment = await getReceiptData(id, user.propertyId);
  if (!payment) {
    return NextResponse.json({ message: "Receipt not found" }, { status: 404 });
  }

  const pdf = await createReceiptPdf(payment);
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'attachment; filename="Receipt-' + payment.receiptNumber + '.pdf"',
      "Cache-Control": "private, no-store",
    },
  });
}
