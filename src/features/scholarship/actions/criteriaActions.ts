"use server";

import { db } from "@/db";
import { scholarshipCriteriaSettings } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCriteriaSettings(academicYear: string, admissionId?: string) {
  try {
    const data = await db.query.scholarshipCriteriaSettings.findFirst({
      where: and(
        eq(scholarshipCriteriaSettings.academicYear, academicYear),
        admissionId 
          ? eq(scholarshipCriteriaSettings.admissionId, admissionId)
          : isNull(scholarshipCriteriaSettings.admissionId)
      ),
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCriteriaSettings(academicYear: string, data: any, admissionId?: string) {
  try {
    const existing = await db.query.scholarshipCriteriaSettings.findFirst({
      where: and(
        eq(scholarshipCriteriaSettings.academicYear, academicYear),
        admissionId 
          ? eq(scholarshipCriteriaSettings.admissionId, admissionId)
          : isNull(scholarshipCriteriaSettings.admissionId)
      ),
    });

    if (existing) {
      await db.update(scholarshipCriteriaSettings)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(scholarshipCriteriaSettings.academicYear, academicYear),
            admissionId 
              ? eq(scholarshipCriteriaSettings.admissionId, admissionId)
              : isNull(scholarshipCriteriaSettings.admissionId)
          )
        );
    } else {
      await db.insert(scholarshipCriteriaSettings).values({
        academicYear,
        admissionId: admissionId || null,
        ...data,
      });
    }

    revalidatePath("/office/scholarship/settings", "page");
    return { success: true };
  } catch (error: any) {
    console.error("updateCriteriaSettings error:", error);
    return { success: false, error: error.message };
  }
}
