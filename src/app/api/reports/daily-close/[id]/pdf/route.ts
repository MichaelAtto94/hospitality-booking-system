import { NextResponse } from "next/server";
import { z } from "zod";
import { createDailyClosePdf } from "@/lib/daily-close-pdf";
import { requireFinancialAccess, verifyOwnPassword } from "@/lib/financial-access";
import { prisma } from "@/lib/prisma";

const schema = z.object({ password: z.string().min(1) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireFinancialAccess();
  if (access.error || !access.user) return NextResponse.json({ message: "Financial access is locked" }, { status: 423 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success || !await verifyOwnPassword(access.user.id, parsed.data.password)) {
    return NextResponse.json({ message: "Password is incorrect" }, { status: 401 });
  }
  const { id } = await params;
  const close = await prisma.dailyClose.findFirst({
    where: { id, propertyId: access.user.propertyId },
    include: {
      property: true,
      preparedBy: { select: { firstName: true, lastName: true } },
      approvedBy: { select: { firstName: true, lastName: true } },
    },
  });
  if (!close) return NextResponse.json({ message: "Closing report not found" }, { status: 404 });
  const bytes = await createDailyClosePdf({ property: close.property, close });
  await prisma.auditLog.create({ data: { action: "EXPORT_DAILY_CLOSE_PDF", entity: "DailyClose", entityId: close.id, userId: access.user.id } });
  const date = close.businessDate.toISOString().slice(0, 10);
  return new NextResponse(Buffer.from(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="daily-close-${date}.pdf"`, "Cache-Control": "private, no-store" },
  });
}
