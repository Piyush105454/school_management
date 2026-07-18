"use server";

import { db } from "@/db";
import { scholarshipPtmSchedule } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getPtmSchedule(month: string, year: string) {
  try {
    const record = await db.query.scholarshipPtmSchedule.findFirst({
      where: (scholarshipPtmSchedule, { eq, and }) => and(
        eq(scholarshipPtmSchedule.month, month),
        eq(scholarshipPtmSchedule.year, year)
      ),
    });
    return { success: true, ptmDate: record ? record.ptmDate : null };
  } catch (error: any) {
    console.error("getPtmSchedule error:", error);
    return { success: false, error: error.message };
  }
}

export async function savePtmSchedule(month: string, year: string, ptmDate: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "TEACHER") {
      return { success: false, error: "Unauthorized: Only administrators can schedule PTM dates." };
    }

    const existing = await db.query.scholarshipPtmSchedule.findFirst({
      where: (scholarshipPtmSchedule, { eq, and }) => and(
        eq(scholarshipPtmSchedule.month, month),
        eq(scholarshipPtmSchedule.year, year)
      ),
    });

    if (existing) {
      await db.update(scholarshipPtmSchedule)
        .set({ ptmDate, updatedAt: new Date() })
        .where(eq(scholarshipPtmSchedule.id, existing.id));
    } else {
      await db.insert(scholarshipPtmSchedule)
        .values({
          month,
          year,
          ptmDate,
          academicYear: "2025-26"
        });
    }

    revalidatePath("/teacher/scholarship-criteria/ptm");
    return { success: true };
  } catch (error: any) {
    console.error("savePtmSchedule error:", error);
    return { success: false, error: error.message };
  }
}
