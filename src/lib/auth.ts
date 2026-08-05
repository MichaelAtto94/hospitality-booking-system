import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "zedstay_session";

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters");
  return new TextEncoder().encode(value);
}

export type SessionPayload = {
  userId: string;
  propertyId: string;
  role: string;
};

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .setIssuer("zedstay-hospitality")
    .setAudience("zedstay-staff")
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: "zedstay-hospitality",
      audience: "zedstay-staff",
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session?.userId) return null;

  return prisma.user.findFirst({
    where: { id: session.userId, propertyId: session.propertyId, isActive: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      propertyId: true,
      property: { select: { name: true } },
    },
  });
}

export const sessionCookie = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 8,
  },
};
