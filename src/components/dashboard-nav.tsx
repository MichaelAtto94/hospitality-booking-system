"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  BedDouble,
  BookCheck,
  CalendarDays,
  CalendarRange,
  CreditCard,
  FileText,
  Gauge,
  History,
  Hotel,
  Menu,
  Settings,
  Sparkles,
  UserCog,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useState } from "react";

type Role = "SUPER_ADMIN" | "MANAGER" | "RECEPTIONIST" | "ACCOUNTANT" | "HOUSEKEEPER";
type Group = "OVERVIEW" | "OPERATIONS" | "FINANCE" | "MANAGEMENT";
const all: Role[] = ["SUPER_ADMIN", "MANAGER", "RECEPTIONIST", "ACCOUNTANT", "HOUSEKEEPER"];
const management: Role[] = ["SUPER_ADMIN", "MANAGER"];

const links = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge, roles: all, group: "OVERVIEW" },
  { href: "/dashboard/account", label: "My account", icon: UserCog, roles: all, group: "OVERVIEW" },
  { href: "/dashboard/front-desk", label: "Front desk", icon: CalendarDays, roles: ["SUPER_ADMIN", "MANAGER", "RECEPTIONIST"], group: "OPERATIONS" },
  { href: "/dashboard/booking-requests", label: "Booking requests", icon: BookCheck, roles: ["SUPER_ADMIN", "MANAGER", "RECEPTIONIST"], group: "OPERATIONS" },
  { href: "/dashboard/calendar", label: "Availability", icon: CalendarRange, roles: ["SUPER_ADMIN", "MANAGER", "RECEPTIONIST"], group: "OPERATIONS" },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarDays, roles: ["SUPER_ADMIN", "MANAGER", "RECEPTIONIST"], group: "OPERATIONS" },
  { href: "/dashboard/guests", label: "Guests", icon: Users, roles: ["SUPER_ADMIN", "MANAGER", "RECEPTIONIST"], group: "OPERATIONS" },
  { href: "/dashboard/rooms", label: "Rooms", icon: BedDouble, roles: ["SUPER_ADMIN", "MANAGER", "RECEPTIONIST", "HOUSEKEEPER"], group: "OPERATIONS" },
  { href: "/dashboard/housekeeping", label: "Housekeeping", icon: Sparkles, roles: ["SUPER_ADMIN", "MANAGER", "RECEPTIONIST", "HOUSEKEEPER"], group: "OPERATIONS" },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard, roles: ["SUPER_ADMIN", "MANAGER", "RECEPTIONIST", "ACCOUNTANT"], group: "FINANCE" },
  { href: "/dashboard/expenses", label: "Expenses", icon: WalletCards, roles: ["SUPER_ADMIN", "MANAGER", "ACCOUNTANT"], group: "FINANCE" },
  { href: "/dashboard/documents", label: "Documents", icon: FileText, roles: ["SUPER_ADMIN", "MANAGER", "RECEPTIONIST", "ACCOUNTANT"], group: "FINANCE" },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3, roles: ["SUPER_ADMIN", "MANAGER", "ACCOUNTANT"], group: "FINANCE" },
  { href: "/dashboard/analytics", label: "Live analytics", icon: Activity, roles: ["SUPER_ADMIN", "MANAGER", "ACCOUNTANT"], group: "FINANCE" },
  { href: "/dashboard/staff", label: "Staff", icon: UserCog, roles: management, group: "MANAGEMENT" },
  { href: "/dashboard/audit", label: "Audit trail", icon: History, roles: management, group: "MANAGEMENT" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: management, group: "MANAGEMENT" },
];

const groups: { id: Group; label: string }[] = [
  { id: "OVERVIEW", label: "Overview" },
  { id: "OPERATIONS", label: "Operations" },
  { id: "FINANCE", label: "Finance" },
  { id: "MANAGEMENT", label: "Management" },
];

export function DashboardNav({ role }: { role: Role }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label={open ? "Close navigation" : "Open navigation"}
        onClick={() => setOpen((value) => !value)}
        className="fixed left-4 top-3.5 z-50 grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white shadow-xl lg:hidden"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <button
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside className={`${open ? "flex" : "hidden"} fixed inset-y-0 left-0 z-40 w-72 flex-col overflow-hidden bg-slate-950 text-white lg:flex`}>
        <div className="border-b border-white/10 px-6 py-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-600 shadow-lg shadow-blue-950/40">
              <Hotel size={23} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xl font-black tracking-tight text-white">ZedStay</p>
              <p className="truncate text-xs text-slate-400">Hospitality Management</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4">
          {groups.map((group) => {
            const visible = links.filter((link) => link.group === group.id && link.roles.includes(role));
            if (visible.length === 0) return null;
            return (
              <div key={group.id} className="mb-5">
                <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">{group.label}</p>
                <div className="space-y-1">
                  {visible.map(({ href, label, icon: Icon }) => {
                    const active = href === "/dashboard" ? path === href : path.startsWith(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${active ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg shadow-blue-950/30" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
                      >
                        <Icon size={18} className="shrink-0" />
                        <span className="truncate">{label}</span>
                        {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Access level</p>
            <p className="mt-1 truncate text-sm font-bold text-emerald-300">{role.replaceAll("_", " ")}</p>
          </div>
        </div>
      </aside>
    </>
  );
}

