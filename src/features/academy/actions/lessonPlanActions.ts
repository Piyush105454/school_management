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
            step2Data: JSON.stringify(data.step2Data)
        }).returning({ id: lessonPlans.id });
        
        return { success: true, id: result[0].id, action: "created" };
    }
  } catch (error: any) {
    console.error("saveLessonPlan error:", error);
    return { success: false, error: error.message };
  }
}
