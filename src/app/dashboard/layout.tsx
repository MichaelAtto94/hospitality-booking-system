import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { DashboardNav } from "@/components/dashboard-nav";
export default async function DashboardLayout({children}:Readonly<{children:React.ReactNode}>){const user=await getCurrentUser();if(!user)redirect("/login");return <div className="min-h-screen bg-slate-100 text-slate-900"><DashboardNav role={user.role}/><div className="lg:pl-72"><header className="border-b bg-white px-5 py-3"><div className="flex items-center justify-between gap-4"><div><p className="font-bold">{user.property.name}</p><p className="text-xs text-slate-500">{user.firstName} {user.lastName}</p></div><LogoutButton/></div></header>{children}</div></div>}
