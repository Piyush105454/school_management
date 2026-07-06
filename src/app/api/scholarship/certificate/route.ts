import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { studentProfiles, admissionMeta, inquiries, scholarshipRecords } from "@/db/schema";
import { generateScholarshipCertificate } from "@/features/scholarship/utils/generateScholarshipCertificate";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const queryMonth = searchParams.get("month");
    const queryYear = searchParams.get("year");

    // Get student profile and scholarship info
    const studentInfo = await db
      .select({
        studentName: inquiries.studentName,
        awardedScholarship: admissionMeta.awardedScholarship,
        admissionId: admissionMeta.id
      })
      .from(studentProfiles)
      .leftJoin(admissionMeta, eq(studentProfiles.admissionMetaId, admissionMeta.id))
      .leftJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
      .where(eq(studentProfiles.userId, session.user.id))
      .limit(1);

    if (!studentInfo.length) {
      return new NextResponse("Student profile not found", { status: 404 });
    }

    const { studentName, awardedScholarship, admissionId } = studentInfo[0];

    if (!awardedScholarship) {
      return new NextResponse("Scholarship not awarded", { status: 403 });
    }

    // Resolve which monthly scholarship record to print
    let record = null;

    if (queryMonth && queryYear && admissionId) {
      record = await db.query.scholarshipRecords.findFirst({
        where: and(
          eq(scholarshipRecords.admissionId, admissionId),
          eq(scholarshipRecords.month, queryMonth),
          eq(scholarshipRecords.year, queryYear)
        )
      });
    }

    // Fallback: search for the latest record for this student if no month/year provided or found
    if (!record && admissionId) {
      record = await db.query.scholarshipRecords.findFirst({
        where: eq(scholarshipRecords.admissionId, admissionId),
        orderBy: [desc(scholarshipRecords.createdAt)]
      });
    }

    const amount = record ? record.totalAmount : 0;
    const certMonth = record ? record.month : (queryMonth || "Month");
    const certYear = record ? record.year : (queryYear || "Year");

    const pdfBytes = await generateScholarshipCertificate(
      studentName || "Student",
      amount,
      certMonth,
      certYear
    );

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Scholarship_Certificate_${(studentName || "Student").replace(/\s+/g, "_")}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Certificate generation error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
