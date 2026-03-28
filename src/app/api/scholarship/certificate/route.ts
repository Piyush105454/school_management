import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { studentProfiles, admissionMeta, inquiries } from "@/db/schema";
import { generateScholarshipCertificate } from "@/features/scholarship/utils/generateScholarshipCertificate";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get student profile and scholarship info
    const results = await db
      .select({
        studentName: inquiries.studentName,
        awardedScholarship: admissionMeta.awardedScholarship,
      })
      .from(studentProfiles)
      .leftJoin(admissionMeta, eq(studentProfiles.admissionMetaId, admissionMeta.id))
      .leftJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
      .where(eq(studentProfiles.userId, session.user.id))
      .limit(1);

    if (!results.length) {
      return new NextResponse("Student profile not found", { status: 404 });
    }

    const { studentName, awardedScholarship } = results[0];

    if (!awardedScholarship) {
      return new NextResponse("Scholarship not awarded", { status: 403 });
    }

    const pdfBytes = await generateScholarshipCertificate(studentName || "Student");

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
