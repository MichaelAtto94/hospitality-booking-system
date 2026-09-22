import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

const allowed = ["SUPER_ADMIN", "MANAGER", "ACCOUNTANT"];

export default async function DailyCloseLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!allowed.includes(user.role)) redirect("/dashboard");
  return children;
}
