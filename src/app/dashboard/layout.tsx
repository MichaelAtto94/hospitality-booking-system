import { Building2, CalendarDays } from "lucide-react";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { AppearanceControls } from "@/components/appearance-controls";
import { NotificationBell } from "@/components/notification-bell";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const today = new Intl.DateTimeFormat("en-ZM", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <DashboardNav role={user.role} />
      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-5 py-3 backdrop-blur-xl lg:px-8">
          <div className="flex items-center justify-between gap-4 pl-12 lg:pl-0">
            <div className="flex min-w-0 items-center gap-3">
              <span className="hidden rounded-xl bg-blue-50 p-2.5 text-blue-700 sm:inline-flex">
                <Building2 size={20} />
              </span>
              <div className="min-w-0">
                <p className="truncate font-extrabold text-slate-950">
                  {user.property.name}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <CalendarDays size={13} />
                  <span className="hidden sm:inline">{today}</span>
                  <span className="sm:hidden">Welcome, {user.firstName}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <AppearanceControls />
              <div className="hidden text-right md:block">
                <p className="text-sm font-bold text-slate-800">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-slate-500">
                  {user.role.replaceAll("_", " ")}
                </p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-emerald-500 text-sm font-black text-white shadow-lg shadow-blue-500/20">
                {user.firstName.charAt(0)}
                {user.lastName.charAt(0)}
              </span>
              <LogoutButton />
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
