import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
const allowed = ["SUPER_ADMIN", "MANAGER", "RECEPTIONIST", "HOUSEKEEPER"];
export default async function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!allowed.includes(user.role)) redirect("/dashboard");
  return children;
}