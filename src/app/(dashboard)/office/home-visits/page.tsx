import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { admissionMeta, homeVisits, inquiries, studentProfiles, entranceTests, teachers } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { 
  Users, 
  AlertCircle
} from "lucide-react";
import { OfficeHomeVisitManager } from "@/features/admissions/components/OfficeHomeVisitManager";
import { HomeVisitDashboard } from "@/features/admissions/components/HomeVisitDashboard";

export default async function OfficeHomeVisitsPage({
  searchParams,
}: {
  searchParams: Promise<{ institute?: string }>;
}) {
  const { institute: selectedInstitute } = await searchParams;
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
      homeVisit: {
        id: homeVisits.id,
        admissionId: homeVisits.admissionId,
        visitDate: homeVisits.visitDate,
        visitTime: homeVisits.visitTime,
        teacherName: homeVisits.teacherName,
        remarks: homeVisits.remarks,
        visitImage: homeVisits.visitImage,
        homePhoto: homeVisits.homePhoto,
        status: homeVisits.status,
        createdAt: homeVisits.createdAt,
        updatedAt: homeVisits.updatedAt,
      },
      studentProfile: studentProfiles,
      entranceTest: entranceTests,
    })
    .from(admissionMeta)
    .leftJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
    .leftJoin(homeVisits, eq(admissionMeta.id, homeVisits.admissionId))
    .leftJoin(studentProfiles, eq(admissionMeta.id, studentProfiles.admissionMetaId))
    .leftJoin(entranceTests, eq(admissionMeta.id, entranceTests.admissionId))
    .where(
      (() => {
        const conditions = [];
        if (selectedInstitute && selectedInstitute !== "ALL") {
          conditions.push(eq(sql`lower(${inquiries.school})`, selectedInstitute.toLowerCase()));
        }
        if (teacherInstitute) {
          conditions.push(eq(inquiries.school, teacherInstitute));
        }
        return conditions.length > 0 ? (conditions.length > 1 ? and(...conditions) : conditions[0]) : undefined;
      })()
    )
    .orderBy(desc(admissionMeta.createdAt));

  const teachersList = await db.select().from(teachers).orderBy(teachers.name);

  const eligibleApplicants = rows
    .map(row => ({
      ...row.admissionMeta,
      inquiry: row.inquiry,
      homeVisit: row.homeVisit,
      studentProfile: row.studentProfile,
      entranceTest: row.entranceTest
    }))
    .filter(a => 
      a.entranceTest?.status === "PASS" || (a.studentProfile?.admissionStep ?? 0) >= 10
    );

  return (
    <div className="animate-in fade-in duration-700">
      <HomeVisitDashboard 
        applicants={eligibleApplicants} 
        teachers={teachersList} 
      />
    </div>
  );
}
