import MyLessonPlansClient from "@/features/academy/components/MyLessonPlansClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { teachers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getMyLessonPlans } from "@/features/academy/actions/lessonPlanActions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MyLessonPlansPage() {
  const session = await getServerSession(authOptions);
  
  if (session?.user?.role !== "TEACHER") {
    // If office/principal tries to access this without being a teacher
    // We could either block or show empty. Let's show empty for now,
    // though the link is only in the sidebar for TEACHER role.
    return (
      <div className="p-8 text-center text-slate-500">
        Only teachers can have their own lesson plans.
      </div>
    );
  }

  const res = await getMyLessonPlans(session.user.id);
  
  return (
    <MyLessonPlansClient 
      initialPlans={(res.success && res.data) ? res.data : []} 
    />
  );
}
