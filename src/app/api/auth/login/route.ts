import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionToken, sessionCookie } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(72),
});

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: "Enter a valid email and password" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    const validPassword = user ? await compare(parsed.data.password, user.passwordHash) : false;

    if (!user || !validPassword || !user.isActive) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    const token = await createSessionToken({ userId: user.id, propertyId: user.propertyId, role: user.role });
    const response = NextResponse.json({ message: "Login successful" });
    response.cookies.set(sessionCookie.name, token, sessionCookie.options);

    await prisma.auditLog.create({
      data: { action: "LOGIN", entity: "User", entityId: user.id, userId: user.id },
    });
    return response;
  } catch (error) {
    console.error("Login error", error);
    return NextResponse.json({ message: "Unable to sign in" }, { status: 500 });
  }
}
