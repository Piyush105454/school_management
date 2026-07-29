import { db } from "@/db";
import { scholarshipRecords, admissionMeta, studentBio, classes, scholarshipAttendance, scholarshipHomework, scholarshipGuardian, scholarshipPtm, students } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: recordId } = await params;

    if (!recordId) {
      return NextResponse.json(
        { error: "Record ID is required" },
        { status: 400 }
      );
    }

    // Fetch the scholarship record with related data
    const record = await db
      .select()
      .from(scholarshipRecords)
      .where(eq(scholarshipRecords.id, recordId))
      .limit(1);

    if (!record || record.length === 0) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      );
    }

    const scholarshipRecord = record[0];

    // Fetch admission meta for additional details
    const admission = await db
      .select()
      .from(admissionMeta)
      .where(eq(admissionMeta.id, scholarshipRecord.admissionId))
      .limit(1);

    const studentBioData = admission?.[0]?.id
      ? await db
          .select()
          .from(studentBio)
          .where(eq(studentBio.admissionId, admission[0].id))
          .limit(1)
      : [];

    // Fetch criteria data (attendance, homework, guardian, ptm)
    // Fetch criteria data (attendance, homework, guardian, ptm) sequentially to prevent connection pool exhaustion
    const attendanceData = await db.query.scholarshipAttendance.findFirst({
      where: and(
        eq(scholarshipAttendance.admissionId, scholarshipRecord.admissionId),
        eq(scholarshipAttendance.month, scholarshipRecord.month),
        eq(scholarshipAttendance.year, scholarshipRecord.year)
      ),
    });
    const homeworkData = await db.query.scholarshipHomework.findFirst({
      where: and(
        eq(scholarshipHomework.admissionId, scholarshipRecord.admissionId),
        eq(scholarshipHomework.month, scholarshipRecord.month),
        eq(scholarshipHomework.year, scholarshipRecord.year)
      ),
    });
    const guardianData = await db.query.scholarshipGuardian.findFirst({
      where: and(
        eq(scholarshipGuardian.admissionId, scholarshipRecord.admissionId),
        eq(scholarshipGuardian.month, scholarshipRecord.month),
        eq(scholarshipGuardian.year, scholarshipRecord.year)
      ),
    });
    const ptmData = await db.query.scholarshipPtm.findFirst({
      where: and(
        eq(scholarshipPtm.admissionId, scholarshipRecord.admissionId),
        eq(scholarshipPtm.month, scholarshipRecord.month),
        eq(scholarshipPtm.year, scholarshipRecord.year)
      ),
    });

    // Map database fields to component interface
    const mappedRecord = {
      id: scholarshipRecord.id,
      admissionId: scholarshipRecord.admissionId,
      name: studentBioData?.[0]?.firstName || "",
      className: admission?.[0]?.entryNumber || "",
      rollNo: admission?.[0]?.admissionNumber || "",
      scholarNo: admission?.[0]?.scholarNumber || "",
      month: scholarshipRecord.month,
      year: scholarshipRecord.year,
      totalSchoolFee: scholarshipRecord.schoolFee,
      scholarshipEarned: scholarshipRecord.totalAmount,
      pendingDue: scholarshipRecord.pendingAmount,
      waiverGiven: scholarshipRecord.discountAmount,
      additionalCharge: scholarshipRecord.additionalChargeAmount,
      adjustmentNote: scholarshipRecord.adjustmentNote || "",
      finalDue: scholarshipRecord.pendingAmount,
      paidOnline: 0,
      status: scholarshipRecord.status,
      attendancePercentage: attendanceData?.percentage || null,
      totalDays: attendanceData?.totalDays || 0,
      presentDays: attendanceData?.presentDays || 0,
      absentDays: (attendanceData as any)?.absentDays || 0,
      mlDays: (attendanceData as any)?.mlDays || 0,
      halfDays: (attendanceData as any)?.halfDays || 0,
      leaveDays: (attendanceData as any)?.leaveDays || 0,
      homeworkPercentage: homeworkData?.percentage || null,
      guardianRating: guardianData?.rating || null,
      ptmAttended: ptmData?.attended ?? false,
      attendanceAmount: scholarshipRecord.attendanceAmount,
      homeworkAmount: scholarshipRecord.homeworkAmount,
      guardianAmount: scholarshipRecord.guardianAmount,
      ptmAmount: scholarshipRecord.ptmAmount,
    };

    return NextResponse.json(mappedRecord);
  } catch (error) {
    console.error("Error fetching scholarship record:", error);
    return NextResponse.json(
      { error: "Failed to fetch record" },
      { status: 500 }
    );
  }
}
