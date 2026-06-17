"use server";

import { db } from "@/db";
import { lessonPlans } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
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
            teacherId: data.teacherId,
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

export async function getLessonPlansForReview(specialization?: string, isTeacher: boolean = false) {
  try {
    const plans = await db.query.lessonPlans.findMany({
      where: isTeacher ? ne(lessonPlans.status, 'DRAFT') : undefined, // Only filter drafts out for teachers
      with: {
        class: true,
        subject: true,
        teacherProfile: true,
        teacherUser: true,
        reviewerProfile: true,
        reviewerUser: true,
      },
      orderBy: (lp, { desc }) => [desc(lp.updatedAt)],
    });

    if (isTeacher) {
      if (!specialization) {
        return { success: true, data: [] }; // If teacher has no specialization, they review nothing
      }
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

export async function getLessonPlanCount(classId: number, subjectId: number) {
  try {
    // Count all lesson plans for this specific class and subject
    const plans = await db.query.lessonPlans.findMany({
      where: and(
        eq(lessonPlans.classId, classId),
        eq(lessonPlans.subjectId, subjectId)
      )
    });
    return { success: true, count: plans.length };
  } catch (error: any) {
    console.error("getLessonPlanCount error:", error);
    return { success: false, error: error.message, count: 0 };
  }
}

export async function getLessonPlanByDateAndSubject(classId: number, subjectId: number, date: string) {
  try {
    const existing = await db.query.lessonPlans.findFirst({
        where: and(
            eq(lessonPlans.date, date),
            eq(lessonPlans.classId, classId),
            eq(lessonPlans.subjectId, subjectId)
        ),
        with: {
          class: true,
          subject: true,
          teacherProfile: true,
          teacherUser: true,
          reviewerProfile: true,
          reviewerUser: true,
        }
    });
    if (existing) {
      const allTeachers = await db.query.teachers.findMany();
      const specialist = allTeachers.find(t => 
        t.specialization?.toLowerCase().trim() === existing.subject?.name?.toLowerCase().trim() &&
        t.institute === existing.class?.institute
      );
      return { success: true, data: { ...existing, specialistProfile: specialist || null } };
    }
    return { success: false };
  } catch (error: any) {
    console.error("getLessonPlanByDateAndSubject error:", error);
    return { success: false, error: error.message };
  }
}

export async function getLessonPlanById(id: string) {
  try {
    const existing = await db.query.lessonPlans.findFirst({
        where: eq(lessonPlans.id, id),
        with: {
          class: true,
          subject: true,
          teacherProfile: true,
          teacherUser: true,
          reviewerProfile: true,
          reviewerUser: true,
        }
    });
    if (existing) {
      return { success: true, data: existing };
    }
    return { success: false };
  } catch (error: any) {
    console.error("getLessonPlanById error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteLessonPlan(id: string) {
  try {
    await db.delete(lessonPlans).where(eq(lessonPlans.id, id));
    return { success: true };
  } catch (error: any) {
    console.error("deleteLessonPlan error:", error);
    return { success: false, error: error.message };
  }
}

export async function getMyLessonPlans(teacherId: string) {
  try {
    const plans = await db.query.lessonPlans.findMany({
      where: eq(lessonPlans.teacherId, teacherId),
      with: {
        class: true,
        subject: true,
        teacherProfile: true,
        teacherUser: true,
        reviewerProfile: true,
        reviewerUser: true,
      },
      orderBy: (lp, { desc }) => [desc(lp.date)],
    });

    const allTeachers = await db.query.teachers.findMany();
    const plansWithSpecialists = plans.map(p => {
      const specialist = allTeachers.find(t => 
        t.specialization?.toLowerCase().trim() === p.subject?.name?.toLowerCase().trim() &&
        t.institute === p.class?.institute
      );
      return { ...p, specialistProfile: specialist || null };
    });

    return { success: true, data: plansWithSpecialists };
  } catch (error: any) {
    console.error("getMyLessonPlans error:", error);
    return { success: false, error: error.message };
  }
}
