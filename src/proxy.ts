import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
type Role="SUPER_ADMIN"|"MANAGER"|"RECEPTIONIST"|"ACCOUNTANT"|"HOUSEKEEPER";
const publicPrefixes=["/api/auth/","/api/public/","/api/health"];
const rules:{prefix:string;roles:Role[]}[]=[
 {prefix:"/api/staff",roles:["SUPER_ADMIN","MANAGER"]},
 {prefix:"/api/settings",roles:["SUPER_ADMIN","MANAGER"]},
 {prefix:"/api/expenses",roles:["SUPER_ADMIN","MANAGER","ACCOUNTANT"]},
 {prefix:"/api/payments",roles:["SUPER_ADMIN","MANAGER","RECEPTIONIST","ACCOUNTANT"]},
 {prefix:"/api/guests",roles:["SUPER_ADMIN","MANAGER","RECEPTIONIST"]},
 {prefix:"/api/bookings",roles:["SUPER_ADMIN","MANAGER","RECEPTIONIST"]},
 {prefix:"/api/operations",roles:["SUPER_ADMIN","MANAGER","RECEPTIONIST","HOUSEKEEPER"]},
 {prefix:"/api/rooms",roles:["SUPER_ADMIN","MANAGER","RECEPTIONIST","HOUSEKEEPER"]},
 {prefix:"/api/room-types",roles:["SUPER_ADMIN","MANAGER","RECEPTIONIST","HOUSEKEEPER"]},
 {prefix:"/api/account",roles:["SUPER_ADMIN","MANAGER","RECEPTIONIST","ACCOUNTANT","HOUSEKEEPER"]},
];
function json(message:string,status:number){return NextResponse.json({message},{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}})}
export async function proxy(request:NextRequest){const path=request.nextUrl.pathname;if(publicPrefixes.some(prefix=>path.startsWith(prefix)))return NextResponse.next();const token=request.cookies.get("zedstay_session")?.value;if(!token)return json("Authentication required",401);const secret=process.env.JWT_SECRET;if(!secret||secret.length<32)return json("Server authentication is not configured",500);try{const{payload}=await jwtVerify(token,new TextEncoder().encode(secret),{issuer:"zedstay-hospitality",audience:"zedstay-staff"});const role=payload.role as Role|undefined;if(!role)return json("Invalid session",401);const rule=rules.find(item=>path.startsWith(item.prefix));if(rule&&!rule.roles.includes(role))return json("You do not have permission",403);const response=NextResponse.next();response.headers.set("Cache-Control","no-store");response.headers.set("X-Content-Type-Options","nosniff");return response}catch{return json("Invalid or expired session",401)}}
export const config={matcher:["/api/:path*"]};
