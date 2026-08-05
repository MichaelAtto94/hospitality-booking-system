"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3,BedDouble,BookCheck,CalendarDays,CalendarRange,CreditCard,FileText,Gauge,History,Menu,Settings,Sparkles,UserCog,Users,WalletCards,X } from "lucide-react";
import { useState } from "react";
type Role="SUPER_ADMIN"|"MANAGER"|"RECEPTIONIST"|"ACCOUNTANT"|"HOUSEKEEPER";
const all:Role[]=["SUPER_ADMIN","MANAGER","RECEPTIONIST","ACCOUNTANT","HOUSEKEEPER"];
const management:Role[]=["SUPER_ADMIN","MANAGER"];
const links=[
 {href:"/dashboard",label:"Dashboard",icon:Gauge,roles:all},
 {href:"/dashboard/front-desk",label:"Front desk",icon:CalendarDays,roles:["SUPER_ADMIN","MANAGER","RECEPTIONIST"]},
 {href:"/dashboard/account",label:"My account",icon:UserCog,roles:all},
 {href:"/dashboard/booking-requests",label:"Booking requests",icon:BookCheck,roles:["SUPER_ADMIN","MANAGER","RECEPTIONIST"]},
 {href:"/dashboard/calendar",label:"Availability calendar",icon:CalendarRange,roles:["SUPER_ADMIN","MANAGER","RECEPTIONIST"]},
 {href:"/dashboard/bookings",label:"Bookings",icon:CalendarDays,roles:["SUPER_ADMIN","MANAGER","RECEPTIONIST"]},
 {href:"/dashboard/guests",label:"Guests",icon:Users,roles:["SUPER_ADMIN","MANAGER","RECEPTIONIST"]},
 {href:"/dashboard/rooms",label:"Rooms",icon:BedDouble,roles:["SUPER_ADMIN","MANAGER","RECEPTIONIST","HOUSEKEEPER"]},
 {href:"/dashboard/housekeeping",label:"Housekeeping",icon:Sparkles,roles:["SUPER_ADMIN","MANAGER","RECEPTIONIST","HOUSEKEEPER"]},
 {href:"/dashboard/payments",label:"Payments",icon:CreditCard,roles:["SUPER_ADMIN","MANAGER","RECEPTIONIST","ACCOUNTANT"]},
 {href:"/dashboard/expenses",label:"Expenses",icon:WalletCards,roles:["SUPER_ADMIN","MANAGER","ACCOUNTANT"]},
 {href:"/dashboard/documents",label:"Documents",icon:FileText,roles:["SUPER_ADMIN","MANAGER","RECEPTIONIST","ACCOUNTANT"]},
 {href:"/dashboard/reports",label:"Reports",icon:BarChart3,roles:["SUPER_ADMIN","MANAGER","ACCOUNTANT"]},
 {href:"/dashboard/staff",label:"Staff",icon:UserCog,roles:management},
 {href:"/dashboard/audit",label:"Audit trail",icon:History,roles:management},
 {href:"/dashboard/settings",label:"Settings",icon:Settings,roles:management},
];
export function DashboardNav({role}:{role:Role}){const path=usePathname();const[open,setOpen]=useState(false);const visible=links.filter(link=>link.roles.includes(role));return <><button onClick={()=>setOpen(!open)} className="fixed bottom-5 right-5 z-50 rounded-full bg-emerald-600 p-4 text-white shadow-xl lg:hidden">{open?<X/>:<Menu/>}</button>{open&&<button aria-label="Close menu" onClick={()=>setOpen(false)} className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"/>}<aside className={`${open?"flex":"hidden"} fixed inset-y-0 left-0 z-40 w-72 flex-col bg-slate-950 p-5 text-white lg:flex`}><div><p className="text-xl font-black text-emerald-400">ZedStay</p><p className="text-xs text-slate-400">Hospitality Management</p></div><nav className="mt-7 flex-1 space-y-1 overflow-y-auto pr-1">{visible.map(({href,label,icon:Icon})=>{const active=href==="/dashboard"?path===href:path.startsWith(href);return <Link onClick={()=>setOpen(false)} key={href} href={href} className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold ${active?"bg-emerald-600 text-white":"text-slate-300 hover:bg-slate-800"}`}><Icon size={18}/>{label}</Link>})}</nav><div className="mt-4 rounded-xl bg-slate-900 p-3"><p className="text-xs text-slate-400">Signed in as</p><p className="mt-1 text-sm font-bold">{role.replaceAll("_"," ")}</p></div></aside></>}
