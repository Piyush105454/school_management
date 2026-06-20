"use server";

import { db } from "@/db";
import { lessonPlans } from "@/db/schema";
import { eq, and, ne, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function saveLessonPlan(data: {
  id?: string;
  teacherId?: string;
  classId?: number;
  subjectId?: number;
  date: string;
  type: string; // "EXPLANATION" | "QA" | "PREPRIMARY" — which sub-mode is being saved
  status?: string;
  chapterDivisionId?: number;
  step1Data: any;
  step2Data: any; // Should contain { explanationData?, qaData?, sharedData? }
}) {
  try {
    // Helper: parse existing step2Data safely
    const parseStep2 = (raw: string | null | undefined): any => {
      if (!raw) return {};
      try { return JSON.parse(raw); } catch { return {}; }
    };

    // If id is provided, merge into that specific lesson plan record
    if (data.id) {
      const existing = await db.query.lessonPlans.findFirst({ where: eq(lessonPlans.id, data.id) });
      const existingStep2 = parseStep2(existing?.step2Data);

      // Merge: only update the current mode's sub-object, preserve the other mode's data
      const mergedStep2 = {
        ...existingStep2,
        sharedData: { ...(existingStep2.sharedData || {}), ...(data.step2Data.sharedData || {}) },
        explanationData: data.type === "EXPLANATION" || data.type === "PREPRIMARY"
          ? { ...(existingStep2.explanationData || {}), ...(data.step2Data.explanationData || {}) }
          : (existingStep2.explanationData || {}),
        qaData: data.type === "QA"
          ? { ...(existingStep2.qaData || {}), ...(data.step2Data.qaData || {}) }
          : (existingStep2.qaData || {}),
      };

      await db.update(lessonPlans)
        .set({
          date: data.date,
          classId: data.classId,
          subjectId: data.subjectId,
          type: "COMBINED",
          status: data.status,
          chapterDivisionId: data.chapterDivisionId,
          step1Data: JSON.stringify(data.step1Data),
          step2Data: JSON.stringify(mergedStep2),
          updatedAt: new Date()
        })
        .where(eq(lessonPlans.id, data.id));
      return { success: true, id: data.id, action: "updated" };
    }

    // Check if a unified plan already exists for this class, subject, and division (no type filter)
    const existing = await db.query.lessonPlans.findFirst({
        where: and(
            data.classId ? eq(lessonPlans.classId, data.classId) : undefined,
            data.subjectId ? eq(lessonPlans.subjectId, data.subjectId) : undefined,
            data.chapterDivisionId 
              ? eq(lessonPlans.chapterDivisionId, data.chapterDivisionId) 
              : undefined
        )
    });

    if (existing) {
        const existingStep2 = parseStep2(existing.step2Data);

        // Merge: preserve other mode's data, only update current mode
        const mergedStep2 = {
          ...existingStep2,
          sharedData: { ...(existingStep2.sharedData || {}), ...(data.step2Data.sharedData || {}) },
          explanationData: data.type === "EXPLANATION" || data.type === "PREPRIMARY"
            ? { ...(existingStep2.explanationData || {}), ...(data.step2Data.explanationData || {}) }
            : (existingStep2.explanationData || {}),
          qaData: data.type === "QA"
            ? { ...(existingStep2.qaData || {}), ...(data.step2Data.qaData || {}) }
            : (existingStep2.qaData || {}),
        };

        await db.update(lessonPlans)
            .set({
                date: data.date,
                step1Data: JSON.stringify(data.step1Data),
                step2Data: JSON.stringify(mergedStep2),
                type: "COMBINED",
                status: data.status || existing.status,
                updatedAt: new Date()
            })
            .where(eq(lessonPlans.id, existing.id));
        return { success: true, id: existing.id, action: "updated" };
    } else {
        // New plan: build step2 with current mode's sub-object
        const newStep2: any = {
          sharedData: data.step2Data.sharedData || {},
          explanationData: data.type === "EXPLANATION" || data.type === "PREPRIMARY" ? (data.step2Data.explanationData || {}) : {},
          qaData: data.type === "QA" ? (data.step2Data.qaData || {}) : {},
        };

        const result = await db.insert(lessonPlans).values({
            teacherId: data.teacherId,
            classId: data.classId,
            subjectId: data.subjectId,
            date: data.date,
            type: "COMBINED",
            chapterDivisionId: data.chapterDivisionId,
            step1Data: JSON.stringify(data.step1Data),
            step2Data: JSON.stringify(newStep2),
            status: data.status || "DRAFT"
        }).returning({ id: lessonPlans.id });
        
        return { success: true, id: result[0].id, action: "created" };
    }
  } catch (error: any) {
    console.error("saveLessonPlan error:", error);
    return { success: false, error: error.message };
  }
}

import { getTeacherCommitteePermissions } from "./committeeActions";

export async function getLessonPlansForReview(specialization?: string, isTeacher: boolean = false, teacherId?: string) {
  try {
    const plans = await db.query.lessonPlans.findMany({
      where: isTeacher ? ne(lessonPlans.status, 'DRAFT') : undefined, // Only filter drafts out for teachers
      columns: {
        step1Data: false,
        step2Data: false,
      },
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

    const allTeachers = await db.query.teachers.findMany();
    const plansWithProfiles = plans.map(p => {
      const specialist = allTeachers.find(t => 
        t.specialization?.toLowerCase().trim() === p.subject?.name?.toLowerCase().trim() &&
        t.institute === p.class?.institute
      );
      const principal = allTeachers.find(t =>
        t.assignedRole === 'PRINCIPAL' &&
        t.institute === p.class?.institute
      );
      return { ...p, specialistProfile: specialist || null, principalProfile: principal || null };
    });

    if (isTeacher) {
      let canApproveAcademy = false;
      if (teacherId) {
        const perms = await getTeacherCommitteePermissions(teacherId);
        canApproveAcademy = perms.canApproveAcademy;
      }

      if (canApproveAcademy) {
        // If they are an academy approver, they can see EVERYTHING (like a Principal)
        return { success: true, data: plansWithProfiles };
      } else {
        // Normal specialist teacher logic
        if (!specialization) {
          return { success: true, data: [] }; // If teacher has no specialization, they review nothing
        }
        const specializedSubjects = specialization.split(',').map(s => s.trim().toLowerCase());
        return { 
          success: true, 
          data: plansWithProfiles.filter(p => 
            p.subject?.name && 
            specializedSubjects.some(ss => p.subject!.name.toLowerCase().includes(ss))
          ) 
        };
      }
    }

    return { success: true, data: plansWithProfiles };
  } catch (error: any) {
    console.error("getLessonPlansForReview error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateLessonPlanStatus(id: string, status: 'APPROVED' | 'REJECTED' | 'REVIEWED' | 'COMPLETED', remark: string, reviewerId: string, isPrincipal: boolean = false) {
  try {
    await db.update(lessonPlans)
      .set({
        status,
        ...(isPrincipal ? { principalRemark: remark } : { reviewerRemark: remark }),
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

export async function getLessonPlanByDateAndSubject(
  classId: number, 
  subjectId: number, 
  date: string, 
  type: string, // kept for API compat but no longer used to filter — all modes share one record
  chapterDivisionId?: number,
  unitChapterPage?: string
) {
  try {
    const existing = await db.query.lessonPlans.findFirst({
        where: and(
            eq(lessonPlans.classId, classId),
            eq(lessonPlans.subjectId, subjectId),
            // Match by chapterDivisionId (preferred) — no type filter since one record holds all modes
            chapterDivisionId 
              ? eq(lessonPlans.chapterDivisionId, chapterDivisionId) 
              : undefined
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
      const principal = allTeachers.find(t =>
        t.assignedRole === 'PRINCIPAL' &&
        t.institute === existing.class?.institute
      );
      return { success: true, data: { ...existing, specialistProfile: specialist || null, principalProfile: principal || null } };
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
      const allTeachers = await db.query.teachers.findMany();
      const specialist = allTeachers.find(t => 
        t.specialization?.toLowerCase().trim() === existing.subject?.name?.toLowerCase().trim() &&
        t.institute === existing.class?.institute
      );
      const principal = allTeachers.find(t =>
        t.assignedRole === 'PRINCIPAL' &&
        t.institute === existing.class?.institute
      );
      return { success: true, data: { ...existing, specialistProfile: specialist || null, principalProfile: principal || null } };
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
      columns: {
        step1Data: false,
        step2Data: false,
      },
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
    const plansWithProfiles = plans.map(p => {
      const specialist = allTeachers.find(t => 
        t.specialization?.toLowerCase().trim() === p.subject?.name?.toLowerCase().trim() &&
        t.institute === p.class?.institute
      );
      const principal = allTeachers.find(t =>
        t.assignedRole === 'PRINCIPAL' &&
        t.institute === p.class?.institute
      );
      return { ...p, specialistProfile: specialist || null, principalProfile: principal || null };
    });

    return { success: true, data: plansWithProfiles };
  } catch (error: any) {
    console.error("getMyLessonPlans error:", error);
    return { success: false, error: error.message };
  }
}

export async function getLessonPlansByChapterDivisionIds(divisionIds: number[]) {
  if (divisionIds.length === 0) return [];
  try {
    const plans = await db.query.lessonPlans.findMany({
      where: inArray(lessonPlans.chapterDivisionId, divisionIds),
      columns: {
        id: true,
        chapterDivisionId: true,
        status: true,
      }
    });
    return plans;
  } catch (error) {
    console.error('getLessonPlansByChapterDivisionIds error:', error);
    return [];
  }
}
