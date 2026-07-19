export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  scholarshipRecords,
  admissionMeta,
  students,
  studentBio,
  classes,
  scholarshipCriteriaSettings,
} from "@/db/schema";
import { eq, inArray, and, desc, or, isNull } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const monthsParam = searchParams.get("months");
    const classesParam = searchParams.get("classes");
    const statusesParam = searchParams.get("statuses");
    let institute = searchParams.get("institute");

    // Force institute override for restricted roles
    if ((session.user.role === "TEACHER" || session.user.role === "PRINCIPAL") && (session.user as any).institute) {
      institute = (session.user as any).institute;
    } else if (!institute && (session.user as any).institute) {
      institute = (session.user as any).institute;
    }

    const rawRecords = await db
      .select({
        id: scholarshipRecords.id,
        admissionId: scholarshipRecords.admissionId,
        month: scholarshipRecords.month,
        year: scholarshipRecords.year,
        status: scholarshipRecords.status,
        scholarshipEarned: scholarshipRecords.totalAmount,
        waiverGiven: scholarshipRecords.discountAmount,
        additionalCharge: scholarshipRecords.additionalChargeAmount,
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
          monthsParam && monthsParam !== "ALL"
            ? inArray(scholarshipRecords.month, monthsParam.split(","))
            : undefined,
          classesParam && classesParam !== "ALL"
            ? inArray(classes.name, classesParam.split(","))
            : undefined,
          statusesParam && statusesParam !== "ALL"
            ? inArray(scholarshipRecords.status as any, statusesParam.split(","))
            : undefined,
          institute && institute !== "ALL"
            ? eq(classes.institute, institute)
            : undefined,
        )
      )
      .orderBy(desc(scholarshipRecords.createdAt));

    // Fetch current year criteria to get the "Total School Fee" (maxTotal)
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${String(currentYear + 1).slice(-2)}`;

    // Fetch criteria for each admissionId (student-specific criteria or global)
    const admissionIds = [...new Set(rawRecords.map((r) => r.admissionId))];
    const criteriaList = admissionIds.length > 0
      ? await db
          .select()
          .from(scholarshipCriteriaSettings)
          .where(
            and(
              eq(scholarshipCriteriaSettings.academicYear, academicYear),
              inArray(scholarshipCriteriaSettings.admissionId, admissionIds)
            )
          )
      : [];

    // Also fetch global criteria (admissionId is null) as fallback
    const globalCriteria = await db
      .select()
      .from(scholarshipCriteriaSettings)
      .where(
        and(
          eq(scholarshipCriteriaSettings.academicYear, academicYear),
          isNull(scholarshipCriteriaSettings.admissionId)
        )
      )
      .limit(1);

    const criteriaMap = new Map(criteriaList.map((c) => [c.admissionId, c]));
    const defaultCriteria = globalCriteria[0];

    const formattedRecords = rawRecords.map((record) => {
      const criteria = criteriaMap.get(record.admissionId) || defaultCriteria;

      // Total School Fee = sum of max amounts from criteria
      const maxAttendance = criteria?.attendanceAmount ?? 750;
      const maxHomework = criteria?.homeworkAmount ?? 750;
      const maxGuardian = criteria?.guardianAmount ?? 750;
      const maxPtm = criteria?.ptmAmount ?? 750;
      const totalSchoolFee = maxAttendance + maxHomework + maxGuardian + maxPtm;

      // Pending Due = Total School Fee - Scholarship Earned
      const pendingDue = totalSchoolFee - record.scholarshipEarned;

      // Final Due = Pending Due - Waiver Given + Additional Charge
      const finalDue = Math.max(0, pendingDue - record.waiverGiven + record.additionalCharge);

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
        pendingDue: Math.max(0, pendingDue),
        waiverGiven: record.waiverGiven,
        additionalCharge: record.additionalCharge,
        finalDue,
        status: record.status,
      };
    });

    return NextResponse.json(formattedRecords);
  } catch (error: any) {
    console.error("Error fetching scholarship records:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
