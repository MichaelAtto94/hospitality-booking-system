import { compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { FINANCIAL_ROLES } from "@/lib/daily-close";
import { prisma } from "@/lib/prisma";

export const FINANCE_COOKIE = "zedstay_finance_unlock";

function key() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters");
  return new TextEncoder().encode(secret);
}

export async function verifyOwnPassword(userId: string, password: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  return Boolean(user && await compare(password, user.passwordHash));
}

export async function createFinancialToken(userId: string, propertyId: string) {
  return new SignJWT({ userId, propertyId, purpose: "financial-access" })
    .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("5m")
    .setIssuer("zedstay-hospitality").setAudience("zedstay-finance").sign(key());
}

export async function requireFinancialAccess() {
  const user = await getCurrentUser();
  if (!user) return { error: "UNAUTHENTICATED" as const, user: null };
  if (!FINANCIAL_ROLES.includes(user.role as (typeof FINANCIAL_ROLES)[number])) {
    return { error: "FORBIDDEN" as const, user };
  }
  const token = (await cookies()).get(FINANCE_COOKIE)?.value;
  if (!token) return { error: "LOCKED" as const, user };
  try {
    const { payload } = await jwtVerify(token, key(), {
      issuer: "zedstay-hospitality", audience: "zedstay-finance",
    });
    if (payload.userId !== user.id || payload.propertyId !== user.propertyId || payload.purpose !== "financial-access") {
      return { error: "LOCKED" as const, user };
    }
    return { error: null, user };
  } catch {
    return { error: "LOCKED" as const, user };
  }
}
