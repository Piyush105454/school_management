import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { admissionMeta, homeVisits, inquiries, studentProfiles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ClipboardCheck, AlertCircle } from "lucide-react";
import { FinalAdmissionDashboard } from "./FinalAdmissionDashboard";

export default async function OfficeFinalAdmissionsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OFFICE") redirect("/");

  const rows = await db
    .select({
      admissionMeta: admissionMeta,
      inquiry: inquiries,
      homeVisit: homeVisits,
      studentProfile: studentProfiles,
    })
    .from(admissionMeta)
    .leftJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
    .leftJoin(homeVisits, eq(admissionMeta.id, homeVisits.admissionId))
    .leftJoin(studentProfiles, eq(admissionMeta.id, studentProfiles.admissionMetaId))
    .orderBy(desc(admissionMeta.createdAt));

  const eligibleApplicants = rows
    .map(row => ({
      ...row.admissionMeta,
      inquiry: row.inquiry,
      homeVisit: row.homeVisit,
      studentProfile: row.studentProfile
    }))
    .filter(a => a.homeVisit?.status === "PASS");

  return (
    <div className="animate-in fade-in duration-700">
      <FinalAdmissionDashboard applicants={eligibleApplicants} />
    </div>
  );
}
