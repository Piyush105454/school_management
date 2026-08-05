import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ActivityLogsClient from "./ActivityLogsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Activity Logs | Admin Section",
  description: "Full audit trail of all user actions across the platform. Visible to Admin and Office accounts only.",
};

export default async function ActivityLogsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  // Server-side access guard
  if (!session || (role !== "OFFICE" && role !== "ADMIN")) {
    redirect("/office/dashboard");
  }

  return <ActivityLogsClient />;
}
