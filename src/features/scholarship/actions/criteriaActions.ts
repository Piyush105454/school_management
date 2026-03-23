"use server";

import { db } from "@/db";
import { scholarshipCriteriaSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCriteriaSettings(academicYear: string) {
  try {
    const data = await db.query.scholarshipCriteriaSettings.findFirst({
      where: eq(scholarshipCriteriaSettings.academicYear, academicYear),
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCriteriaSettings(academicYear: string, data: any) {
  try {
    const existing = await db.query.scholarshipCriteriaSettings.findFirst({
      where: eq(scholarshipCriteriaSettings.academicYear, academicYear),
    });

    if (existing) {
      await db.update(scholarshipCriteriaSettings)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(scholarshipCriteriaSettings.academicYear, academicYear));
    } else {
      await db.insert(scholarshipCriteriaSettings).values({
        academicYear,
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
