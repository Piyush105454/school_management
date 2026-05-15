import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { 
  lessonPlans, 
  classes, 
  subjects, 
  homeworkSubmissions,
  teachers
} from "@/db/schema";
import { redirect } from "next/navigation";
import HomeworkManagementClient from "./HomeworkManagementClient";

export default async function HomeworkManagementPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  // Fetch teacher profile if user is a teacher
  let teacherProfile = null;
  if (session.user.role === "TEACHER") {
    teacherProfile = await db.query.teachers.findFirst({
        where: eq(teachers.userId, session.user.id)
    });
  }

  // Fetch Lesson Plans with submission counts
  // If teacher, filter by teacherId
  const plansWithStats = await db.select({
    id: lessonPlans.id,
    date: lessonPlans.date,
    className: classes.name,
    subjectName: subjects.name,
    classId: classes.id,
    subjectId: subjects.id,
    homeworkPreview: lessonPlans.step1Data, // We'll parse this
    submissionCount: sql<number>`count(${homeworkSubmissions.id})`.mapWith(Number),
    pendingCount: sql<number>`count(CASE WHEN ${homeworkSubmissions.status} = 'PENDING' THEN 1 END)`.mapWith(Number),
  })
  .from(lessonPlans)
  .innerJoin(classes, eq(lessonPlans.classId, classes.id))
  .innerJoin(subjects, eq(lessonPlans.subjectId, subjects.id))
  .leftJoin(homeworkSubmissions, eq(homeworkSubmissions.lessonPlanId, lessonPlans.id))
  .where(
    teacherProfile ? eq(lessonPlans.teacherId, session.user.id) : undefined
  )
  .groupBy(lessonPlans.id, classes.name, subjects.name, classes.id, subjects.id)
  .orderBy(desc(lessonPlans.date));

  // Parse step1Data for preview
  const formattedPlans = plansWithStats.map(p => {
    let hw = "";
    try {
        const step1 = typeof p.homeworkPreview === 'string' ? JSON.parse(p.homeworkPreview) : p.homeworkPreview;
        hw = step1?.homework || "No details";
    } catch(e) {}
    
    return {
        ...p,
        date: p.date instanceof Date ? p.date.toISOString() : p.date,
        homeworkPreview: hw
    };
  });

  const allClasses = await db.select({ id: classes.id, name: classes.name }).from(classes);
  const allSubjects = await db.select({ id: subjects.id, name: subjects.name }).from(subjects);

  return (
    <div className="p-6 md:p-10">
      <HomeworkManagementClient 
        plans={formattedPlans as any} 
        classes={allClasses}
        subjects={allSubjects}
        reviewerId={session.user.id}
      />
    </div>
  );
}
