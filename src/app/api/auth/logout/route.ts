import { NextResponse } from "next/server";
import { sessionCookie } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out" });
  response.cookies.set(sessionCookie.name, "", { ...sessionCookie.options, maxAge: 0 });
  return response;
}
