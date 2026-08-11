/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  Bell,
  CalendarCheck2,
  Check,
  CheckCheck,
  CircleDollarSign,
  DoorOpen,
  LoaderCircle,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Notification = {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

const iconMap = {
  BOOKING: CalendarCheck2,
  ARRIVAL: DoorOpen,
  DEPARTURE: DoorOpen,
  PAYMENT: CircleDollarSign,
  HOUSEKEEPING: Sparkles,
  MAINTENANCE: Wrench,
};

const toneMap: Record<string, string> = {
  BOOKING: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
  ARRIVAL:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
  DEPARTURE:
    "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
  PAYMENT:
    "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
  HOUSEKEEPING:
    "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/10 dark:text-fuchsia-300",
  MAINTENANCE: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300",
  SYSTEM: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
};

function notificationTime(value: string) {
  return new Date(value).toLocaleString("en-ZM", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const result = await response.json();
      setNotifications(result.notifications);
      setUnread(result.unread);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function markRead(id: string) {
    setNotifications((items) =>
      items.map((item) =>
        item.id === id ? { ...item, readAt: new Date().toISOString() } : item,
      ),
    );
    setUnread((value) => Math.max(0, value - 1));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function markAllRead() {
    setNotifications((items) =>
      items.map((item) => ({
        ...item,
        readAt: item.readAt ?? new Date().toISOString(),
      })),
    );
    setUnread(0);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={
          "Notifications" + (unread > 0 ? ", " + unread + " unread" : "")
        }
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-red-500 px-1 text-[9px] font-black text-white dark:border-slate-900">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <section className="fixed inset-x-3 top-16 z-50 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl shadow-slate-950/25 dark:border-white/10 dark:bg-slate-900 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[390px]">
            <div className="flex items-start justify-between border-b border-slate-100 bg-gradient-to-r from-slate-950 to-indigo-950 px-5 py-4 text-white dark:border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-emerald-300" />
                  <h2 className="font-black">Notifications</h2>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {unread === 0
                    ? "You are all caught up"
                    : unread + " unread alert" + (unread === 1 ? "" : "s")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-white/10">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                Latest activity
              </p>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[min(65vh,560px)] overflow-y-auto">
              {loading ? (
                <div className="grid min-h-48 place-items-center">
                  <LoaderCircle className="animate-spin text-blue-600" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="grid min-h-56 place-items-center px-6 text-center">
                  <div>
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/10">
                      <Bell size={24} />
                    </span>
                    <p className="mt-4 font-black text-slate-900 dark:text-white">
                      No notifications yet
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      New operational alerts will appear here.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/10">
                  {notifications.map((item) => {
                    const Icon =
                      iconMap[item.type as keyof typeof iconMap] ?? Bell;
                    const content = (
                      <div
                        className={
                          "group relative flex gap-3 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-white/[0.03] " +
                          (!item.readAt
                            ? "bg-blue-50/45 dark:bg-blue-500/[0.04]"
                            : "")
                        }
                      >
                        {!item.readAt && (
                          <span className="absolute left-1.5 top-6 h-2 w-2 rounded-full bg-blue-500" />
                        )}
                        <span
                          className={
                            "grid h-10 w-10 shrink-0 place-items-center rounded-xl " +
                            (toneMap[item.type] ?? toneMap.SYSTEM)
                          }
                        >
                          <Icon size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-black text-slate-900 dark:text-white">
                              {item.title}
                            </p>
                            <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                              {notificationTime(item.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                            {item.message}
                          </p>
                        </div>
                        {!item.readAt && (
                          <button
                            type="button"
                            title="Mark as read"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              void markRead(item.id);
                            }}
                            className="absolute bottom-2 right-3 rounded-lg p-1.5 text-slate-300 opacity-0 transition hover:bg-white hover:text-emerald-600 group-hover:opacity-100 dark:hover:bg-white/10"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    );
                    return item.link ? (
                      <Link
                        key={item.id}
                        href={item.link}
                        onClick={() => {
                          if (!item.readAt) void markRead(item.id);
                          setOpen(false);
                        }}
                      >
                        {content}
                      </Link>
                    ) : (
                      <div key={item.id}>{content}</div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
