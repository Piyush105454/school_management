"use server";

import { db } from "@/db";
import { lessonPlans, classes, subjects } from "@/db/schema";
import { eq, and, ne, inArray, sql } from "drizzle-orm";

function getAcademicSession(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth() + 1; // 1-indexed
    const startYear = month >= 4 ? year : year - 1;
    const endYear = startYear + 1;
    
    const startStr = String(startYear).slice(-2);
    const endStr = String(endYear).slice(-2);
    return `${startStr}${endStr}`;
  } catch {
    return "2627"; // fallback
  }
}

function getClassCode(className: string): string {
  const name = className.trim().toUpperCase();
  if (name.startsWith("CLASS ")) {
    return `C${name.replace("CLASS ", "").trim()}`;
  }
  if (name === "KG1" || name === "KG 1" || name === "KG I" || name === "LKG") {
    return "KG1";
  }
  if (name === "KG2" || name === "KG 2" || name === "KG II" || name === "UKG") {
    return "KG2";
  }
  if (name === "NURSERY") {
    return "NUR";
  }
  if (/^\d+$/.test(name)) {
    return `C${name}`;
  }
  return name.replace(/\s+/g, "");
}

function getSubjectCode(subjectName: string): string {
  const name = subjectName.trim().toUpperCase();
  const mappings: Record<string, string> = {
    "MATHEMATICS": "MATH",
    "MATHS": "MATH",
    "MATH": "MATH",
    "ENGLISH": "ENG",
    "HINDI": "HIN",
    "SCIENCE": "SCI",
    "ECA": "ECA",
    "SOCIAL SCIENCE": "SST",
    "SOCIAL STUDIES": "SST",
    "COMPUTER": "COMP",
    "COMPUTERS": "COMP",
    "ENVIRONMENTAL STUDIES": "EVS",
    "EVS": "EVS",
    "GK": "GK",
    "GENERAL KNOWLEDGE": "GK",
    "SANSKRIT": "SAN"
  };
  
  if (mappings[name]) return mappings[name];
  
  for (const [key, code] of Object.entries(mappings)) {
    if (name.includes(key)) return code;
  }
  
  const clean = name.replace(/[^A-Z]/g, "");
  return clean.slice(0, 4) || "SUB";
}
import { revalidatePath } from "next/cache";

function matchesSpecialization(specialization: string | null | undefined, className: string | null | undefined, subjectName: string | null | undefined): boolean {
  if (!specialization || !subjectName) return false;
  const specs = specialization.split(',').map(s => s.trim().toLowerCase());
  const subjectLower = subjectName.toLowerCase();
  const classLower = className?.toLowerCase() || "";
  return specs.some(ss => {
    if (ss.includes(" - ")) {
      const [cName, sName] = ss.split(" - ").map(x => x.trim());
      return classLower === cName && subjectLower === sName;
    }
    return subjectLower.includes(ss);
  });
}

const isFilled = (obj: any): boolean => {
  if (!obj) return false;
  return Object.keys(obj).some(key => {
    const val = obj[key];
    if (typeof val === 'string') {
      const cleanVal = val.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, "").trim();
      return cleanVal !== "";
    }
    return val !== undefined && val !== null && val !== "";
  });
};

