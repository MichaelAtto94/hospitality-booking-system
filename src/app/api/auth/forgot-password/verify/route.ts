import { createHash, randomBytes } from "crypto";
import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().regex(/^\d{6}$/, "Enter the six-digit code"),
});
export async function POST(request: Request) {
  const p = schema.safeParse(await request.json());
  if (!p.success)
    return NextResponse.json(
      { message: p.error.issues[0]?.message ?? "Invalid code" },
      { status: 400 },
    );
  const r = await prisma.passwordResetCode.findFirst({
    where: {
      email: p.data.email,
      usedAt: null,
      verifiedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!r || r.attempts >= 5)
    return NextResponse.json(
      { message: "The code is invalid or expired. Request a new code." },
      { status: 400 },
    );
  if (!(await compare(p.data.code, r.codeHash))) {
    await prisma.passwordResetCode.update({
      where: { id: r.id },
      data: { attempts: { increment: 1 } },
    });
    return NextResponse.json(
      { message: "The code is invalid or expired. Request a new code." },
      { status: 400 },
    );
  }
  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetCode.update({
    where: { id: r.id },
    data: {
      verifiedAt: new Date(),
      resetTokenHash: createHash("sha256").update(token).digest("hex"),
    },
  });
  return NextResponse.json({
    message: "Identity confirmed",
    resetToken: token,
  });
}
