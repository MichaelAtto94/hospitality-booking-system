import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const allowedRoles = ["SUPER_ADMIN", "MANAGER", "ACCOUNTANT"];
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function lusakaDayStart(date: Date) {
  const shifted = new Date(date.getTime() + 2 * HOUR);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - 2 * HOUR);
}

function dayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lusaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function dayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-ZM", {
    timeZone: "Africa/Lusaka",
    weekday: "short",
    day: "numeric",
  }).format(date);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!allowedRoles.includes(user.role)) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const now = new Date();
  const todayStart = lusakaDayStart(now);
  const tomorrowStart = new Date(todayStart.getTime() + DAY);
  const sevenDayStart = new Date(todayStart.getTime() - 6 * DAY);
  const shifted = new Date(now.getTime() + 2 * HOUR);
  const monthStart = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), 1) - 2 * HOUR);

  const [
    totalRooms,
    availableRooms,
    occupiedRooms,
    arrivalsToday,
    departuresToday,
    pendingBookings,
    revenueToday,
    revenueMonth,
    expensesMonth,
    trendPayments,
    trendExpenses,
    paymentMethods,
    bookingStatuses,
    roomStatuses,
    bookingSources,
  ] = await Promise.all([
    prisma.room.count({ where: { propertyId: user.propertyId } }),
    prisma.room.count({ where: { propertyId: user.propertyId, status: "AVAILABLE" } }),
    prisma.room.count({ where: { propertyId: user.propertyId, status: "OCCUPIED" } }),
    prisma.booking.count({ where: { propertyId: user.propertyId, checkInDate: { gte: todayStart, lt: tomorrowStart }, status: { in: ["CONFIRMED", "CHECKED_IN"] } } }),
    prisma.booking.count({ where: { propertyId: user.propertyId, checkOutDate: { gte: todayStart, lt: tomorrowStart }, status: { in: ["CHECKED_IN", "CHECKED_OUT"] } } }),
    prisma.booking.count({ where: { propertyId: user.propertyId, status: "PENDING" } }),
    prisma.payment.aggregate({ where: { booking: { propertyId: user.propertyId }, status: "COMPLETED", paidAt: { gte: todayStart, lt: tomorrowStart } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { booking: { propertyId: user.propertyId }, status: "COMPLETED", paidAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { propertyId: user.propertyId, expenseDate: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.payment.findMany({ where: { booking: { propertyId: user.propertyId }, status: "COMPLETED", paidAt: { gte: sevenDayStart, lt: tomorrowStart } }, select: { paidAt: true, amount: true } }),
    prisma.expense.findMany({ where: { propertyId: user.propertyId, expenseDate: { gte: sevenDayStart, lt: tomorrowStart } }, select: { expenseDate: true, amount: true } }),
    prisma.payment.groupBy({ by: ["method"], where: { booking: { propertyId: user.propertyId }, status: "COMPLETED", paidAt: { gte: monthStart } }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.booking.groupBy({ by: ["status"], where: { propertyId: user.propertyId }, _count: { _all: true } }),
    prisma.room.groupBy({ by: ["status"], where: { propertyId: user.propertyId }, _count: { _all: true } }),
    prisma.booking.groupBy({ by: ["source"], where: { propertyId: user.propertyId, createdAt: { gte: monthStart } }, _count: { _all: true } }),
  ]);

  const revenueByDay = new Map<string, number>();
  const expenseByDay = new Map<string, number>();
  for (const payment of trendPayments) revenueByDay.set(dayKey(payment.paidAt), (revenueByDay.get(dayKey(payment.paidAt)) ?? 0) + Number(payment.amount));
  for (const expense of trendExpenses) expenseByDay.set(dayKey(expense.expenseDate), (expenseByDay.get(dayKey(expense.expenseDate)) ?? 0) + Number(expense.amount));

  const trend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sevenDayStart.getTime() + index * DAY);
    const key = dayKey(date);
    return { key, label: dayLabel(date), revenue: revenueByDay.get(key) ?? 0, expenses: expenseByDay.get(key) ?? 0 };
  });

  const monthRevenue = Number(revenueMonth._sum.amount ?? 0);
  const monthExpenses = Number(expensesMonth._sum.amount ?? 0);
  const todayRevenue = Number(revenueToday._sum.amount ?? 0);

  return NextResponse.json({
    generatedAt: now.toISOString(),
    timezone: "Africa/Lusaka",
    metrics: {
      totalRooms,
      availableRooms,
      occupiedRooms,
      occupancyRate: totalRooms === 0 ? 0 : Math.round((occupiedRooms / totalRooms) * 100),
      arrivalsToday,
      departuresToday,
      pendingBookings,
      revenueToday: todayRevenue,
      averageRoomRevenue: occupiedRooms === 0 ? 0 : Math.round(todayRevenue / occupiedRooms),
      revenueMonth: monthRevenue,
      expensesMonth: monthExpenses,
      netMonth: monthRevenue - monthExpenses,
    },
    trend,
    paymentMethods: paymentMethods.map((item) => ({ name: item.method, amount: Number(item._sum.amount ?? 0), count: item._count._all })),
    bookingStatuses: bookingStatuses.map((item) => ({ name: item.status, count: item._count._all })),
    roomStatuses: roomStatuses.map((item) => ({ name: item.status, count: item._count._all })),
    bookingSources: bookingSources.map((item) => ({ name: item.source, count: item._count._all })),
  }, { headers: { "Cache-Control": "no-store" } });
}
