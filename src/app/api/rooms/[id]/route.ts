import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING", "MAINTENANCE", "OUT_OF_SERVICE"]) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: "Invalid room status" }, { status: 400 });
  const { id } = await context.params;
  const existing = await prisma.room.findFirst({ where: { id, propertyId: user.propertyId } });
  if (!existing) return NextResponse.json({ message: "Room not found" }, { status: 404 });
  const room = await prisma.room.update({ where: { id }, data: { status: parsed.data.status } });
  await prisma.auditLog.create({ data: { action: "UPDATE_ROOM_STATUS", entity: "Room", entityId: room.id, userId: user.id, details: { from: existing.status, to: room.status } } });
  return NextResponse.json(room);
}
