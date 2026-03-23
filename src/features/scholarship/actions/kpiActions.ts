"use server";

import { db } from "@/db";
import { 
  scholarshipAttendance, 
  scholarshipHomework, 
  scholarshipGuardian, 
  scholarshipPtm, 
  scholarshipRecords, 
  scholarshipCriteriaSettings 
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function saveKpiData(admissionId: string, month: string, year: string, data: {
  attendance: { totalDays: number; presentDays: number };
  homework: { totalGiven: number; totalDone: number };
  guardian: { rating: number };
  ptm: { attended: boolean };
}) {
  try {
    // 1. Get Criteria Settings for the year
    const criteria = await db.query.scholarshipCriteriaSettings.findFirst({
      where: eq(scholarshipCriteriaSettings.academicYear, "2025-26"), // Fixed or derived from somewhere
    });

    if (!criteria) {
      return { success: false, error: "Scholarship criteria settings not found for this year." };
    }

    // Calculate Percentages
    const attendancePct = data.attendance.totalDays > 0 ? (data.attendance.presentDays / data.attendance.totalDays) * 100 : 0;
    const homeworkPct = data.homework.totalGiven > 0 ? (data.homework.totalDone / data.homework.totalGiven) * 100 : 0;

    // Calculate Amounts
    const attendanceAmount = attendancePct >= criteria.attendanceThreshold ? criteria.attendanceAmount : 0;
    const homeworkAmount = homeworkPct >= criteria.homeworkThreshold ? criteria.homeworkAmount : 0;
    const guardianAmount = data.guardian.rating >= criteria.guardianRatingThreshold ? criteria.guardianAmount : 0;
    const ptmAmount = data.ptm.attended ? criteria.ptmAmount : 0;
    const totalAmount = attendanceAmount + homeworkAmount + guardianAmount + ptmAmount;

    // 2. Save Attendance
    const existingAttendance = await db.query.scholarshipAttendance.findFirst({
      where: and(
        eq(scholarshipAttendance.admissionId, admissionId),
        eq(scholarshipAttendance.month, month),
        eq(scholarshipAttendance.year, year)
      ),
    });
    if (existingAttendance) {
      await db.update(scholarshipAttendance).set({ ...data.attendance, percentage: attendancePct }).where(eq(scholarshipAttendance.id, existingAttendance.id));
    } else {
      await db.insert(scholarshipAttendance).values({ admissionId, month, year, ...data.attendance, percentage: attendancePct });
    }

    // 3. Save Homework
    const existingHomework = await db.query.scholarshipHomework.findFirst({
      where: and(eq(scholarshipHomework.admissionId, admissionId), eq(scholarshipHomework.month, month), eq(scholarshipHomework.year, year)),
    });
    if (existingHomework) {
      await db.update(scholarshipHomework).set({ ...data.homework, percentage: homeworkPct }).where(eq(scholarshipHomework.id, existingHomework.id));
    } else {
      await db.insert(scholarshipHomework).values({ admissionId, month, year, ...data.homework, percentage: homeworkPct });
    }

    // 4. Save Guardian
    const existingGuardian = await db.query.scholarshipGuardian.findFirst({
      where: and(eq(scholarshipGuardian.admissionId, admissionId), eq(scholarshipGuardian.month, month), eq(scholarshipGuardian.year, year)),
    });
    if (existingGuardian) {
      await db.update(scholarshipGuardian).set({ ...data.guardian }).where(eq(scholarshipGuardian.id, existingGuardian.id));
    } else {
      await db.insert(scholarshipGuardian).values({ admissionId, month, year, ...data.guardian });
    }

    // 5. Save PTM
    const existingPtm = await db.query.scholarshipPtm.findFirst({
      where: and(eq(scholarshipPtm.admissionId, admissionId), eq(scholarshipPtm.month, month), eq(scholarshipPtm.year, year)),
    });
    if (existingPtm) {
      await db.update(scholarshipPtm).set({ ...data.ptm }).where(eq(scholarshipPtm.id, existingPtm.id));
    } else {
      await db.insert(scholarshipPtm).values({ admissionId, month, year, ...data.ptm });
    }

    // 6. Save/Update Scholarship Record
    const existingRecord = await db.query.scholarshipRecords.findFirst({
      where: and(eq(scholarshipRecords.admissionId, admissionId), eq(scholarshipRecords.month, month), eq(scholarshipRecords.year, year)),
    });

    const recordData = {
      attendanceAmount,
      homeworkAmount,
      guardianAmount,
      ptmAmount,
      totalAmount,
      status: "PENDING" as "PENDING", // Wait, status enum PENDING
    };

    if (existingRecord) {
      await db.update(scholarshipRecords).set(recordData).where(eq(scholarshipRecords.id, existingRecord.id));
    } else {
      await db.insert(scholarshipRecords).values({ admissionId, month, year, ...recordData });
    }

    revalidatePath("/office/scholarship/students", "page");
    return { success: true, totalAmount };
  } catch (error: any) {
    console.error("saveKpiData error:", error);
    return { success: false, error: error.message };
  }
}

export async function getStudentKpiData(admissionId: string, month: string, year: string) {
  try {
    const attendance = await db.query.scholarshipAttendance.findFirst({ where: and(eq(scholarshipAttendance.admissionId, admissionId), eq(scholarshipAttendance.month, month), eq(scholarshipAttendance.year, year)) });
    const homework = await db.query.scholarshipHomework.findFirst({ where: and(eq(scholarshipHomework.admissionId, admissionId), eq(scholarshipHomework.month, month), eq(scholarshipHomework.year, year)) });
    const guardian = await db.query.scholarshipGuardian.findFirst({ where: and(eq(scholarshipGuardian.admissionId, admissionId), eq(scholarshipGuardian.month, month), eq(scholarshipGuardian.year, year)) });
    const ptm = await db.query.scholarshipPtm.findFirst({ where: and(eq(scholarshipPtm.admissionId, admissionId), eq(scholarshipPtm.month, month), eq(scholarshipPtm.year, year)) });
    const record = await db.query.scholarshipRecords.findFirst({ where: and(eq(scholarshipRecords.admissionId, admissionId), eq(scholarshipRecords.month, month), eq(scholarshipRecords.year, year)) });

    return { success: true, data: { attendance: attendance || null, homework: homework || null, guardian: guardian || null, ptm: ptm || null, record: record || null } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getStudentMonthlyOverview(admissionId: string, year: string) {
  try {
    const attendance = await db.query.scholarshipAttendance.findMany({ where: and(eq(scholarshipAttendance.admissionId, admissionId), eq(scholarshipAttendance.year, year)) });
    const homework = await db.query.scholarshipHomework.findMany({ where: and(eq(scholarshipHomework.admissionId, admissionId), eq(scholarshipHomework.year, year)) });
    const guardian = await db.query.scholarshipGuardian.findMany({ where: and(eq(scholarshipGuardian.admissionId, admissionId), eq(scholarshipGuardian.year, year)) });
    const ptm = await db.query.scholarshipPtm.findMany({ where: and(eq(scholarshipPtm.admissionId, admissionId), eq(scholarshipPtm.year, year)) });
    const records = await db.query.scholarshipRecords.findMany({ where: and(eq(scholarshipRecords.admissionId, admissionId), eq(scholarshipRecords.year, year)) });

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const overview = months.map(month => {
      const att = attendance.find(a => a.month === month);
      const hw = homework.find(h => h.month === month);
      const gd = guardian.find(g => g.month === month);
      const pt = ptm.find(p => p.month === month);
      const rec = records.find(r => r.month === month);

      return {
        month,
        attendance: att || null,
        homework: hw || null,
        guardian: gd || null,
        ptm: pt || null,
        record: rec || null,
      };
    });

    return { success: true, data: overview };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

