import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
const schema=z.object({firstName:z.string().trim().min(2).max(60),lastName:z.string().trim().min(2).max(60),phone:z.string().trim().max(20).optional()});
export async function GET(){const user=await getCurrentUser();if(!user)return NextResponse.json({message:"Unauthorized"},{status:401});return NextResponse.json(user)}
export async function PATCH(request:Request){const user=await getCurrentUser();if(!user)return NextResponse.json({message:"Unauthorized"},{status:401});const parsed=schema.safeParse(await request.json());if(!parsed.success)return NextResponse.json({message:parsed.error.issues[0]?.message??"Invalid profile"},{status:400});const updated=await prisma.$transaction(async tx=>{const changed=await tx.user.update({where:{id:user.id},data:{...parsed.data,phone:parsed.data.phone||null}});await tx.auditLog.create({data:{action:"UPDATE_OWN_PROFILE",entity:"User",entityId:user.id,userId:user.id}});return changed});return NextResponse.json({firstName:updated.firstName,lastName:updated.lastName,email:updated.email,phone:updated.phone,role:updated.role})}
