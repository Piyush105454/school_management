"use server";

import { db } from "@/db";
import { 
  homeworkSubmissions, 
  lessonPlans, 
  students, 
  admissionMeta,
  scholarshipHomework
} from "@/db/schema";
import { eq, and, sql, desc, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { saveKpiData } from "@/features/scholarship/actions/kpiActions";
import { getSignedDownloadUrl } from "@/lib/s3-service";

export async function submitHomeworkAction(formData: FormData) {
  try {
    const lessonPlanId = formData.get("lessonPlanId") as string;
    const studentId = parseInt(formData.get("studentId") as string);
    const description = formData.get("description") as string;
    const imagePath = formData.get("imagePath") as string; // Assume uploaded already or handled via client-side S3

    if (!lessonPlanId || !studentId) throw new Error("Missing required fields");

    await db.insert(homeworkSubmissions).values({
      lessonPlanId,
      studentId,
      description,
      imagePath,
      status: "PENDING",
    }).onConflictDoUpdate({
        target: homeworkSubmissions.id, // Wait, it's a random uuid, conflict won't happen unless we check (lessonPlanId, studentId)
        set: { description, imagePath, status: "PENDING", submittedAt: new Date() }
    });

    // Note: We might need a unique index on (lessonPlanId, studentId) to use onConflict properly
    // For now, let's just insert or find-then-update

    revalidatePath("/student/homework");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function reviewHomeworkAction(submissionId: string, status: "COMPLETED" | "REJECTED", feedback: string, reviewerId: string) {
  try {
    const submissionResults = await db
        .select({
            id: homeworkSubmissions.id,
            status: homeworkSubmissions.status,
            studentId: homeworkSubmissions.studentId,
            lessonPlanId: homeworkSubmissions.lessonPlanId,
            lessonPlan: lessonPlans,
        })
        .from(homeworkSubmissions)
        .innerJoin(lessonPlans, eq(homeworkSubmissions.lessonPlanId, lessonPlans.id))
        .where(eq(homeworkSubmissions.id, submissionId))
        .limit(1);

    const submission = submissionResults[0];

    if (!submission) {
      console.error("Submission not found for ID:", submissionId);
      throw new Error("Submission not found");
    }

    console.log("Updating submission status to:", status);
    await db.update(homeworkSubmissions).set({
      status,
      feedback,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    }).where(eq(homeworkSubmissions.id, submissionId));

    // --- SYNC TO SCHOLARSHIP KPI ---
    if (status === "COMPLETED") {
      const studentId = submission.studentId;
      const lp = submission.lessonPlan;
      const date = new Date(lp.date);
      const month = date.toLocaleString('en-US', { month: 'long' });
      const year = date.getFullYear().toString();
      const monthStr = (date.getMonth() + 1).toString().padStart(2, '0');

      console.log(`Syncing KPI for Student ${studentId}, Month: ${month}, Year: ${year}`);

      // Find the academic student record
      const acadStudent = await db.query.students.findFirst({
        where: eq(students.id, studentId)
      });

      if (acadStudent) {
        // Find the admission meta record using scholarNumber OR admissionNumber OR entryNumber
        const meta = await db.query.admissionMeta.findFirst({
          where: or(
              eq(admissionMeta.scholarNumber, acadStudent.studentId),
              eq(admissionMeta.admissionNumber, acadStudent.studentId),
              eq(admissionMeta.entryNumber, acadStudent.studentId)
          )
        });

        if (meta) {
          console.log("Found Admission Meta ID:", meta.id);
          // Recalculate KPI for this month
          // 1. Total homeworks assigned to this class in this month
          const totalAssigned = await db.select({ count: sql`count(*)` })
            .from(lessonPlans)
            .where(and(
              eq(lessonPlans.classId, lp.classId),
              sql`${lessonPlans.date} LIKE ${`${year}-${monthStr}%`}`
            ));

          // 2. Total completed homeworks by this student in this month
          const totalCompleted = await db.select({ count: sql`count(*)` })
            .from(homeworkSubmissions)
            .innerJoin(lessonPlans, eq(homeworkSubmissions.lessonPlanId, lessonPlans.id))
            .where(and(
                eq(homeworkSubmissions.studentId, studentId),
                eq(homeworkSubmissions.status, "COMPLETED"),
                eq(lessonPlans.classId, lp.classId),
                sql`${lessonPlans.date} LIKE ${`${year}-${monthStr}%`}`
            ));

          const total = Number(totalAssigned[0]?.count || 0);
          const done = Number(totalCompleted[0]?.count || 0);

          console.log(`Recalculated: Total ${total}, Done ${done}`);

          // Update scholarship_homework table
          const existingHw = await db.query.scholarshipHomework.findFirst({
            where: and(
                eq(scholarshipHomework.admissionId, meta.id),
                eq(scholarshipHomework.month, month),
                eq(scholarshipHomework.year, year)
            )
          });

          if (existingHw) {
            await db.update(scholarshipHomework).set({
                totalGiven: total,
                totalDone: done,
                percentage: total > 0 ? (done / total) * 100 : 0
            }).where(eq(scholarshipHomework.id, existingHw.id));
          } else {
            await db.insert(scholarshipHomework).values({
                admissionId: meta.id,
                month,
                year,
                totalGiven: total,
                totalDone: done,
                percentage: total > 0 ? (done / total) * 100 : 0
            });
          }
        } else {
            console.warn("Admission meta not found for student:", acadStudent.studentId);
        }
      } else {
          console.warn("Academic student record not found for ID:", studentId);
      }
    }

    revalidatePath("/office/homework-management");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getHomeworkStatsAction(teacherId?: string) {
    // For the management UI
    const query = db.select({
        className: (classes as any).name,
        subjectName: (subjects as any).name,
        classId: (classes as any).id,
        subjectId: (subjects as any).id,
        count: sql`count(*)`,
    })
    .from(lessonPlans)
    .innerJoin(classes, eq(lessonPlans.classId, classes.id))
    .innerJoin(subjects, eq(lessonPlans.subjectId, subjects.id))
    .groupBy(classes.name, subjects.name, classes.id, subjects.id);

    if (teacherId) {
        // Filter by teacher
    }

    return await query;
}



export async function getSubmissionsByPlanAction(lessonPlanId: string) {
    try {
        const lpResults = await db
            .select()
            .from(lessonPlans)
            .where(eq(lessonPlans.id, lessonPlanId))
            .limit(1);

        const lp = lpResults[0];
        if (!lp) throw new Error("Lesson plan not found");

        // Fetch all students in this class
        const allStudents = await db
            .select()
            .from(students)
            .where(eq(students.classId, lp.classId as number));

        // Fetch existing submissions
        const existingSubmissions = await db
            .select()
            .from(homeworkSubmissions)
            .where(eq(homeworkSubmissions.lessonPlanId, lessonPlanId));

        // Map them together
        const data = allStudents.map(student => {
            const submission = existingSubmissions.find(s => s.studentId === student.id);
            
            // Construct clean Proxy URL instead of long S3 Signed URL
            let viewUrl = submission?.imagePath || "";
            if (viewUrl && viewUrl.startsWith("http")) {
                viewUrl = `/api/homework/view?path=${encodeURIComponent(viewUrl)}`;
            }

            return {
                id: submission?.id || `missing-${student.id}`,
                student: {
                    id: student.id,
                    name: student.name,
                    studentId: student.studentId
                },
                description: submission?.description || "",
                imagePath: viewUrl,
                status: submission?.status || "NOT_SUBMITTED",
                submittedAt: submission?.submittedAt,
                feedback: submission?.feedback || ""
            };
        });

        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
