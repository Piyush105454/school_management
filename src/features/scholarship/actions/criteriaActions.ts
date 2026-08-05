"use server";

import { db } from "@/db";
import { scholarshipCriteriaSettings } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity-log";

/**
 * Lookup priority:
 * 1. Student-specific override (admissionId matches)
 * 2. Institute-level default (admissionId = NULL, institute matches)
 * 3. Global fallback (admissionId = NULL, institute = NULL)
 */
export async function getCriteriaSettings(
  academicYear: string,
  admissionId?: string,
  institute?: string
) {
  try {
    // 1. Student-specific override
    if (admissionId) {
      const data = await db.query.scholarshipCriteriaSettings.findFirst({
        where: and(
          eq(scholarshipCriteriaSettings.academicYear, academicYear),
          eq(scholarshipCriteriaSettings.admissionId, admissionId)
        ),
      });
      if (data) return { success: true, data };
    }

    // 2. Institute-level default
    if (institute) {
      const data = await db.query.scholarshipCriteriaSettings.findFirst({
        where: and(
          eq(scholarshipCriteriaSettings.academicYear, academicYear),
          isNull(scholarshipCriteriaSettings.admissionId),
          eq(scholarshipCriteriaSettings.institute, institute)
        ),
      });
      if (data) return { success: true, data };
    }

    // 3. Global fallback (no institute, no admissionId)
    const data = await db.query.scholarshipCriteriaSettings.findFirst({
      where: and(
        eq(scholarshipCriteriaSettings.academicYear, academicYear),
        isNull(scholarshipCriteriaSettings.admissionId),
        isNull(scholarshipCriteriaSettings.institute)
      ),
    });
    return { success: true, data: data || null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCriteriaSettings(
  academicYear: string,
  data: any,
  admissionId?: string,
  institute?: string
) {
  try {
    // Build the where condition for lookup
    const whereCondition = admissionId
      ? and(
          eq(scholarshipCriteriaSettings.academicYear, academicYear),
          eq(scholarshipCriteriaSettings.admissionId, admissionId)
        )
      : institute
      ? and(
          eq(scholarshipCriteriaSettings.academicYear, academicYear),
          isNull(scholarshipCriteriaSettings.admissionId),
          eq(scholarshipCriteriaSettings.institute, institute)
        )
      : and(
          eq(scholarshipCriteriaSettings.academicYear, academicYear),
          isNull(scholarshipCriteriaSettings.admissionId),
          isNull(scholarshipCriteriaSettings.institute)
        );

    const existing = await db.query.scholarshipCriteriaSettings.findFirst({
      where: whereCondition,
    });

    if (existing) {
      await db
        .update(scholarshipCriteriaSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(scholarshipCriteriaSettings.id, existing.id));
    } else {
      await db.insert(scholarshipCriteriaSettings).values({
        academicYear,
        admissionId: admissionId || null,
        institute: admissionId ? null : (institute || null), // institute only for global rows
        ...data,
      });
    }

    revalidatePath("/office/scholarship/settings", "page");

    // Log activity for audit trail
    await logActivity({
      action: "UPDATE",
      module: "Scholarship",
      details: `Scholarship criteria settings updated for academic year ${academicYear}${institute ? ` (Institute: ${institute})` : ""}`,
    });

    return { success: true };
  } catch (error: any) {
    console.error("updateCriteriaSettings error:", error);
    return { success: false, error: error.message };
  }
}
