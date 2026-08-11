import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PendingNotification = {
  type: string;
  priority: string;
  title: string;
  message: string;
  link: string;
  dedupeKey: string;
};

async function synchroniseNotifications(user: {
  id: string;
  role: string;
  propertyId: string;
}) {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const yesterday = new Date(dayStart);
  yesterday.setDate(yesterday.getDate() - 1);
  const rows: PendingNotification[] = [];

  const management = ["SUPER_ADMIN", "MANAGER"].includes(user.role);
  const frontDesk = management || user.role === "RECEPTIONIST";
  const finance = management || user.role === "ACCOUNTANT";
  const roomOperations =
    management || ["RECEPTIONIST", "HOUSEKEEPER"].includes(user.role);

  const [pendingBookings, arrivals, departures, rooms, payments] =
    await Promise.all([
      frontDesk
        ? prisma.booking.findMany({
            where: { propertyId: user.propertyId, status: "PENDING" },
            orderBy: { createdAt: "desc" },
            take: 20,
            select: {
              id: true,
              bookingNumber: true,
              guest: { select: { firstName: true, lastName: true } },
            },
          })
        : [],
      frontDesk
        ? prisma.booking.findMany({
            where: {
              propertyId: user.propertyId,
              checkInDate: { gte: dayStart, lt: dayEnd },
              status: "CONFIRMED",
            },
            select: {
              id: true,
              bookingNumber: true,
              guest: { select: { firstName: true, lastName: true } },
              room: { select: { roomNumber: true } },
            },
          })
        : [],
      frontDesk
        ? prisma.booking.findMany({
            where: {
              propertyId: user.propertyId,
              checkOutDate: { gte: dayStart, lt: dayEnd },
              status: "CHECKED_IN",
            },
            select: {
              id: true,
              bookingNumber: true,
              guest: { select: { firstName: true, lastName: true } },
              room: { select: { roomNumber: true } },
            },
          })
        : [],
      roomOperations
        ? prisma.room.findMany({
            where: {
              propertyId: user.propertyId,
              status: { in: ["CLEANING", "MAINTENANCE", "OUT_OF_SERVICE"] },
            },
            select: {
              id: true,
              roomNumber: true,
              status: true,
              updatedAt: true,
            },
          })
        : [],
      finance
        ? prisma.payment.findMany({
            where: {
              booking: { propertyId: user.propertyId },
              status: "COMPLETED",
              paidAt: { gte: yesterday },
            },
            orderBy: { paidAt: "desc" },
            take: 20,
            select: {
              id: true,
              amount: true,
              method: true,
              receiptNumber: true,
              booking: { select: { bookingNumber: true } },
            },
          })
        : [],
    ]);

  for (const booking of pendingBookings) {
    rows.push({
      type: "BOOKING",
      priority: "HIGH",
      title: "Booking awaiting approval",
      message:
        booking.guest.firstName +
        " " +
        booking.guest.lastName +
        " submitted " +
        booking.bookingNumber +
        ".",
      link: "/dashboard/booking-requests",
      dedupeKey: "pending-booking:" + booking.id,
    });
  }

  for (const booking of arrivals) {
    rows.push({
      type: "ARRIVAL",
      priority: "HIGH",
      title: "Guest arriving today",
      message:
        booking.guest.firstName +
        " " +
        booking.guest.lastName +
        " is expected in room " +
        booking.room.roomNumber +
        ".",
      link: "/dashboard/front-desk",
      dedupeKey:
        "arrival:" + booking.id + ":" + dayStart.toISOString().slice(0, 10),
    });
  }

  for (const booking of departures) {
    rows.push({
      type: "DEPARTURE",
      priority: "NORMAL",
      title: "Departure due today",
      message:
        booking.guest.firstName +
        " " +
        booking.guest.lastName +
        " is checking out from room " +
        booking.room.roomNumber +
        ".",
      link: "/dashboard/front-desk",
      dedupeKey:
        "departure:" + booking.id + ":" + dayStart.toISOString().slice(0, 10),
    });
  }

  for (const room of rooms) {
    const isMaintenance = room.status !== "CLEANING";
    rows.push({
      type: isMaintenance ? "MAINTENANCE" : "HOUSEKEEPING",
      priority: isMaintenance ? "HIGH" : "NORMAL",
      title: isMaintenance
        ? "Room requires attention"
        : "Room awaiting cleaning",
      message:
        "Room " +
        room.roomNumber +
        " is marked " +
        room.status.replaceAll("_", " ").toLowerCase() +
        ".",
      link: "/dashboard/housekeeping",
      dedupeKey:
        "room-status:" +
        room.id +
        ":" +
        room.status +
        ":" +
        room.updatedAt.getTime(),
    });
  }

  for (const payment of payments) {
    rows.push({
      type: "PAYMENT",
      priority: "NORMAL",
      title: "Payment completed",
      message:
        "K " +
        Number(payment.amount).toLocaleString() +
        " received by " +
        payment.method.replaceAll("_", " ") +
        " for " +
        payment.booking.bookingNumber +
        ".",
      link: "/dashboard/payments",
      dedupeKey: "payment:" + payment.id,
    });
  }

  rows.push({
    type: "SYSTEM",
    priority: "LOW",
    title: "Notification centre is active",
    message: "Operational alerts for your role will appear here.",
    link: "/dashboard",
    dedupeKey: "notification-centre-welcome",
  });

  if (rows.length > 0) {
    await prisma.notification.createMany({
      data: rows.map((row) => ({
        ...row,
        userId: user.id,
        propertyId: user.propertyId,
      })),
      skipDuplicates: true,
    });
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await synchroniseNotifications(user);

  const [notifications, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id, propertyId: user.propertyId },
      orderBy: [{ readAt: "asc" }, { createdAt: "desc" }],
      take: 20,
      select: {
        id: true,
        type: true,
        priority: true,
        title: true,
        message: true,
        link: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({
      where: {
        userId: user.id,
        propertyId: user.propertyId,
        readAt: null,
      },
    }),
  ]);

  return NextResponse.json({ notifications, unread });
}

const updateSchema = z.union([
  z.object({ all: z.literal(true) }),
  z.object({ id: z.string().min(1) }),
]);

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const where =
    "all" in parsed.data
      ? { userId: user.id, propertyId: user.propertyId, readAt: null }
      : {
          id: parsed.data.id,
          userId: user.id,
          propertyId: user.propertyId,
        };

  await prisma.notification.updateMany({
    where,
    data: { readAt: new Date() },
  });

  return NextResponse.json({ message: "Notification updated" });
}
