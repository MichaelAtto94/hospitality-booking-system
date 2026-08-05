import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).optional(),
  capacity: z.coerce.number().int().min(1).max(20),
  basePrice: z.coerce.number().positive().max(1000000),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const items = await prisma.roomType.findMany({ where: { propertyId: user.propertyId }, include: { _count: { select: { rooms: true } } }, orderBy: { name: "asc" } });
  return NextResponse.json(items.map((item) => ({ ...item, basePrice: Number(item.basePrice) })));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!["SUPER_ADMIN", "MANAGER"].includes(user.role)) return NextResponse.json({ message: "You do not have permission" }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid details" }, { status: 400 });
  try {
    const item = await prisma.roomType.create({ data: { ...parsed.data, description: parsed.data.description || null, propertyId: user.propertyId } });
    await prisma.auditLog.create({ data: { action: "CREATE_ROOM_TYPE", entity: "RoomType", entityId: item.id, userId: user.id } });
    return NextResponse.json({ ...item, basePrice: Number(item.basePrice) }, { status: 201 });
  } catch { return NextResponse.json({ message: "A room type with this name already exists" }, { status: 409 }); }
}
