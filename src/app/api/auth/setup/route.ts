import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const setupSchema = z.object({
  propertyName: z.string().trim().min(2).max(120),
  propertyType: z.enum(["HOTEL", "LODGE", "GUEST_HOUSE", "RESORT"]),
  address: z.string().trim().min(3).max(200),
  town: z.string().trim().min(2).max(80),
  province: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(20),
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email().max(150),
  password: z.string().min(8).max(72).regex(/[A-Z]/, "Include an uppercase letter").regex(/[0-9]/, "Include a number"),
});

export async function POST(request: Request) {
  try {
    const parsed = setupSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid details" }, { status: 400 });
    }

    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      return NextResponse.json({ message: "Initial setup has already been completed" }, { status: 409 });
    }

    const data = parsed.data;
    const passwordHash = await hash(data.password, 12);

    await prisma.$transaction(async (tx) => {
      const property = await tx.property.create({
        data: {
          name: data.propertyName,
          type: data.propertyType,
          address: data.address,
          town: data.town,
          province: data.province,
          phone: data.phone,
        },
      });

      const user = await tx.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          passwordHash,
          role: "SUPER_ADMIN",
          propertyId: property.id,
        },
      });

      await tx.auditLog.create({
        data: { action: "SYSTEM_SETUP", entity: "User", entityId: user.id, userId: user.id },
      });
    });

    return NextResponse.json({ message: "Administrator created successfully" }, { status: 201 });
  } catch (error) {
    console.error("Setup error", error);
    return NextResponse.json({ message: "Unable to complete setup" }, { status: 500 });
  }
}
