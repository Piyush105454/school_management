export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { scholarshipRecords, admissionMeta, students, studentBio, classes } from "@/db/schema";
import { eq, inArray, and, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const monthsParam = searchParams.get("months"); // e.g. "April,May"
    const classesParam = searchParams.get("classes");
    const statusesParam = searchParams.get("statuses");
    let institute = searchParams.get("institute");

    // Force institute override for restricted roles
    if ((session.user.role === "TEACHER" || session.user.role === "PRINCIPAL") && (session.user as any).institute) {
      institute = (session.user as any).institute;
    } else if (!institute && (session.user as any).institute) {
      institute = (session.user as any).institute;
    }

    let query = db.select({
      id: scholarshipRecords.id,
      month: scholarshipRecords.month,
      year: scholarshipRecords.year,
      status: scholarshipRecords.status,
      scholarshipEarned: scholarshipRecords.totalAmount,
      waiverGiven: scholarshipRecords.discountAmount,
      // Pending Due would normally come from a fees table, but we will calculate it based on a standard fee or just return 0 for now.
      // Let's assume a standard monthly fee of 2000.
      studentName: studentBio.firstName,
      studentLastName: studentBio.lastName,
      className: classes.name,
      rollNo: students.rollNumber,
      scholarNo: students.scholarNumber,
      admissionNo: admissionMeta.admissionNumber,
      entryNo: admissionMeta.entryNumber,
      admissionId: scholarshipRecords.admissionId,
    })
    .from(scholarshipRecords)
    .innerJoin(admissionMeta, eq(scholarshipRecords.admissionId, admissionMeta.id))
    .innerJoin(studentBio, eq(admissionMeta.id, studentBio.admissionId))
    .innerJoin(students, eq(admissionMeta.entryNumber, students.studentId))
    .innerJoin(classes, eq(students.classId, classes.id));

    const dynamicWheres: any[] = [];

    if (monthsParam && monthsParam !== "ALL") {
      dynamicWheres.push(inArray(scholarshipRecords.month, monthsParam.split(",")));
    }

    if (classesParam && classesParam !== "ALL") {
      dynamicWheres.push(inArray(classes.name, classesParam.split(",")));
    }

    if (statusesParam && statusesParam !== "ALL") {
      dynamicWheres.push(inArray(scholarshipRecords.status, statusesParam.split(",")));
    }

    if (institute && institute !== "ALL") {
      dynamicWheres.push(eq(classes.institute, institute));
    }

    if (dynamicWheres.length > 0) {
      query = query.where(and(...dynamicWheres));
    }

    query = query.orderBy(desc(scholarshipRecords.createdAt));

    const rawRecords = await query;

    const formattedRecords = rawRecords.map(record => {
      const standardFee = 2000;
      const finalDue = standardFee - record.scholarshipEarned - record.waiverGiven;
      return {
        id: record.id,
        name: `${record.studentName} ${record.studentLastName || ''}`.trim(),
        className: record.className,
        rollNo: record.rollNo || '-',
        scholarNo: record.scholarNo || record.admissionNo || record.entryNo || '-',
        month: record.month,
        scholarshipEarned: record.scholarshipEarned,
        pendingDue: standardFee,
        waiverGiven: record.waiverGiven,
        finalDue: finalDue > 0 ? finalDue : 0,
        status: record.status
      };
    });

    return NextResponse.json(formattedRecords);

  } catch (error: any) {
    console.error("Error fetching scholarship records:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
