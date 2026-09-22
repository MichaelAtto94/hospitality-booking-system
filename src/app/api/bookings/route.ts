import { NextResponse } from "next/server";
import { differenceInCalendarDays } from "date-fns";
import { z } from "zod"; 
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


const bookingSchema = z.object({
  guestId: z.string().min(1, "Select a guest"),
  roomId: z.string().min(1, "Select a room"),
  checkInDate: z.coerce.date(),
  checkOutDate: z.coerce.date(),
  adults: z.coerce.number().int().min(1).max(20),
  children: z.coerce.number().int().min(0).max(20),
  source: z
    .enum(["WALK_IN", "PHONE", "WEBSITE", "TRAVEL_AGENT"])
    .default("WALK_IN"),
  notes: z.string().trim().max(500).optional(),
});

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  const bookings = await prisma.booking.findMany({
    where: {
      propertyId: user.propertyId,
    },
    include: {
      guest: true,
      room: {
        include: {
          roomType: true,
        },
      },
      payments: true,
    },
    orderBy: {
      checkInDate: "desc",
    },
  });

  const results = bookings.map((booking) => ({
    ...booking,
    totalAmount: Number(booking.totalAmount),
    room: {
      ...booking.room,
      roomType: {
        ...booking.room.roomType,
        basePrice: Number(booking.room.roomType.basePrice),
      },
    },
    payments: booking.payments.map((payment) => ({
      ...payment,
      amount: Number(payment.amount),
    })),
  }));

  return NextResponse.json(results);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  const validation = bookingSchema.safeParse(await request.json());

  if (!validation.success) {
    return NextResponse.json(
      {
        message:
          validation.error.issues[0]?.message ??
          "Invalid booking details",
      },
      { status: 400 }
    );
  }

  const data = validation.data;

  const numberOfNights = differenceInCalendarDays(
    data.checkOutDate,
    data.checkInDate
  );

  if (numberOfNights < 1) {
    return NextResponse.json(
      { message: "Check-out must be after check-in" },
      { status: 400 }
    );
  }

  const room = await prisma.room.findFirst({
    where: {
      id: data.roomId,
      propertyId: user.propertyId,
    },
    include: {
      roomType: true,
    },
  });

  if (!room) {
    return NextResponse.json(
      { message: "Room not found" },
      { status: 404 }
    );
  }

  if (
    room.status === "MAINTENANCE" ||
    room.status === "OUT_OF_SERVICE"
  ) {
    return NextResponse.json(
      { message: "This room is currently unavailable" },
      { status: 409 }
    );
  }

  const totalGuests = data.adults + data.children;

  if (totalGuests > room.roomType.capacity) {
    return NextResponse.json(
      {
        message: `This room can accommodate a maximum of ${room.roomType.capacity} guests`,
      },
      { status: 400 }
    );
  }

  const guest = await prisma.guest.findFirst({
    where: {
      id: data.guestId,
      propertyId: user.propertyId,
    },
  });

  if (!guest) {
    return NextResponse.json(
      { message: "Guest not found" },
      { status: 404 }
    );
  }

  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      roomId: room.id,
      status: {
        in: ["PENDING", "CONFIRMED", "CHECKED_IN"],
      },
      checkInDate: {
        lt: data.checkOutDate,
      },
      checkOutDate: {
        gt: data.checkInDate,
      },
    },
  });

  if (conflictingBooking) {
    return NextResponse.json(
      {
        message: `Room is already booked under ${conflictingBooking.bookingNumber} for overlapping dates`,
      },
      { status: 409 }
    );
  }

  const bookingNumber = `ZST-${Date.now()
    .toString()
    .slice(-8)}-${Math.floor(Math.random() * 900 + 100)}`;

  const totalAmount =
    Number(room.roomType.basePrice) * numberOfNights;

  const booking = await prisma.$transaction(async (transaction) => {
    const createdBooking = await transaction.booking.create({
      data: {
        bookingNumber,
        checkInDate: data.checkInDate,
        checkOutDate: data.checkOutDate,
        adults: data.adults,
        children: data.children,
        source: data.source,
        notes: data.notes || null,
        totalAmount,
        status: "CONFIRMED",
        guestId: guest.id,
        roomId: room.id,
        propertyId: user.propertyId,
      },
    });

    await transaction.auditLog.create({
      data: {
        action: "CREATE_BOOKING",
        entity: "Booking",
        entityId: createdBooking.id,
        userId: user.id,
        details: {
          bookingNumber,
          numberOfNights,
          totalAmount,
          roomNumber: room.roomNumber,
        },
      },
    });

    return createdBooking;
  });

  return NextResponse.json(
    {
      ...booking,
      totalAmount: Number(booking.totalAmount),
    },
    { status: 201 }
  );
}
