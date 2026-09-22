import { prisma } from "./prisma";

export const FINANCIAL_ROLES = ["SUPER_ADMIN", "MANAGER", "ACCOUNTANT"] as const;
export const APPROVER_ROLES = ["SUPER_ADMIN", "MANAGER"] as const;

export type MethodTotals = {
  CASH: number;
  CARD: number;
  BANK_TRANSFER: number;
  MTN_MOBILE_MONEY: number;
  AIRTEL_MONEY: number;
  ZAMTEL_KWACHA: number;
};

export function zambiaDayRange(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("INVALID_DATE");
  const start = new Date(`${date}T00:00:00+02:00`);
  if (Number.isNaN(start.getTime())) throw new Error("INVALID_DATE");
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end, businessDate: new Date(`${date}T00:00:00.000Z`) };
}

export function calculateClose(totals: MethodTotals, refunds: number, expenses: number, countedCash: number, cashDeductions = 0) {
  const gross = Object.values(totals).reduce((sum, value) => sum + value, 0);
  const expectedCash = totals.CASH - cashDeductions;
  return {
    gross,
    refunds,
    expenses,
    net: gross - refunds - expenses,
    expectedCash,
    countedCash,
    variance: countedCash - expectedCash,
  };
}

export async function getDailyFigures(propertyId: string, date: string) {
  const { start, end, businessDate } = zambiaDayRange(date);
  const [methodRows, refundRows, expenseRows, transactions, closing] = await Promise.all([
    prisma.payment.groupBy({
      by: ["method"],
      where: { booking: { propertyId }, status: { in: ["COMPLETED", "REFUNDED"] }, paidAt: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    prisma.refund.groupBy({
      by: ["method"],
      where: { payment: { booking: { propertyId } }, status: "APPROVED", approvedAt: { gte: start, lt: end } },
      _sum: { amount: true }, _count: true,
    }),
    prisma.expense.groupBy({
      by: ["paymentMethod"],
      where: { propertyId, expenseDate: { gte: start, lt: end } },
      _sum: { amount: true }, _count: true,
    }),
    prisma.payment.count({
      where: { booking: { propertyId }, status: { in: ["COMPLETED", "REFUNDED"] }, paidAt: { gte: start, lt: end } },
    }),
    prisma.dailyClose.findUnique({
      where: { propertyId_businessDate: { propertyId, businessDate } },
      include: {
        preparedBy: { select: { firstName: true, lastName: true, role: true } },
        approvedBy: { select: { firstName: true, lastName: true, role: true } },
        reopenedBy: { select: { firstName: true, lastName: true, role: true } },
      },
    }),
  ]);

  const totals: MethodTotals = {
    CASH: 0, CARD: 0, BANK_TRANSFER: 0, MTN_MOBILE_MONEY: 0, AIRTEL_MONEY: 0, ZAMTEL_KWACHA: 0,
  };
  for (const row of methodRows) totals[row.method] = Number(row._sum.amount ?? 0);
  const refundTotals: MethodTotals = { CASH: 0, CARD: 0, BANK_TRANSFER: 0, MTN_MOBILE_MONEY: 0, AIRTEL_MONEY: 0, ZAMTEL_KWACHA: 0 };
  const expenseTotals: MethodTotals = { CASH: 0, CARD: 0, BANK_TRANSFER: 0, MTN_MOBILE_MONEY: 0, AIRTEL_MONEY: 0, ZAMTEL_KWACHA: 0 };
  let refundCount = 0; let expenseCount = 0;
  for (const row of refundRows) { refundTotals[row.method] = Number(row._sum.amount ?? 0); refundCount += row._count; }
  for (const row of expenseRows) { expenseTotals[row.paymentMethod] = Number(row._sum.amount ?? 0); expenseCount += row._count; }
  const refundAmount = Object.values(refundTotals).reduce((sum, value) => sum + value, 0);
  const expenseAmount = Object.values(expenseTotals).reduce((sum, value) => sum + value, 0);
  const cashDeductions = refundTotals.CASH + expenseTotals.CASH;
  const calculated = calculateClose(totals, refundAmount, expenseAmount, totals.CASH - cashDeductions, cashDeductions);

  return {
    date, businessDate, totals, refundAmount, expenseAmount,
    refundTotals, expenseTotals, refundCount, expenseCount,
    transactionCount: transactions, calculated, closing,
  };
}

export function serializeClose(value: Awaited<ReturnType<typeof getDailyFigures>>) {
  const closing = value.closing;
  return {
    ...value,
    businessDate: value.businessDate.toISOString(),
    closing: closing ? {
      ...closing,
      businessDate: closing.businessDate.toISOString(),
      cashAmount: Number(closing.cashAmount), cardAmount: Number(closing.cardAmount),
      bankTransferAmount: Number(closing.bankTransferAmount), mtnAmount: Number(closing.mtnAmount),
      airtelAmount: Number(closing.airtelAmount), zamtelAmount: Number(closing.zamtelAmount),
      refundAmount: Number(closing.refundAmount), grossAmount: Number(closing.grossAmount),
      expenseAmount: Number(closing.expenseAmount), netAmount: Number(closing.netAmount),
      expectedCash: Number(closing.expectedCash), countedCash: Number(closing.countedCash),
      cashVariance: Number(closing.cashVariance),
    } : null,
  };
}
