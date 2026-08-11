import { redirect } from "next/navigation";
import { LiveAnalyticsDashboard } from "@/components/live-analytics-dashboard";
import { getCurrentUser } from "@/lib/auth";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["SUPER_ADMIN", "MANAGER", "ACCOUNTANT"].includes(user.role)) redirect("/dashboard");
  return <LiveAnalyticsDashboard />;
}
