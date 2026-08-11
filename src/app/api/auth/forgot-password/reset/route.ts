import { createHash } from "crypto";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
const strong = z
  .string()
  .min(12, "Use at least 12 characters")
  .max(72)
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[0-9]/, "Add a number")
  .regex(/[^A-Za-z0-9]/, "Add a special character");
const schema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    resetToken: z.string().length(64),
    password: strong,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export async function POST(request: Request) {
  const p = schema.safeParse(await request.json());
  if (!p.success)
    return NextResponse.json(
      { message: p.error.issues[0]?.message ?? "Invalid password" },
      { status: 400 },
    );
  const tokenHash = createHash("sha256")
      .update(p.data.resetToken)
      .digest("hex"),
    r = await prisma.passwordResetCode.findFirst({
      where: {
        email: p.data.email,
        resetTokenHash: tokenHash,
        verifiedAt: { not: null },
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    }),
    user = await prisma.user.findUnique({ where: { email: p.data.email } });
  if (!r || !user || !user.isActive)
    return NextResponse.json(
      { message: "This recovery session is invalid or expired." },
      { status: 400 },
    );
  const now = new Date(),
    passwordHash = await hash(p.data.password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.passwordResetCode.update({
      where: { id: r.id },
      data: { usedAt: now },
    }),
    prisma.passwordResetCode.updateMany({
      where: { email: user.email, id: { not: r.id }, usedAt: null },
      data: { usedAt: now },
    }),
    prisma.auditLog.create({
      data: {
        action: "PASSWORD_RESET_COMPLETED",
        entity: "User",
        entityId: user.id,
        userId: user.id,
        details: { method: "EMAIL_CODE" },
      },
    }),
  ]);
  return NextResponse.json({
    message: "Password reset successfully. You can now sign in.",
  });
}
