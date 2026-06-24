import { getLessonPlansForReview } from "@/features/academy/actions/lessonPlanActions";
import LessonPlanReviewClient from "./LessonPlanReviewClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { teachers, users, classes } from "@/db/schema";
import { eq } from "drizzle-orm";

import { getTeacherCommitteePermissions } from "@/features/academy/actions/committeeActions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LessonPlanReviewPage() {
  const session = await getServerSession(authOptions);
  
  let specialization: string | undefined = undefined;
  let teacherId: string | undefined = undefined;
  let isTeacher = false;
  let isApprover = false;

  if (session?.user?.role === "PRINCIPAL" || session?.user?.role === "OFFICE" || session?.user?.role === "ADMIN") {
    isApprover = true;
  }

  if (session?.user?.role === "TEACHER") {
    isTeacher = true;
    const teacher = await db.query.teachers.findFirst({
      where: eq(teachers.userId, session.user.id)
    });
    specialization = teacher?.specialization || undefined;
    teacherId = teacher?.id;

    if (teacherId) {
      const perms = await getTeacherCommitteePermissions(teacherId);
      if (perms.canApproveAcademy) {
        isApprover = true;
      }
    }
  }

  const res = await getLessonPlansForReview(specialization, isTeacher, teacherId);

  const teachersList = await db
    .select({
      id: teachers.id,
      userId: teachers.userId,
      name: teachers.name,
      contactNumber: teachers.contactNumber,
      classAssigned: teachers.classAssigned,
      institute: teachers.institute,
      responsibility: teachers.responsibility,
      incharge: teachers.incharge,
      specialization: teachers.specialization,
      assignedRole: teachers.assignedRole,
      committees: teachers.committees,
      email: users.email,
    })
    .from(teachers)
    .leftJoin(users, eq(teachers.userId, users.id))
    .orderBy(teachers.name);

  const allClasses = await db.select().from(classes).orderBy(classes.grade);

  const allSubjectsData = await db.query.subjects.findMany({
    columns: { id: true, name: true, classId: true }
  });
  
  return (
    <LessonPlanReviewClient 
      initialPlans={(res.success && res.data) ? res.data : []} 
      reviewerId={session?.user?.id || "SYSTEM"}
      isTeacher={isTeacher}
      isApprover={isApprover}
      allTeachers={teachersList as any[]}
      allClasses={allClasses}
      allSubjects={allSubjectsData}
    />
  );
}

