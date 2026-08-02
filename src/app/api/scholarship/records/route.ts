export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  scholarshipRecords,
  admissionMeta,
  students,
  studentBio,
  classes,
  scholarshipAttendance,
  scholarshipHomework,
  scholarshipGuardian,
  scholarshipPtm,
} from "@/db/schema";
import { eq, inArray, and, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const admissionIdParam = searchParams.get("admissionId");
    const monthsParam = searchParams.get("months");
    const classesParam = searchParams.get("classes");
    const statusesParam = searchParams.get("statuses");
    const yearParam = searchParams.get("year");
    let institute = searchParams.get("institute");

    // Force institute override for restricted roles
    if ((session.user.role === "TEACHER" || session.user.role === "PRINCIPAL") && (session.user as any).institute) {
      institute = (session.user as any).institute;
    } else if (!institute && (session.user as any).institute) {
      institute = (session.user as any).institute;
    }

    // First fetch scholarship records with basic info
    const recordsWithStudents = await db
      .select({
        id: scholarshipRecords.id,
        admissionId: scholarshipRecords.admissionId,
        month: scholarshipRecords.month,
        year: scholarshipRecords.year,
        status: scholarshipRecords.status,
        scholarshipEarned: scholarshipRecords.totalAmount,
        schoolFee: scholarshipRecords.schoolFee,
        pendingAmount: scholarshipRecords.pendingAmount,
        waiverGiven: scholarshipRecords.discountAmount,
        additionalCharge: scholarshipRecords.additionalChargeAmount,
        attendanceAmount: scholarshipRecords.attendanceAmount,
        homeworkAmount: scholarshipRecords.homeworkAmount,
        guardianAmount: scholarshipRecords.guardianAmount,
        ptmAmount: scholarshipRecords.ptmAmount,
        studentName: studentBio.firstName,
        studentLastName: studentBio.lastName,
        className: classes.name,
        rollNo: students.rollNumber,
        scholarNo: students.scholarNumber,
        admissionNo: admissionMeta.admissionNumber,
        entryNo: admissionMeta.entryNumber,
      })
      .from(scholarshipRecords)
      .innerJoin(admissionMeta, eq(scholarshipRecords.admissionId, admissionMeta.id))
      .innerJoin(studentBio, eq(admissionMeta.id, studentBio.admissionId))
      .innerJoin(students, eq(admissionMeta.entryNumber, students.studentId))
      .innerJoin(classes, eq(students.classId, classes.id))
      .where(
        and(
          admissionIdParam ? eq(scholarshipRecords.admissionId, admissionIdParam) : undefined,
          monthsParam && monthsParam !== "ALL"
            ? inArray(scholarshipRecords.month, monthsParam.split(","))
            : undefined,
          classesParam && classesParam !== "ALL"
            ? inArray(classes.name, classesParam.split(","))
            : undefined,
          statusesParam && statusesParam !== "ALL"
            ? inArray(
                scholarshipRecords.status as any,
                statusesParam.split(",").flatMap(s => s === "SCHOLARSHIP FULL AWARDED" ? ["APPROVED", "SCHOLARSHIP FULL AWARDED"] : [s])
              )
            : undefined,
          yearParam ? eq(scholarshipRecords.year, yearParam) : undefined,
          institute && institute !== "ALL"
            ? eq(classes.institute, institute)
            : undefined,
        )
      )
      .orderBy(desc(scholarshipRecords.createdAt))
      .limit(admissionIdParam ? 1000 : 100);

    // Fetch criteria data for all records - now with month/year filtering
    const attendanceMap = new Map();
    const homeworkMap = new Map();
    const guardianMap = new Map();
    const ptmMap = new Map();

    if (recordsWithStudents.length > 0) {

      const attendanceRecords = await db.query.scholarshipAttendance.findMany({
        where: and(
          inArray(
            scholarshipAttendance.admissionId,
            recordsWithStudents.map(r => r.admissionId)
          ),
          inArray(
            scholarshipAttendance.month,
            [...new Set(recordsWithStudents.map(r => r.month))]
          ),
          inArray(
            scholarshipAttendance.year,
            [...new Set(recordsWithStudents.map(r => r.year))]
          )
        )
      });
      attendanceRecords.forEach(att => {
        attendanceMap.set(`${att.admissionId}-${att.month}-${att.year}`, att);
      });

      const homeworkRecords = await db.query.scholarshipHomework.findMany({
        where: and(
          inArray(
            scholarshipHomework.admissionId,
            recordsWithStudents.map(r => r.admissionId)
          ),
          inArray(
            scholarshipHomework.month,
            [...new Set(recordsWithStudents.map(r => r.month))]
          ),
          inArray(
            scholarshipHomework.year,
            [...new Set(recordsWithStudents.map(r => r.year))]
          )
        )
      });
      homeworkRecords.forEach(hw => {
        homeworkMap.set(`${hw.admissionId}-${hw.month}-${hw.year}`, hw);
      });

      const guardianRecords = await db.query.scholarshipGuardian.findMany({
        where: and(
          inArray(
            scholarshipGuardian.admissionId,
            recordsWithStudents.map(r => r.admissionId)
          ),
          inArray(
            scholarshipGuardian.month,
            [...new Set(recordsWithStudents.map(r => r.month))]
          ),
          inArray(
            scholarshipGuardian.year,
            [...new Set(recordsWithStudents.map(r => r.year))]
          )
        )
      });
      guardianRecords.forEach(gd => {
        guardianMap.set(`${gd.admissionId}-${gd.month}-${gd.year}`, gd);
      });

      const ptmRecords = await db.query.scholarshipPtm.findMany({
        where: and(
          inArray(
            scholarshipPtm.admissionId,
            recordsWithStudents.map(r => r.admissionId)
          ),
          inArray(
            scholarshipPtm.month,
            [...new Set(recordsWithStudents.map(r => r.month))]
          ),
          inArray(
            scholarshipPtm.year,
            [...new Set(recordsWithStudents.map(r => r.year))]
          )
        )
      });
      ptmRecords.forEach(pt => {
        ptmMap.set(`${pt.admissionId}-${pt.month}-${pt.year}`, pt);
      });
    }

    // Map criteria data to records
    const rawRecords = recordsWithStudents.map(record => {
      const key = `${record.admissionId}-${record.month}-${record.year}`;
      const att = attendanceMap.get(key);
      const hw = homeworkMap.get(key);
      const gd = guardianMap.get(key);
      const pt = ptmMap.get(key);

      return {
        ...record,
        attendancePercentage: att?.percentage || null,
        totalDays: att?.totalDays || 0,
        presentDays: att?.presentDays || 0,
        absentDays: (att as any)?.absentDays || 0,
        mlDays: (att as any)?.mlDays || 0,
        halfDays: (att as any)?.halfDays || 0,
        leaveDays: (att as any)?.leaveDays || 0,
        homeworkPercentage: hw?.percentage || null,
        guardianRating: gd?.rating || null,
        ptmAttended: pt?.attended ?? false,
      };
    });

    const formattedRecords = rawRecords.map((record) => {
      // Use database values for consistency (no calculations!)
      const totalSchoolFee = record.schoolFee ?? 3000;
      const pendingDue = record.pendingAmount ?? 0;
      const finalDue = pendingDue; // pending_amount already includes adjustments
      
      // Paid Online = amount already paid (only if status is PAID)
      const paidOnline = record.status === "PAID" ? (totalSchoolFee - pendingDue) : 0;
      
      // Determine final status
      let displayStatus: string = record.status;
      if (record.status === "APPROVED" || (record.status as string) === "SCHOLARSHIP FULL AWARDED" || (record.status === "PENDING" && pendingDue === 0)) {
        displayStatus = "SCHOLARSHIP FULL AWARDED";
      }

      return {
        id: record.id,
        admissionId: record.admissionId,
        name: `${record.studentName} ${record.studentLastName || ""}`.trim(),
        className: record.className,
        rollNo: record.rollNo || "-",
        scholarNo: record.scholarNo || record.admissionNo || record.entryNo || "-",
        month: record.month,
        year: record.year,
        totalSchoolFee,
        scholarshipEarned: record.scholarshipEarned,
        pendingDue,
        waiverGiven: record.waiverGiven,
        additionalCharge: record.additionalCharge,
        adjustmentNote: (record as any).adjustmentNote || "",
        finalDue,
        paidOnline,
        status: displayStatus,
        attendancePercentage: record.attendancePercentage || null,
        totalDays: record.totalDays || 0,
        presentDays: record.presentDays || 0,
        absentDays: record.absentDays || 0,
        mlDays: record.mlDays || 0,
        halfDays: record.halfDays || 0,
        leaveDays: record.leaveDays || 0,
        homeworkPercentage: record.homeworkPercentage || null,
        guardianRating: record.guardianRating || null,
        ptmAttended: record.ptmAttended ?? false,
        attendanceAmount: record.attendanceAmount || 0,
        homeworkAmount: record.homeworkAmount || 0,
        guardianAmount: record.guardianAmount || 0,
        ptmAmount: record.ptmAmount || 0,
      };
    });

    return NextResponse.json(formattedRecords);
  } catch (error: any) {
    console.error("Error fetching scholarship records:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
