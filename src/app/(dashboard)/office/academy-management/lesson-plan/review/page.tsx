import { getLessonPlansForReview } from "@/features/academy/actions/lessonPlanActions";
import LessonPlanReviewClient from "./LessonPlanReviewClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { teachers } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function LessonPlanReviewPage() {
  const session = await getServerSession(authOptions);
  
  let specialization: string | undefined = undefined;
  if (session?.user?.role === "TEACHER") {
    const teacher = await db.query.teachers.findFirst({
      where: eq(teachers.userId, session.user.id)
    });
    specialization = teacher?.specialization || undefined;
  }

  const res = await getLessonPlansForReview(specialization);
  
  return (
    <LessonPlanReviewClient 
      initialPlans={res.success ? res.data : []} 
      reviewerId={session?.user?.id || "SYSTEM"}
    />
  );
}
