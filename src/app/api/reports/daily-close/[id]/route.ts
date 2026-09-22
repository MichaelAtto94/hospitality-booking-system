import { NextResponse } from "next/server";
import { z } from "zod";
import { APPROVER_ROLES } from "@/lib/daily-close";
import { requireFinancialAccess, verifyOwnPassword } from "@/lib/financial-access";
import { prisma } from "@/lib/prisma";

const schema = z.object({ action: z.enum(["APPROVE", "REOPEN"]), password: z.string().min(1) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireFinancialAccess();
  if (access.error || !access.user) return NextResponse.json({ message: "Financial access is locked" }, { status: access.error === "LOCKED" ? 423 : 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  if (!await verifyOwnPassword(access.user.id, parsed.data.password)) return NextResponse.json({ message: "Password is incorrect" }, { status: 401 });
  const { id } = await params;
  const closing = await prisma.dailyClose.findFirst({ where: { id, propertyId: access.user.propertyId } });
  if (!closing) return NextResponse.json({ message: "Closing report not found" }, { status: 404 });

  if (parsed.data.action === "APPROVE") {
    if (!APPROVER_ROLES.includes(access.user.role as (typeof APPROVER_ROLES)[number])) return NextResponse.json({ message: "Only management can approve the report" }, { status: 403 });
    if (closing.status !== "SUBMITTED") return NextResponse.json({ message: "Only submitted reports can be approved" }, { status: 409 });
    await prisma.$transaction([
      prisma.dailyClose.update({ where: { id }, data: { status: "APPROVED", approvedById: access.user.id, approvedAt: new Date() } }),
      prisma.auditLog.create({ data: { action: "APPROVE_DAILY_CLOSE", entity: "DailyClose", entityId: id, userId: access.user.id, details: { sameUserApproval: closing.preparedById === access.user.id } } }),
    ]);
    return NextResponse.json({ message: "Financial day approved and locked" });
  }

  if (access.user.role !== "SUPER_ADMIN") return NextResponse.json({ message: "Only the super administrator can reopen an approved day" }, { status: 403 });
  if (closing.status !== "APPROVED") return NextResponse.json({ message: "Only approved reports can be reopened" }, { status: 409 });
  await prisma.$transaction([
    prisma.dailyClose.update({ where: { id }, data: { status: "REOPENED", reopenedById: access.user.id, reopenedAt: new Date() } }),
    prisma.auditLog.create({ data: { action: "REOPEN_DAILY_CLOSE", entity: "DailyClose", entityId: id, userId: access.user.id } }),
  ]);
  return NextResponse.json({ message: "Financial day reopened; submit corrected figures when ready" });
}
