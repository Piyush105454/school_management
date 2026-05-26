import { protectRoute } from "@/lib/roleGuard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStudentLeavesAction } from "@/features/academy/actions/leaveActions";
import StudentLeaveClient from "./StudentLeaveClient";

export default async function StudentLeavePage() {
  await protectRoute(["STUDENT_PARENT"]);

  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  const res = await getStudentLeavesAction();
  if (!res.success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm max-w-sm">
          <h2 className="text-2xl font-black text-slate-900">Unable to load leaves</h2>
          <p className="text-slate-500 mt-2 text-sm font-medium">{res.error || "Please verify your admission status."}</p>
        </div>
      </div>
    );
  }

  return <StudentLeaveClient initialLeaves={res.leaves || []} />;
}
