import { BedDouble, CalendarCheck, CircleDollarSign, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export default async function DashboardPage() {
  const user = await getCurrentUser(); if (!user) return null;
  const start = new Date(); start.setHours(0,0,0,0); const end = new Date(start); end.setDate(end.getDate()+1);
  const [available, occupied, arrivals, guests, revenue] = await Promise.all([
    prisma.room.count({where:{propertyId:user.propertyId,status:"AVAILABLE"}}), prisma.room.count({where:{propertyId:user.propertyId,status:"OCCUPIED"}}),
    prisma.booking.count({where:{propertyId:user.propertyId,checkInDate:{gte:start,lt:end},status:{in:["CONFIRMED","CHECKED_IN"]}}}),
    prisma.booking.aggregate({where:{propertyId:user.propertyId,status:"CHECKED_IN"},_sum:{adults:true,children:true}}),
    prisma.payment.aggregate({where:{booking:{propertyId:user.propertyId},status:"COMPLETED",paidAt:{gte:start,lt:end}},_sum:{amount:true}})
  ]);
  const stats=[{label:"Available rooms",value:available,icon:BedDouble,color:"bg-emerald-500"},{label:"Occupied rooms",value:occupied,icon:CalendarCheck,color:"bg-blue-500"},{label:"Today's arrivals",value:arrivals,icon:Users,color:"bg-violet-500"},{label:"Revenue today",value:`K ${Number(revenue._sum.amount??0).toLocaleString()}`,icon:CircleDollarSign,color:"bg-amber-500"}];
  return <main className="p-5 md:p-8"><h1 className="text-3xl font-black">Operations dashboard</h1><p className="mt-1 text-slate-500">Live information from your property.</p><section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({label,value,icon:Icon,color})=><article key={label} className="rounded-2xl border bg-white p-5 shadow-sm"><span className={`inline-flex rounded-xl p-3 text-white ${color}`}><Icon/></span><p className="mt-4 text-sm text-slate-500">{label}</p><p className="text-2xl font-black">{value}</p></article>)}</section><section className="mt-6 rounded-2xl border bg-white p-6"><h2 className="font-bold">Current in-house guests</h2><p className="mt-2 text-3xl font-black">{(guests._sum.adults??0)+(guests._sum.children??0)}</p></section></main>;
}
