"use server";

import { db } from "@/db";
import { lessonPlans } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function saveLessonPlan(data: {
  teacherId?: string;
  classId?: number;
  subjectId?: number;
  date: string;
  type: string;
  step1Data: any;
  step2Data: any;
}) {
  try {
    // Check if a plan already exists for this teacher, class, subject, and date
    // (Simplification: for now, we just insert or update based on date/subject if provided)
    
    const existing = await db.query.lessonPlans.findFirst({
        where: and(
            eq(lessonPlans.date, data.date),
            data.classId ? eq(lessonPlans.classId, data.classId) : undefined,
            data.subjectId ? eq(lessonPlans.subjectId, data.subjectId) : undefined
        )
    });

    if (existing) {
        await db.update(lessonPlans)
            .set({
                step1Data: JSON.stringify(data.step1Data),
                step2Data: JSON.stringify(data.step2Data),
                type: data.type,
                status: (data as any).status || existing.status,
                updatedAt: new Date()
            })
            .where(eq(lessonPlans.id, existing.id));
        return { success: true, id: existing.id, action: "updated" };
    } else {
        const result = await db.insert(lessonPlans).values({
            classId: data.classId,
            subjectId: data.subjectId,
            date: data.date,
            type: data.type,
            step1Data: JSON.stringify(data.step1Data),
            step2Data: JSON.stringify(data.step2Data),
            status: (data as any).status || "DRAFT"
        }).returning({ id: lessonPlans.id });
        
        return { success: true, id: result[0].id, action: "created" };
    }
  } catch (error: any) {
    console.error("saveLessonPlan error:", error);
    return { success: false, error: error.message };
  }
}

export async function getLessonPlansForReview(specialization?: string) {
  try {
    let whereClause = eq(lessonPlans.status, "SUBMITTED");

    const plans = await db.query.lessonPlans.findMany({
      where: whereClause,
      with: {
        class: true,
        subject: true,
        teacher: true,
      },
      orderBy: (lp, { desc }) => [desc(lp.updatedAt)],
    });

    // If specialization is provided, filter plans where subject name is in specialization
    if (specialization) {
      const specializedSubjects = specialization.split(',').map(s => s.trim().toLowerCase());
      return { 
        success: true, 
        data: plans.filter(p => 
          p.subject?.name && 
          specializedSubjects.some(ss => p.subject!.name.toLowerCase().includes(ss))
        ) 
      };
    }

    return { success: true, data: plans };
  } catch (error: any) {
    console.error("getLessonPlansForReview error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateLessonPlanStatus(id: string, status: 'APPROVED' | 'REJECTED', remark: string, reviewerId: string) {
  try {
    await db.update(lessonPlans)
      .set({
        status,
        reviewerRemark: remark,
        reviewerId,
        updatedAt: new Date()
      })
      .where(eq(lessonPlans.id, id));

    revalidatePath('/office/academy-management/lesson-plan/review');
    return { success: true };
  } catch (error: any) {
    console.error('updateLessonPlanStatus error:', error);
    return { success: false, error: error.message };
  }
}
