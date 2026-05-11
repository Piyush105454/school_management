export const dynamic = "force-dynamic";
import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { admissionMeta, studentDocuments, inquiries, studentProfiles, teachers } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { 
  FileText, 
  AlertCircle,
  CheckCircle,
  Eye,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { DocumentVerificationDashboard } from "@/features/admissions/components/DocumentVerificationDashboard";

export default async function OfficeDocumentVerificationPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "OFFICE" && session.user.role !== "TEACHER")) redirect("/");

  let teacherInstitute = "";
  if (session.user.role === "TEACHER") {
    const teacherProfile = await db.query.teachers.findFirst({
      where: (t, { eq }) => eq(t.userId, session.user.id)
    });
    teacherInstitute = teacherProfile?.institute || "";
  }

  const rows = await db
    .select({
      admissionMeta: admissionMeta,
      inquiry: inquiries,
      studentDocuments: studentDocuments,
      studentProfile: studentProfiles,
    })
    .from(admissionMeta)
    .leftJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
    .leftJoin(studentDocuments, eq(admissionMeta.id, studentDocuments.admissionId))
    .leftJoin(studentProfiles, eq(admissionMeta.id, studentProfiles.admissionMetaId))
    .where(teacherInstitute ? eq(inquiries.school, teacherInstitute) : undefined)
    .orderBy(desc(admissionMeta.createdAt));

  const applicants = rows
    .map(row => ({
      ...row.admissionMeta,
      inquiry: row.inquiry,
      studentDocuments: row.studentDocuments,
      studentProfile: row.studentProfile
    }))
    .filter(a => 
      (a.studentProfile?.admissionStep ?? 0) >= 10 || a.studentProfile?.isFullyAdmitted
    );

  return (
    <div className="animate-in fade-in duration-700">
      <DocumentVerificationDashboard applicants={applicants} />
    </div>
  );
}
