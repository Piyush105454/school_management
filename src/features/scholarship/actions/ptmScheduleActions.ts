"use server";

import { db } from "@/db";
import { scholarshipPtmSchedule } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

let migrationChecked = false;

async function ensureScheduleColumnsExist() {
  if (migrationChecked) return;
  try {
    await db.execute(sql`
      ALTER TABLE scholarship_ptm_schedule 
      ADD COLUMN IF NOT EXISTS start_date text,
      ADD COLUMN IF NOT EXISTS end_date text,
      ADD COLUMN IF NOT EXISTS type text DEFAULT 'PTM';
    `);
    migrationChecked = true;
  } catch (e) {
    console.error("Migration check error:", e);
  }
}

export async function getPtmSchedule(month: string, year: string, type: "PTM" | "GUARDIAN" = "PTM") {
  try {
    await ensureScheduleColumnsExist();
    const record = await db.query.scholarshipPtmSchedule.findFirst({
      where: (scholarshipPtmSchedule, { eq, and }) => and(
        eq(scholarshipPtmSchedule.month, month),
        eq(scholarshipPtmSchedule.year, year),
        eq(scholarshipPtmSchedule.type, type)
      ),
    });
    
    // Fallback for legacy PTM records created before type column was filtered
    if (!record && type === "PTM") {
      const legacy = await db.query.scholarshipPtmSchedule.findFirst({
        where: (scholarshipPtmSchedule, { eq, and }) => and(
          eq(scholarshipPtmSchedule.month, month),
          eq(scholarshipPtmSchedule.year, year)
        ),
      });
      if (legacy) {
        return {
          success: true,
          ptmDate: legacy.ptmDate,
          startDate: legacy.startDate || legacy.ptmDate,
          endDate: legacy.endDate || legacy.ptmDate
        };
      }
    }

    return { 
      success: true, 
      ptmDate: record ? record.ptmDate : null,
      startDate: record ? (record.startDate || record.ptmDate) : null,
      endDate: record ? (record.endDate || record.ptmDate) : null
    };
  } catch (error: any) {
    console.error("getPtmSchedule error:", error);
    return { success: false, error: error.message };
  }
}

export async function savePtmSchedule(
  month: string, 
  year: string, 
  ptmDate: string, 
  startDate?: string, 
  endDate?: string,
  type: "PTM" | "GUARDIAN" = "PTM"
) {
  try {
    await ensureScheduleColumnsExist();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "TEACHER") {
      return { success: false, error: "Unauthorized: Only administrators can schedule dates." };
    }

    const start = startDate || ptmDate;
    const end = endDate || ptmDate;

    const existing = await db.query.scholarshipPtmSchedule.findFirst({
      where: (scholarshipPtmSchedule, { eq, and }) => and(
        eq(scholarshipPtmSchedule.month, month),
        eq(scholarshipPtmSchedule.year, year),
        eq(scholarshipPtmSchedule.type, type)
      ),
    });

    if (existing) {
      await db.update(scholarshipPtmSchedule)
        .set({ ptmDate: start, startDate: start, endDate: end, updatedAt: new Date() })
        .where(eq(scholarshipPtmSchedule.id, existing.id));
    } else {
      await db.insert(scholarshipPtmSchedule)
        .values({
          month,
          year,
          ptmDate: start,
          startDate: start,
          endDate: end,
          type,
          academicYear: "2025-26"
        });
    }

    revalidatePath("/teacher/scholarship-criteria/ptm");
    revalidatePath("/teacher/scholarship-criteria/guardian");
    return { success: true };
  } catch (error: any) {
    console.error("savePtmSchedule error:", error);
    return { success: false, error: error.message };
  }
}
