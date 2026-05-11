import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { admissionMeta, entranceTests, inquiries, studentProfiles, teachers } from "@/db/schema";
import { eq, desc, and, or, isNotNull, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { 
  ClipboardCheck, 
  Search, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { OfficeTestManager } from "@/features/admissions/components/OfficeTestManager";
import { EntranceTestDashboard } from "@/features/admissions/components/EntranceTestDashboard";
import { protectRoute } from "@/lib/roleGuard";

export default async function OfficeEntranceTestsPage({
  searchParams,
}: {
  searchParams: Promise<{ institute?: string }>;
}) {
  const { institute: selectedInstitute } = await searchParams;
  await protectRoute(["OFFICE", "TEACHER"]);
  
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "OFFICE" && session.user.role !== "TEACHER")) redirect("/");

  let teacherInstitute = "";
  if (session.user.role === "TEACHER") {
    const teacherProfile = await db.query.teachers.findFirst({
      where: (t, { eq }) => eq(t.userId, session.user.id)
    });
    teacherInstitute = teacherProfile?.institute || "";
  }

  // Use standard join for better stability with Neon pooler/Drizzle 0.45
  const rows = await db
    .select({
      admissionMeta: admissionMeta,
      inquiry: inquiries,
      entranceTest: entranceTests,
      studentProfile: studentProfiles,
    })
    .from(admissionMeta)
    .leftJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
    .leftJoin(entranceTests, eq(admissionMeta.id, entranceTests.admissionId))
    .leftJoin(studentProfiles, eq(admissionMeta.id, studentProfiles.admissionMetaId))
    .where(
      (() => {
        const conditions = [];
        // Admin Global Filter
        if (selectedInstitute && selectedInstitute !== "ALL") {
          conditions.push(eq(sql`lower(${inquiries.school})`, selectedInstitute.toLowerCase()));
        }
        // Teacher Restriction
        if (teacherInstitute) {
          conditions.push(eq(inquiries.school, teacherInstitute));
        }
        return conditions.length > 0 ? and(...conditions) : undefined;
      })()
    )
    .orderBy(desc(admissionMeta.createdAt));

  const teachersList = await db.select().from(teachers).orderBy(teachers.name);

  // Map result to a more usable structure and filter
  const eligibleApplicants = rows
    .map(row => ({
      ...row.admissionMeta,
      inquiry: row.inquiry,
      entranceTest: row.entranceTest,
      studentProfile: row.studentProfile
    }))
    .filter(a => 
      (a.studentProfile?.admissionStep ?? 0) >= 10 || a.studentProfile?.isFullyAdmitted
    );

  return (
    <div className="animate-in fade-in duration-700">
      <EntranceTestDashboard 
        applicants={eligibleApplicants} 
        teachers={teachersList} 
      />
    </div>
  );
}
