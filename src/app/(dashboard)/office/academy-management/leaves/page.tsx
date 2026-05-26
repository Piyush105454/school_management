import { protectRoute } from "@/lib/roleGuard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { classes } from "@/db/schema";
import { getAllStudentLeavesForManagementAction } from "@/features/academy/actions/leaveActions";
import LeaveManagementClient from "./LeaveManagementClient";

export default async function LeaveManagementPage() {
  await protectRoute(["OFFICE", "TEACHER", "PRINCIPAL"]);

  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  // Fetch all classes for the filter dropdown
  const allClasses = await db.select().from(classes).orderBy(classes.name);

  // Fetch all leaves initially
  const res = await getAllStudentLeavesForManagementAction();
  if (!res.success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm max-w-sm">
          <h2 className="text-2xl font-black text-slate-900">Unable to load leaves</h2>
          <p className="text-slate-500 mt-2 text-sm font-medium">{res.error || "Please verify your credentials."}</p>
        </div>
      </div>
    );
  }

  return (
    <LeaveManagementClient
      classes={allClasses}
      initialLeaves={res.leaves || []}
    />
  );
}