export async function saveLessonPlan(data: {
  id?: string;
  teacherId?: string;
  classId?: number;
  subjectId?: number;
  date: string;
  type: string; // "EXPLANATION" | "QA" | "PREPRIMARY" — which sub-mode is being saved
  status?: "DRAFT" | "SUBMITTED" | "REVIEWED" | "APPROVED" | "REJECTED" | "COMPLETED";
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

      let determinedType = "COMBINED";
      const hasExplanation = isFilled(mergedStep2.explanationData);
      const hasQA = isFilled(mergedStep2.qaData);
      if (hasExplanation && hasQA) {
        determinedType = "COMBINED";
      } else if (hasExplanation) {
        determinedType = "EXPLANATION";
      } else if (hasQA) {
        determinedType = "QA";
      } else {
        determinedType = data.type || "EXPLANATION";
      }

      await db.update(lessonPlans)
        .set({
          date: data.date,
          classId: data.classId,
          subjectId: data.subjectId,
          type: determinedType,
          status: data.status,
          chapterDivisionId: data.chapterDivisionId,
          step1Data: JSON.stringify(data.step1Data),
          step2Data: JSON.stringify(mergedStep2),
          updatedAt: new Date()
        })
        .where(eq(lessonPlans.id, data.id));
      return { success: true, id: data.id, action: "updated" };
    }

    // Check if a unified plan already exists for this class, subject, date, and division (no type filter)
    const plans = await db.query.lessonPlans.findMany({
        where: and(
            data.classId ? eq(lessonPlans.classId, data.classId) : undefined,
            data.subjectId ? eq(lessonPlans.subjectId, data.subjectId) : undefined,
            eq(lessonPlans.date, data.date)
        )
    });

    const existing = plans.find(p => {
      if (data.chapterDivisionId) {
        return p.chapterDivisionId === data.chapterDivisionId;
      }
      if (!p.chapterDivisionId) {
        try {
          const step2 = JSON.parse(p.step2Data || "{}");
          const step2Ucp = step2.sharedData?.unitChapterPage || "";
          return step2Ucp === data.step2Data.sharedData?.unitChapterPage;
        } catch {
          return false;
        }
      }
      return false;
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

        let determinedType = "COMBINED";
        const hasExplanation = isFilled(mergedStep2.explanationData);
        const hasQA = isFilled(mergedStep2.qaData);
        if (hasExplanation && hasQA) {
          determinedType = "COMBINED";
        } else if (hasExplanation) {
          determinedType = "EXPLANATION";
        } else if (hasQA) {
          determinedType = "QA";
        } else {
          determinedType = data.type || "EXPLANATION";
        }

        await db.update(lessonPlans)
            .set({
                date: data.date,
                step1Data: JSON.stringify(data.step1Data),
                step2Data: JSON.stringify(mergedStep2),
                type: determinedType,
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

        let determinedType = "COMBINED";
        const hasExplanation = isFilled(newStep2.explanationData);
        const hasQA = isFilled(newStep2.qaData);
        if (hasExplanation && hasQA) {
          determinedType = "COMBINED";
        } else if (hasExplanation) {
          determinedType = "EXPLANATION";
        } else if (hasQA) {
          determinedType = "QA";
        } else {
          determinedType = data.type || "EXPLANATION";
        }

        // Generate custom unique ID: LP-[session]-[class]-[subject]-[sequence]
        const sessionCode = getAcademicSession(data.date);
        let classCode = "C0";
        let subjectCode = "SUB";
        
        if (data.classId) {
          const clsRecord = await db.query.classes.findFirst({
            where: eq(classes.id, data.classId)
          });
          if (clsRecord) classCode = getClassCode(clsRecord.name);
        }
        
        if (data.subjectId) {
          const subRecord = await db.query.subjects.findFirst({
            where: eq(subjects.id, data.subjectId)
          });
          if (subRecord) subjectCode = getSubjectCode(subRecord.name);
        }
        
        const prefix = `LP-${sessionCode}-${classCode}-${subjectCode}-`;

        const resultId = await db.transaction(async (tx) => {
          // Explicit table lock on lesson_plans in transaction to prevent concurrent auto-increment sequence race condition
          await tx.execute(sql`LOCK TABLE lesson_plans IN SHARE ROW EXCLUSIVE MODE`);

          // Query existing plans with this prefix under lock
          const existingPlans = await tx.select({ id: lessonPlans.id })
            .from(lessonPlans)
            .where(sql`${lessonPlans.id} LIKE ${prefix + "%"}`);

          let maxSeq = 0;
          for (const p of existingPlans) {
            const parts = p.id.split("-");
            const seqStr = parts[parts.length - 1];
            const seq = parseInt(seqStr, 10);
            if (!isNaN(seq) && seq > maxSeq) {
              maxSeq = seq;
            }
          }

          const nextSeq = maxSeq + 1;
          const formattedSeq = String(nextSeq).padStart(4, "0");
          const finalLpId = `${prefix}${formattedSeq}`;

          const insertResult = await tx.insert(lessonPlans).values({
              id: finalLpId,
              teacherId: data.teacherId,
              classId: data.classId,
              subjectId: data.subjectId,
              date: data.date,
              type: determinedType,
              chapterDivisionId: data.chapterDivisionId,
              step1Data: JSON.stringify(data.step1Data),
              step2Data: JSON.stringify(newStep2),
              status: data.status || "DRAFT"
          }).returning({ id: lessonPlans.id });

          return insertResult[0].id;
        });
        
        return { success: true, id: resultId, action: "created" };
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
        subject: {
          with: {
            reviewer1: true,
            reviewer2: true,
          }
        },
        teacherProfile: true,
        teacherUser: true,
        reviewerProfile: true,
        reviewerUser: true,
      },
      orderBy: (lp, { desc }) => [desc(lp.updatedAt)],
    });

    const allTeachers = await db.query.teachers.findMany();
    const plansWithProfiles = plans.map(p => {
      const specialist = p.subject?.reviewer1 || p.subject?.reviewer2 || null;
      const defaultPrincipal = allTeachers.find(t =>
        t.assignedRole === 'PRINCIPAL' &&
        t.institute === p.class?.institute
      );
      const isReviewerIdPrincipal = p.reviewerProfile?.assignedRole === 'PRINCIPAL';
      return { 
        ...p, 
        reviewerProfile: isReviewerIdPrincipal ? null : p.reviewerProfile,
        specialistProfile: specialist || null, 
        principalProfile: isReviewerIdPrincipal ? p.reviewerProfile : (defaultPrincipal || null) 
      };
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
        // Normal specialist teacher or explicitly assigned reviewer logic
        return { 
          success: true, 
          data: plansWithProfiles.filter(p => 
            p.subject?.name && (
              p.subject?.reviewerId1 === teacherId ||
              p.subject?.reviewerId2 === teacherId
            )
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
        ...(isPrincipal ? { principalRemark: remark } : { reviewerRemark: remark, reviewerId }),
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
    const plans = await db.query.lessonPlans.findMany({
        where: and(
            eq(lessonPlans.classId, classId),
            eq(lessonPlans.subjectId, subjectId),
            eq(lessonPlans.date, date)
        ),
        with: {
          class: true,
          subject: true,
          teacherProfile: true,
          teacherUser: true,
          reviewerProfile: true,
          reviewerUser: true,
          chapterDivision: {
            with: {
              chapter: true
            }
          }
        }
    });

    const existing = plans.find(p => {
      if (chapterDivisionId) {
        return p.chapterDivisionId === chapterDivisionId;
      }
      if (!p.chapterDivisionId) {
        try {
          const step2 = JSON.parse(p.step2Data || "{}");
          const step2Ucp = step2.sharedData?.unitChapterPage || "";
          return step2Ucp === unitChapterPage;
        } catch {
          return false;
        }
      }
      return false;
    });
    if (existing) {
      // Reconstruct unitChapterPage if blank inside step2Data but chapterDivisionId is present
      let reconstructedUcp = "";
      if (existing.chapterDivisionId && (existing as any).chapterDivision) {
        const div = (existing as any).chapterDivision;
        const chap = div.chapter;
        if (chap) {
          reconstructedUcp = `${chap.name}, Pg ${div.pageStart}-${div.pageEnd} (Div ${div.orderNo})`;
        }
      }

      if (reconstructedUcp) {
        try {
          const step2 = JSON.parse(existing.step2Data || "{}");
          if (!step2.sharedData) step2.sharedData = {};
          if (!step2.sharedData.unitChapterPage) {
            step2.sharedData.unitChapterPage = reconstructedUcp;
            existing.step2Data = JSON.stringify(step2);
          }
        } catch (e) {
          console.error("Failed to merge reconstructedUcp in getLessonPlanByDateAndSubject", e);
        }
      }

      const allTeachers = await db.query.teachers.findMany();
      const specialist = existing.subject?.reviewerId1
        ? allTeachers.find(t => t.id === existing.subject?.reviewerId1)
        : existing.subject?.reviewerId2
        ? allTeachers.find(t => t.id === existing.subject?.reviewerId2)
        : null;
      const defaultPrincipal = allTeachers.find(t =>
        t.assignedRole === 'PRINCIPAL' &&
        t.institute === existing.class?.institute
      );
      const isReviewerIdPrincipal = existing.reviewerProfile?.assignedRole === 'PRINCIPAL';
      return { 
        success: true, 
        data: { 
          ...existing, 
          reviewerProfile: isReviewerIdPrincipal ? null : existing.reviewerProfile,
          specialistProfile: specialist || null, 
          principalProfile: isReviewerIdPrincipal ? existing.reviewerProfile : (defaultPrincipal || null)
        } 
      };
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
          chapterDivision: {
            with: {
              chapter: true
            }
          }
        }
    });
    if (existing) {
      // Reconstruct unitChapterPage if blank inside step2Data but chapterDivisionId is present
      let reconstructedUcp = "";
      if (existing.chapterDivisionId && (existing as any).chapterDivision) {
        const div = (existing as any).chapterDivision;
        const chap = div.chapter;
        if (chap) {
          reconstructedUcp = `${chap.name}, Pg ${div.pageStart}-${div.pageEnd} (Div ${div.orderNo})`;
        }
      }

      if (reconstructedUcp) {
        try {
          const step2 = JSON.parse(existing.step2Data || "{}");
          if (!step2.sharedData) step2.sharedData = {};
          if (!step2.sharedData.unitChapterPage) {
            step2.sharedData.unitChapterPage = reconstructedUcp;
            existing.step2Data = JSON.stringify(step2);
          }
        } catch (e) {
          console.error("Failed to merge reconstructedUcp in getLessonPlanById", e);
        }
      }

      const allTeachers = await db.query.teachers.findMany();
      const specialist = existing.subject?.reviewerId1
        ? allTeachers.find(t => t.id === existing.subject?.reviewerId1)
        : existing.subject?.reviewerId2
        ? allTeachers.find(t => t.id === existing.subject?.reviewerId2)
        : null;
      const defaultPrincipal = allTeachers.find(t =>
        t.assignedRole === 'PRINCIPAL' &&
        t.institute === existing.class?.institute
      );
      const isReviewerIdPrincipal = existing.reviewerProfile?.assignedRole === 'PRINCIPAL';
      return { 
        success: true, 
        data: { 
          ...existing, 
          reviewerProfile: isReviewerIdPrincipal ? null : existing.reviewerProfile,
          specialistProfile: specialist || null, 
          principalProfile: isReviewerIdPrincipal ? existing.reviewerProfile : (defaultPrincipal || null)
        } 
      };
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
        subject: {
          with: {
            reviewer1: true,
            reviewer2: true,
          }
        },
        teacherProfile: true,
        teacherUser: true,
        reviewerProfile: true,
        reviewerUser: true,
      },
      orderBy: (lp, { desc }) => [desc(lp.date)],
    });

    const allTeachers = await db.query.teachers.findMany();
    const plansWithProfiles = plans.map(p => {
      const specialist = p.subject?.reviewer1 || p.subject?.reviewer2 || null;
      const defaultPrincipal = allTeachers.find(t =>
        t.assignedRole === 'PRINCIPAL' &&
        t.institute === p.class?.institute
      );
      const isReviewerIdPrincipal = p.reviewerProfile?.assignedRole === 'PRINCIPAL';
      return { 
        ...p, 
        reviewerProfile: isReviewerIdPrincipal ? null : p.reviewerProfile,
        specialistProfile: specialist || null, 
        principalProfile: isReviewerIdPrincipal ? p.reviewerProfile : (defaultPrincipal || null) 
      };
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
