import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { FINANCIAL_ROLES } from "@/lib/daily-close";
import { createFinancialToken, FINANCE_COOKIE, verifyOwnPassword } from "@/lib/financial-access";

const schema = z.object({ password: z.string().min(1, "Enter your password") });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!FINANCIAL_ROLES.includes(user.role as (typeof FINANCIAL_ROLES)[number])) {
    return NextResponse.json({ message: "Financial reports are restricted" }, { status: 403 });
  }
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message }, { status: 400 });
  if (!await verifyOwnPassword(user.id, parsed.data.password)) {
    return NextResponse.json({ message: "Password is incorrect" }, { status: 401 });
  }
  const response = NextResponse.json({ message: "Financial figures unlocked for five minutes" });
  response.cookies.set(FINANCE_COOKIE, await createFinancialToken(user.id, user.propertyId), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 300,
  });
  return response;
}
