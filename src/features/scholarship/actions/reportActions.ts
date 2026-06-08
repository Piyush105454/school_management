"use server";

import { db } from "@/db";
import { 
  scholarshipRecords, 
  admissionMeta, 
  inquiries, 
  studentProfiles, 
  students, 
  scholarshipAttendance, 
  scholarshipHomework, 
  scholarshipGuardian, 
  scholarshipPtm 
} from "@/db/schema";
import { sql, eq, and, inArray } from "drizzle-orm";

export async function getMonthlyReports(school?: string): Promise<{ success: true; data: any[] } | { success: false; error: string }> {
  try {
    const reports = await db
      .select({
        month: scholarshipRecords.month,
        year: scholarshipRecords.year,
        totalAmount: sql<number>`sum(${scholarshipRecords.totalAmount})::int`,
        paidAmount: sql<number>`sum(case when ${scholarshipRecords.status} = 'PAID' then ${scholarshipRecords.totalAmount} else 0 end)::int`,
        pendingCount: sql<number>`count(case when ${scholarshipRecords.status} = 'PENDING' then 1 end)::int`,
        approvedCount: sql<number>`count(case when ${scholarshipRecords.status} = 'APPROVED' then 1 end)::int`,
        paidCount: sql<number>`count(case when ${scholarshipRecords.status} = 'PAID' then 1 end)::int`,
      })
      .from(scholarshipRecords)
      .innerJoin(admissionMeta, eq(scholarshipRecords.admissionId, admissionMeta.id))
      .innerJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
      .where(school && school !== "ALL" ? eq(inquiries.school, school) : undefined)
      .groupBy(scholarshipRecords.month, scholarshipRecords.year);

    return { success: true, data: reports };
  } catch (error: any) {
    console.error("getMonthlyReports error:", error);
    return { success: false, error: error.message };
  }
}

export async function getDetailedStudentReports(params: {
  month: string;
  year: string;
  className?: string;
  school?: string;
  classesFilter?: string[];
}): Promise<{ success: true; data: any[] } | { success: false; error: string }> {
  try {
    const { month, year, className, school, classesFilter } = params;

    const conditions = [
      eq(studentProfiles.isFullyAdmitted, true)
    ];

    if (school && school !== "ALL") {
      conditions.push(eq(inquiries.school, school));
    }

    if (className) {
      conditions.push(eq(inquiries.appliedClass, className));
    } else if (classesFilter && classesFilter.length > 0) {
      conditions.push(inArray(inquiries.appliedClass, classesFilter));
    }

    const reportData = await db
      .select({
        admissionId: admissionMeta.id,
        studentName: inquiries.studentName,
        parentName: inquiries.parentName,
        appliedClass: inquiries.appliedClass,
        scholarNumber: students.scholarNumber,
        metaScholarNumber: admissionMeta.scholarNumber,
        admissionNumber: admissionMeta.admissionNumber,
        entryNumber: admissionMeta.entryNumber,

        // scholarshipRecords fields
        recordId: scholarshipRecords.id,
        attendanceAmount: scholarshipRecords.attendanceAmount,
        homeworkAmount: scholarshipRecords.homeworkAmount,
        guardianAmount: scholarshipRecords.guardianAmount,
        ptmAmount: scholarshipRecords.ptmAmount,
        totalAmount: scholarshipRecords.totalAmount,
        adjustmentAmount: scholarshipRecords.adjustmentAmount,
        adjustmentNote: scholarshipRecords.adjustmentNote,
        status: scholarshipRecords.status,

        // scholarshipAttendance percentage
        attendancePct: scholarshipAttendance.percentage,

        // scholarshipHomework percentage
        homeworkPct: scholarshipHomework.percentage,

        // scholarshipGuardian rating
        guardianRating: scholarshipGuardian.rating,

        // scholarshipPtm attended
        ptmAttended: scholarshipPtm.attended,
      })
      .from(studentProfiles)
      .innerJoin(admissionMeta, eq(studentProfiles.admissionMetaId, admissionMeta.id))
      .innerJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
      .leftJoin(students, eq(admissionMeta.entryNumber, students.studentId))
      .leftJoin(
        scholarshipRecords,
        and(
          eq(scholarshipRecords.admissionId, admissionMeta.id),
          eq(scholarshipRecords.month, month),
          eq(scholarshipRecords.year, year)
        )
      )
      .leftJoin(
        scholarshipAttendance,
        and(
          eq(scholarshipAttendance.admissionId, admissionMeta.id),
          eq(scholarshipAttendance.month, month),
          eq(scholarshipAttendance.year, year)
        )
      )
      .leftJoin(
        scholarshipHomework,
        and(
          eq(scholarshipHomework.admissionId, admissionMeta.id),
          eq(scholarshipHomework.month, month),
          eq(scholarshipHomework.year, year)
        )
      )
      .leftJoin(
        scholarshipGuardian,
        and(
          eq(scholarshipGuardian.admissionId, admissionMeta.id),
          eq(scholarshipGuardian.month, month),
          eq(scholarshipGuardian.year, year)
        )
      )
      .leftJoin(
        scholarshipPtm,
        and(
          eq(scholarshipPtm.admissionId, admissionMeta.id),
          eq(scholarshipPtm.month, month),
          eq(scholarshipPtm.year, year)
        )
      )
      .where(and(...conditions));

    return { success: true, data: reportData };
  } catch (error: any) {
    console.error("getDetailedStudentReports error:", error);
    return { success: false, error: error.message };
  }
}

