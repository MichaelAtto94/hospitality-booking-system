import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ roomNumber: z.string().trim().min(1).max(20), floor: z.string().trim().max(30).optional(), roomTypeId: z.string().min(1) });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const rooms = await prisma.room.findMany({ where: { propertyId: user.propertyId }, include: { roomType: true }, orderBy: { roomNumber: "asc" } });
  return NextResponse.json(rooms.map((room) => ({ ...room, roomType: { ...room.roomType, basePrice: Number(room.roomType.basePrice) } })));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!["SUPER_ADMIN", "MANAGER"].includes(user.role)) return NextResponse.json({ message: "You do not have permission" }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid details" }, { status: 400 });
  const type = await prisma.roomType.findFirst({ where: { id: parsed.data.roomTypeId, propertyId: user.propertyId } });
  if (!type) return NextResponse.json({ message: "Room type not found" }, { status: 404 });
  try {
    const room = await prisma.room.create({ data: { roomNumber: parsed.data.roomNumber, floor: parsed.data.floor || null, roomTypeId: type.id, propertyId: user.propertyId } });
    await prisma.auditLog.create({ data: { action: "CREATE_ROOM", entity: "Room", entityId: room.id, userId: user.id } });
    return NextResponse.json(room, { status: 201 });
  } catch { return NextResponse.json({ message: "This room number already exists" }, { status: 409 }); }
}
