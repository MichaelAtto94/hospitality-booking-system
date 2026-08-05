import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic="force-dynamic";
export async function GET(){const started=Date.now();try{await prisma.$queryRaw`SELECT 1`;return NextResponse.json({status:"UP",database:"UP",application:"ZedStay Hospitality",responseTimeMs:Date.now()-started,timestamp:new Date().toISOString()},{headers:{"Cache-Control":"no-store"}})}catch(error){console.error("Health check failed",error);return NextResponse.json({status:"DOWN",database:"DOWN",application:"ZedStay Hospitality",timestamp:new Date().toISOString()},{status:503,headers:{"Cache-Control":"no-store"}})}}
