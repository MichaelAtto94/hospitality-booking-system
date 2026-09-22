import { NextResponse } from "next/server";
import { z } from "zod";
import { getDailyFigures, serializeClose } from "@/lib/daily-close";
import { requireFinancialAccess, verifyOwnPassword } from "@/lib/financial-access";
import { prisma } from "@/lib/prisma";

const submitSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  countedCash: z.coerce.number().min(0).max(999999999999),
  notes: z.string().trim().max(1000).optional(),
  password: z.string().min(1),
});

function denied(error: string) {
  const status = error === "UNAUTHENTICATED" ? 401 : error === "FORBIDDEN" ? 403 : 423;
  return NextResponse.json({ message: error === "LOCKED" ? "Confirm your password to unlock financial figures" : "Access denied" }, { status });
}

export async function GET(request: Request) {
  const access = await requireFinancialAccess();
  if (access.error || !access.user) return denied(access.error ?? "UNAUTHENTICATED");
  const date = new URL(request.url).searchParams.get("date") ?? "";
  try {
    return NextResponse.json({ ...serializeClose(await getDailyFigures(access.user.propertyId, date)), viewerRole: access.user.role });
  } catch {
    return NextResponse.json({ message: "Enter a valid reporting date" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const access = await requireFinancialAccess();
  if (access.error || !access.user) return denied(access.error ?? "UNAUTHENTICATED");
  const parsed = submitSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid closing details" }, { status: 400 });
  if (!await verifyOwnPassword(access.user.id, parsed.data.password)) return NextResponse.json({ message: "Password is incorrect" }, { status: 401 });

  const figures = await getDailyFigures(access.user.propertyId, parsed.data.date);
  if (figures.closing && figures.closing.status !== "REOPENED") {
    return NextResponse.json({ message: "This financial day has already been submitted" }, { status: 409 });
  }
  const c = figures.calculated;
  const variance = parsed.data.countedCash - c.expectedCash;
  const data = {
    status: "SUBMITTED" as const, cashAmount: figures.totals.CASH, cardAmount: figures.totals.CARD,
    bankTransferAmount: figures.totals.BANK_TRANSFER, mtnAmount: figures.totals.MTN_MOBILE_MONEY,
    airtelAmount: figures.totals.AIRTEL_MONEY, zamtelAmount: figures.totals.ZAMTEL_KWACHA,
    refundAmount: figures.refundAmount, grossAmount: c.gross, expenseAmount: figures.expenseAmount,
    netAmount: c.net, expectedCash: c.expectedCash, countedCash: parsed.data.countedCash,
    cashVariance: variance, transactionCount: figures.transactionCount, notes: parsed.data.notes || null,
    preparedById: access.user.id, preparedAt: new Date(), approvedById: null, approvedAt: null,
    reopenedById: null, reopenedAt: null,
  };
  const close = await prisma.$transaction(async (tx) => {
    const saved = figures.closing
      ? await tx.dailyClose.update({ where: { id: figures.closing.id }, data })
      : await tx.dailyClose.create({ data: { ...data, propertyId: access.user.propertyId, businessDate: figures.businessDate } });
    await tx.auditLog.create({ data: {
      action: "SUBMIT_DAILY_CLOSE", entity: "DailyClose", entityId: saved.id, userId: access.user.id,
      details: { date: parsed.data.date, gross: c.gross, net: c.net, countedCash: parsed.data.countedCash, variance },
    } });
    return saved;
  });
  return NextResponse.json({ id: close.id, message: "End-of-day figures submitted for approval" }, { status: 201 });
}
