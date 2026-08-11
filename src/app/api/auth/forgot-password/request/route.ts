import { randomInt } from "crypto";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  passwordEmailConfigured,
  sendPasswordResetCode,
} from "@/lib/password-reset-email";
const schema = z.object({ email: z.string().trim().toLowerCase().email() });
const generic =
  "If an active account uses that email, a verification code has been sent.";
export async function POST(request: Request) {
  const p = schema.safeParse(await request.json());
  if (!p.success)
    return NextResponse.json(
      { message: "Enter a valid email address" },
      { status: 400 },
    );
  if (!passwordEmailConfigured())
    return NextResponse.json(
      {
        message:
          "Email recovery is not configured. Contact your administrator.",
      },
      { status: 503 },
    );
  const email = p.data.email,
    user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return NextResponse.json({ message: generic });
  const count = await prisma.passwordResetCode.count({
    where: { email, createdAt: { gte: new Date(Date.now() - 3600000) } },
  });
  if (count >= 3) return NextResponse.json({ message: generic });
  const code = randomInt(100000, 1000000).toString(),
    record = await prisma.passwordResetCode.create({
      data: {
        email,
        codeHash: await hash(code, 10),
        expiresAt: new Date(Date.now() + 600000),
      },
    });
  try {
    await sendPasswordResetCode({ email, firstName: user.firstName, code });
    await prisma.auditLog.create({
      data: {
        action: "PASSWORD_RESET_REQUESTED",
        entity: "User",
        entityId: user.id,
        userId: user.id,
      },
    });
  } catch (error) {
    await prisma.passwordResetCode.delete({ where: { id: record.id } });
    console.error("Recovery email failed", error);
    return NextResponse.json(
      { message: "Unable to send the code. Contact your administrator." },
      { status: 503 },
    );
  }
  return NextResponse.json({ message: generic });
}
