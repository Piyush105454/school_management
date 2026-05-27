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
import { eq, and, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { studentAttendance, students, admissionMeta, lessonPlans, homeworkSubmissions } from "@/db/schema";

export async function saveKpiData(admissionId: string, month: string, year: string, data: {
  attendance: { totalDays: number; presentDays: number };
  homework: { totalGiven: number; totalDone: number };
  guardian: { rating: number };
  ptm: { attended: boolean };
  adjustment?: { amount: number; type: string; note: string };
}) {
  try {
    // 1. Get Criteria Settings (Try student override first, then global)
    let criteria = await db.query.scholarshipCriteriaSettings.findFirst({
      where: and(
        eq(scholarshipCriteriaSettings.academicYear, "2025-26"), // Fixed or derived
        eq(scholarshipCriteriaSettings.admissionId, admissionId)
      ),
    });

    if (!criteria) {
      criteria = await db.query.scholarshipCriteriaSettings.findFirst({
        where: and(
          eq(scholarshipCriteriaSettings.academicYear, "2025-26"),
          isNull(scholarshipCriteriaSettings.admissionId)
        ),
      });
    }

    if (!criteria) {
      return { success: false, error: "Scholarship criteria settings not found for this year." };
    }

    // Calculate Percentages
    const attendancePct = data.attendance.totalDays > 0 ? (data.attendance.presentDays / data.attendance.totalDays) * 100 : 0;
    const homeworkPct = data.homework.totalGiven > 0 ? (data.homework.totalDone / data.homework.totalGiven) * 100 : 0;

    // Calculate Amounts (Proportional Logic)
    // 1. Attendance: Proportional to percentage (Max amount if 100%)
    const attendanceAmount = Math.round(attendancePct * (criteria.attendanceAmount / 100));

    // 2. Homework: Proportional to percentage (Max amount if 100%)
    const homeworkAmount = Math.round(homeworkPct * (criteria.homeworkAmount / 100));

    // 3. Guardian Rating: Each point (tick) adds criteria.guardianAmount / 5 (Usually 150)
    const guardianAmount = Math.round(data.guardian.rating * (criteria.guardianAmount / 5));

    // 4. PTM: All or nothing
    const ptmAmount = data.ptm.attended ? criteria.ptmAmount : 0;

    const totalAmount = attendanceAmount + homeworkAmount + guardianAmount + ptmAmount;

    // Calculate signed adjustment amount for record-keeping
    let adjustmentAmount = 0;
    let adjustmentNote = "";
    if (data.adjustment) {
      const { amount, type, note } = data.adjustment;
      if (type === "DISCOUNT") {
        adjustmentAmount = -Math.abs(amount);
      } else if (type === "CHARGE") {
        adjustmentAmount = Math.abs(amount);
      }
      adjustmentNote = note || "";
    }

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
      adjustmentAmount,
      adjustmentNote,
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
    const [attendance, homework, guardian, ptm, record] = await Promise.all([
      db.query.scholarshipAttendance.findFirst({ where: and(eq(scholarshipAttendance.admissionId, admissionId), eq(scholarshipAttendance.month, month), eq(scholarshipAttendance.year, year)) }),
      db.query.scholarshipHomework.findFirst({ where: and(eq(scholarshipHomework.admissionId, admissionId), eq(scholarshipHomework.month, month), eq(scholarshipHomework.year, year)) }),
      db.query.scholarshipGuardian.findFirst({ where: and(eq(scholarshipGuardian.admissionId, admissionId), eq(scholarshipGuardian.month, month), eq(scholarshipGuardian.year, year)) }),
      db.query.scholarshipPtm.findFirst({ where: and(eq(scholarshipPtm.admissionId, admissionId), eq(scholarshipPtm.month, month), eq(scholarshipPtm.year, year)) }),
      db.query.scholarshipRecords.findFirst({ where: and(eq(scholarshipRecords.admissionId, admissionId), eq(scholarshipRecords.month, month), eq(scholarshipRecords.year, year)) }),
    ]);

    // Fetch Criteria (Override first, then global)
    let criteria = await db.query.scholarshipCriteriaSettings.findFirst({
      where: and(
        eq(scholarshipCriteriaSettings.academicYear, "2025-26"),
        eq(scholarshipCriteriaSettings.admissionId, admissionId)
      ),
    });

    if (!criteria) {
      criteria = await db.query.scholarshipCriteriaSettings.findFirst({
        where: and(
          eq(scholarshipCriteriaSettings.academicYear, "2025-26"),
          isNull(scholarshipCriteriaSettings.admissionId)
        ),
      });
    }

    // --- NEW: Fetch Real Academy Attendance Data ---
    const meta = await db.query.admissionMeta.findFirst({
      where: eq(admissionMeta.id, admissionId),
      columns: { entryNumber: true }
    });

    let realAttendance = null;
    if (meta?.entryNumber) {
      const student = await db.query.students.findFirst({
        where: eq(students.studentId, meta.entryNumber)
      });

      if (student) {
        const stats = await db.select({
          total: sql`count(case when status not in ('H', 'NA') then 1 end)`,
          present: sql`count(case when status in ('P', 'ML') then 1 end)`,
        })
        .from(studentAttendance)
        .where(and(
          eq(studentAttendance.studentId, student.id),
          eq(studentAttendance.month, month),
          eq(studentAttendance.year, parseInt(year))
        ));

        const total = Number(stats[0]?.total || 0);
        const present = Number(stats[0]?.present || 0);
        
        realAttendance = {
          totalDays: total,
          presentDays: present,
          percentage: total > 0 ? (present / total) * 100 : 0
        };
      }
    }

    // --- NEW: Fetch Real Academy Homework Data ---
    let realHomework = null;
    if (meta?.entryNumber) {
      const student = await db.query.students.findFirst({
        where: eq(students.studentId, meta.entryNumber)
      });

      if (student) {
        // Convert month name to 2-digit number string (e.g. "April" -> "04")
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthIndex = monthNames.indexOf(month);
        const monthStr = monthIndex >= 0 ? String(monthIndex + 1).padStart(2, '0') : null;

        if (monthStr) {
          // Total homeworks assigned to this class in this month
          const totalAssignedResult = await db.select({ count: sql`count(*)` })
            .from(lessonPlans)
            .where(and(
              eq(lessonPlans.classId, student.classId as number),
              sql`${lessonPlans.date} LIKE ${`${year}-${monthStr}%`}`
            ));

          // Total completed homeworks by this student in this month
          const totalCompletedResult = await db.select({ count: sql`count(*)` })
            .from(homeworkSubmissions)
            .innerJoin(lessonPlans, eq(homeworkSubmissions.lessonPlanId, lessonPlans.id))
            .where(and(
              eq(homeworkSubmissions.studentId, student.id),
              eq(homeworkSubmissions.status, "COMPLETED"),
              eq(lessonPlans.classId, student.classId as number),
              sql`${lessonPlans.date} LIKE ${`${year}-${monthStr}%`}`
            ));

          const totalGiven = Number(totalAssignedResult[0]?.count || 0);
          const totalDone = Number(totalCompletedResult[0]?.count || 0);

          realHomework = {
            totalGiven,
            totalDone,
            percentage: totalGiven > 0 ? (totalDone / totalGiven) * 100 : 0
          };
        }
      }
    }

    return { 
      success: true, 
      data: { 
        attendance: attendance || realAttendance || null, 
        homework: homework || null, 
        guardian: guardian || null, 
        ptm: ptm || null, 
        record: record || null,
        criteria: criteria || null,
        calculatedAttendance: realAttendance, // Always provide for pre-filling
        calculatedHomework: realHomework       // Always provide for pre-filling
      } 
    };
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

