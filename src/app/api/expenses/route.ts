import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const expenseSchema = z.object({
  category: z.enum(["UTILITIES", "SUPPLIES", "MAINTENANCE", "SALARIES", "TRANSPORT", "MARKETING", "TAXES", "OTHER"]),
  description: z.string().trim().min(3).max(200),
  amount: z.coerce.number().positive().max(10000000),
  expenseDate: z.coerce.date(),
  paymentMethod: z.enum(["CASH", "CARD", "BANK_TRANSFER", "MTN_MOBILE_MONEY", "AIRTEL_MONEY", "ZAMTEL_KWACHA"]).default("CASH"),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const expenses = await prisma.expense.findMany({ where: { propertyId: user.propertyId }, orderBy: { expenseDate: "desc" } });
  return NextResponse.json(expenses.map((expense) => ({ ...expense, amount: Number(expense.amount) })));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!["SUPER_ADMIN", "MANAGER", "ACCOUNTANT"].includes(user.role)) return NextResponse.json({ message: "You do not have permission" }, { status: 403 });
  const parsed = expenseSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid expense" }, { status: 400 });
  const expense = await prisma.$transaction(async (tx) => {
    const created = await tx.expense.create({ data: { ...parsed.data, propertyId: user.propertyId } });
    await tx.auditLog.create({ data: { action: "CREATE_EXPENSE", entity: "Expense", entityId: created.id, userId: user.id, details: { category: created.category, amount: Number(created.amount), paymentMethod: created.paymentMethod } } });
    return created;
  });
  return NextResponse.json({ ...expense, amount: Number(expense.amount) }, { status: 201 });
}
