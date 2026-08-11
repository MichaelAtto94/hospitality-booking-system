import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const strongPassword = z
  .string()
  .min(12, "Password must contain at least 12 characters")
  .max(72, "Password must not exceed 72 characters")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[0-9]/, "Include a number")
  .regex(/[^A-Za-z0-9]/, "Include a special character");

const schema = z
  .object({ password: strongPassword, confirmPassword: z.string() })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (user.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { message: "Only a Super Administrator can reset staff passwords" },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  if (id === user.id) {
    return NextResponse.json(
      { message: "Use My Account to change your own password" },
      { status: 400 },
    );
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid password" },
      { status: 400 },
    );
  }

  const staff = await prisma.user.findFirst({
    where: { id, propertyId: user.propertyId },
    select: { id: true, email: true, role: true },
  });
  if (!staff) {
    return NextResponse.json(
      { message: "Staff account not found" },
      { status: 404 },
    );
  }

  const passwordHash = await hash(parsed.data.password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: staff.id }, data: { passwordHash } }),
    prisma.auditLog.create({
      data: {
        action: "ADMIN_RESET_PASSWORD",
        entity: "User",
        entityId: staff.id,
        userId: user.id,
        details: { targetEmail: staff.email, targetRole: staff.role },
      },
    }),
  ]);

  return NextResponse.json({ message: "Password reset successfully" });
}
