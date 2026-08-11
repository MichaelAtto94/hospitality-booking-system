import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  BookOpenCheck,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  DoorOpen,
  Hotel,
  Plus,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statusStyle: Record<string, string> = {
  PENDING:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
  CONFIRMED:
    "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20",
  CHECKED_IN:
    "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20",
  CHECKED_OUT:
    "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10",
  CANCELLED:
    "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const weekEnd = new Date(start);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [
    available,
    occupied,
    totalRooms,
    arrivals,
    departures,
    inHouse,
    revenue,
    pending,
    cleaning,
    maintenance,
    upcoming,
    recent,
  ] = await Promise.all([
    prisma.room.count({
      where: { propertyId: user.propertyId, status: "AVAILABLE" },
    }),
    prisma.room.count({
      where: { propertyId: user.propertyId, status: "OCCUPIED" },
    }),
    prisma.room.count({ where: { propertyId: user.propertyId } }),
    prisma.booking.count({
      where: {
        propertyId: user.propertyId,
        checkInDate: { gte: start, lt: end },
        status: { in: ["CONFIRMED", "CHECKED_IN"] },
      },
    }),
    prisma.booking.count({
      where: {
        propertyId: user.propertyId,
        checkOutDate: { gte: start, lt: end },
        status: "CHECKED_IN",
      },
    }),
    prisma.booking.aggregate({
      where: { propertyId: user.propertyId, status: "CHECKED_IN" },
      _sum: { adults: true, children: true },
    }),
    prisma.payment.aggregate({
      where: {
        booking: { propertyId: user.propertyId },
        status: "COMPLETED",
        paidAt: { gte: start, lt: end },
      },
      _sum: { amount: true },
    }),
    prisma.booking.count({
      where: { propertyId: user.propertyId, status: "PENDING" },
    }),
    prisma.room.count({
      where: { propertyId: user.propertyId, status: "CLEANING" },
    }),
    prisma.room.count({
      where: {
        propertyId: user.propertyId,
        status: { in: ["MAINTENANCE", "OUT_OF_SERVICE"] },
      },
    }),
    prisma.booking.count({
      where: {
        propertyId: user.propertyId,
        checkInDate: { gte: start, lt: weekEnd },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
    prisma.booking.findMany({
      where: { propertyId: user.propertyId },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        bookingNumber: true,
        status: true,
        checkInDate: true,
        totalAmount: true,
        guest: { select: { firstName: true, lastName: true } },
        room: { select: { roomNumber: true } },
      },
    }),
  ]);

  const guests = (inHouse._sum.adults ?? 0) + (inHouse._sum.children ?? 0);
  const occupancy =
    totalRooms === 0 ? 0 : Math.round((occupied / totalRooms) * 100);
  const revenueToday = Number(revenue._sum.amount ?? 0);
  const readiness =
    totalRooms === 0 ? 0 : Math.round((available / totalRooms) * 100);
  const today = new Intl.DateTimeFormat("en-ZM", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(start);

  const stats = [
    {
      label: "Available rooms",
      value: available,
      note:
        totalRooms === 0
          ? "Add your first room"
          : readiness + "% ready to sell",
      icon: BedDouble,
      iconClass:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
      barClass: "from-emerald-500 to-teal-400",
    },
    {
      label: "Occupied rooms",
      value: occupied,
      note: occupancy + "% current occupancy",
      icon: CalendarCheck2,
      iconClass:
        "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
      barClass: "from-blue-600 to-cyan-400",
    },
    {
      label: "Guests in house",
      value: guests,
      note: arrivals + " arriving today",
      icon: Users,
      iconClass:
        "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
      barClass: "from-violet-600 to-fuchsia-400",
    },
    {
      label: "Revenue today",
      value: "K " + revenueToday.toLocaleString(),
      note: "Completed payments",
      icon: CircleDollarSign,
      iconClass:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
      barClass: "from-amber-500 to-orange-400",
    },
  ];

  const operations = [
    {
      label: "Arrivals",
      value: arrivals,
      icon: CalendarClock,
      tone: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    },
    {
      label: "Departures",
      value: departures,
      icon: DoorOpen,
      tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    },
    {
      label: "Pending requests",
      value: pending,
      icon: Clock3,
      tone: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    },
    {
      label: "Rooms cleaning",
      value: cleaning,
      icon: Sparkles,
      tone: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    },
  ];

  return (
    <main className="min-h-full bg-slate-100/70 px-4 py-5 dark:bg-slate-950 sm:px-6 md:py-7 xl:px-8">
      <div className="mx-auto max-w-[1560px]">
        <section className="relative overflow-hidden rounded-[30px] bg-[#071126] px-6 py-7 text-white shadow-[0_25px_70px_-35px_rgba(15,23,42,0.9)] md:px-9 md:py-9">
          <div className="pointer-events-none absolute -right-20 -top-36 h-80 w-80 rounded-full bg-blue-500/25 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-10rem] left-1/3 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:36px_36px]" />

          <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,.9)]" />
                Live property overview
              </div>
              <p className="mt-5 text-sm font-semibold text-slate-400">
                {today}
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
                Welcome back, {user.firstName}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Here is what is happening at {user.property.name} today.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/bookings"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur hover:bg-white/15"
              >
                <BookOpenCheck size={17} /> View bookings
              </Link>
              <Link
                href="/dashboard/front-desk"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/30 hover:from-emerald-400 hover:to-teal-400"
              >
                <DoorOpen size={17} /> Open front desk
              </Link>
            </div>
          </div>
        </section>

        <section className="relative z-10 -mt-2 grid gap-4 pt-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(
            ({ label, value, note, icon: Icon, iconClass, barClass }) => (
              <article
                key={label}
                className="group relative overflow-hidden rounded-[24px] border border-white bg-white p-5 shadow-[0_18px_50px_-30px_rgba(15,23,42,.45)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_22px_55px_-28px_rgba(15,23,42,.5)] dark:border-white/10 dark:bg-slate-900"
              >
                <div
                  className={
                    "absolute inset-x-0 top-0 h-1 bg-gradient-to-r " + barClass
                  }
                />
                <div className="flex items-start justify-between">
                  <span
                    className={
                      "grid h-11 w-11 place-items-center rounded-2xl " +
                      iconClass
                    }
                  >
                    <Icon size={21} />
                  </span>
                  <ArrowRight
                    size={17}
                    className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-500"
                  />
                </div>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.09em] text-slate-500 dark:text-slate-400">
                  {label}
                </p>
                <p className="mt-1 text-[2rem] font-black tracking-tight text-slate-950 dark:text-white">
                  {value}
                </p>
                <p className="mt-1.5 text-xs font-medium text-slate-400">
                  {note}
                </p>
              </article>
            ),
          )}
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <article className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_18px_55px_-38px_rgba(15,23,42,.5)] dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-white/10">
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">
                  Recent bookings
                </h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  Latest reservation activity
                </p>
              </div>
              <Link
                href="/dashboard/bookings"
                className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400"
              >
                View all <ChevronRight size={16} />
              </Link>
            </div>

            {recent.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-white/10">
                {recent.map((booking) => (
                  <div
                    key={booking.id}
                    className="grid gap-3 px-6 py-4 transition hover:bg-slate-50 dark:hover:bg-white/[0.03] md:grid-cols-[1fr_auto_auto] md:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-sm font-black text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        {booking.guest.firstName.charAt(0)}
                        {booking.guest.lastName.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900 dark:text-white">
                          {booking.guest.firstName} {booking.guest.lastName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {booking.bookingNumber} Â· Room{" "}
                          {booking.room.roomNumber}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm md:text-right">
                      <p className="font-black text-slate-800 dark:text-slate-200">
                        K {Number(booking.totalAmount).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400">
                        {booking.checkInDate.toLocaleDateString("en-ZM")}
                      </p>
                    </div>
                    <span
                      className={
                        "w-fit rounded-full px-2.5 py-1 text-[10px] font-extrabold ring-1 " +
                        (statusStyle[booking.status] ??
                          "bg-slate-100 text-slate-600 ring-slate-200")
                      }
                    >
                      {booking.status.replaceAll("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid min-h-[330px] place-items-center px-6 py-10 text-center">
                <div>
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-gradient-to-br from-blue-100 to-emerald-100 text-blue-700 dark:from-blue-500/15 dark:to-emerald-500/15 dark:text-blue-300">
                    <CalendarCheck2 size={29} />
                  </span>
                  <h3 className="mt-5 text-lg font-black text-slate-900 dark:text-white">
                    Your bookings will appear here
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Create the first reservation to begin tracking arrivals,
                    guests and revenue.
                  </p>
                  <Link
                    href="/dashboard/bookings"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950"
                  >
                    <Plus size={17} /> Create booking
                  </Link>
                </div>
              </div>
            )}
          </article>

          <div className="space-y-5">
            <article className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-indigo-950 via-slate-950 to-emerald-950 p-6 text-white shadow-[0_22px_55px_-30px_rgba(15,23,42,.9)]">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Room occupancy
                  </p>
                  <p className="mt-2 text-5xl font-black">{occupancy}%</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {occupied} of {totalRooms} rooms occupied
                  </p>
                </div>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-emerald-300">
                  <Hotel size={23} />
                </span>
              </div>
              <div className="relative mt-7 h-2.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400"
                  style={{ width: occupancy + "%" }}
                />
              </div>
              <div className="relative mt-3 flex justify-between text-xs text-slate-400">
                <span>{available} available</span>
                <span>{guests} guests in house</span>
              </div>
            </article>

            <article className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_-38px_rgba(15,23,42,.5)] dark:border-white/10 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-black text-slate-950 dark:text-white">
                    Today at a glance
                  </h2>
                  <p className="text-xs text-slate-500">
                    {upcoming} stays in the next 7 days
                  </p>
                </div>
                <TrendingUp size={19} className="text-emerald-500" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {operations.map(({ label, value, icon: Icon, tone }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-slate-100 p-3.5 dark:border-white/10"
                  >
                    <span
                      className={
                        "grid h-8 w-8 place-items-center rounded-xl " + tone
                      }
                    >
                      <Icon size={16} />
                    </span>
                    <p className="mt-3 text-xl font-black text-slate-950 dark:text-white">
                      {value}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.35fr]">
          <article className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_-38px_rgba(15,23,42,.5)] dark:border-white/10 dark:bg-slate-900">
            <h2 className="font-black text-slate-950 dark:text-white">
              Quick actions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Common front-desk tasks
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <QuickAction
                href="/dashboard/bookings"
                label="New booking"
                icon={Plus}
                colour="text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-300"
              />
              <QuickAction
                href="/dashboard/guests"
                label="Add guest"
                icon={UserPlus}
                colour="text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-300"
              />
              <QuickAction
                href="/dashboard/front-desk"
                label="Check in"
                icon={DoorOpen}
                colour="text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-300"
              />
              <QuickAction
                href="/dashboard/payments"
                label="Record payment"
                icon={CircleDollarSign}
                colour="text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-300"
              />
            </div>
          </article>

          <article className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_-38px_rgba(15,23,42,.5)] dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-black text-slate-950 dark:text-white">
                  Room readiness
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Live operational room status
                </p>
              </div>
              <Link
                href="/dashboard/rooms"
                className="text-sm font-bold text-blue-600 dark:text-blue-400"
              >
                Manage rooms
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-4">
              <RoomState
                label="Available"
                value={available}
                total={totalRooms}
                colour="bg-emerald-500"
                icon={CheckCircle2}
              />
              <RoomState
                label="Occupied"
                value={occupied}
                total={totalRooms}
                colour="bg-blue-500"
                icon={BedDouble}
              />
              <RoomState
                label="Cleaning"
                value={cleaning}
                total={totalRooms}
                colour="bg-violet-500"
                icon={Sparkles}
              />
              <RoomState
                label="Maintenance"
                value={maintenance}
                total={totalRooms}
                colour="bg-amber-500"
                icon={Wrench}
              />
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

function QuickAction({
  href,
  label,
  icon: Icon,
  colour,
}: {
  href: string;
  label: string;
  icon: typeof Plus;
  colour: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-slate-100 p-3 transition hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-sm dark:border-white/10"
    >
      <span
        className={
          "grid h-9 w-9 shrink-0 place-items-center rounded-xl " + colour
        }
      >
        <Icon size={17} />
      </span>
      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
        {label}
      </span>
      <ChevronRight
        size={15}
        className="ml-auto text-slate-300 transition group-hover:translate-x-0.5"
      />
    </Link>
  );
}

function RoomState({
  label,
  value,
  total,
  colour,
  icon: Icon,
}: {
  label: string;
  value: number;
  total: number;
  colour: string;
  icon: typeof BedDouble;
}) {
  const percentage = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
          <Icon size={14} />
          {label}
        </span>
        <span className="text-sm font-black text-slate-950 dark:text-white">
          {value}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
        <div
          className={"h-full rounded-full " + colour}
          style={{ width: percentage + "%" }}
        />
      </div>
      <p className="mt-1.5 text-[10px] font-semibold text-slate-400">
        {percentage}% of rooms
      </p>
    </div>
  );
}
