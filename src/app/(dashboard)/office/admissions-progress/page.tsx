import React from "react";
import { db } from "@/db";
import { inquiries, admissionMeta, studentProfiles } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { AdmissionsManager } from "@/features/admissions/components/AdmissionsManager";

export const dynamic = "force-dynamic";

import { protectRoute } from "@/lib/roleGuard";

export default async function AdmissionsProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ institute?: string }>;
}) {
  const { institute: selectedInstitute } = await searchParams;
  const session = await protectRoute(["OFFICE", "TEACHER"]);
  const role = session.user?.role;
  
  // Filter logic
  let filterInquiryIds: string[] | undefined = undefined;

  // 1. Get institute to filter by
  let targetInstitute = selectedInstitute && selectedInstitute !== "ALL" ? selectedInstitute : null;

  // 2. If teacher, override or intersect with their assigned institute
  if (role === "TEACHER") {
    const teacherProfile = await db.query.teachers.findFirst({
      where: (t, { eq }) => eq(t.userId, session.user.id)
    });
    if (teacherProfile?.institute) {
      targetInstitute = teacherProfile.institute;
    }
  }

  // 3. Resolve inquiry IDs if an institute filter is active
  if (targetInstitute) {
    const inqIds = await db.query.inquiries.findMany({
      where: (inq, { eq, sql }) => eq(sql`lower(${inq.school})`, targetInstitute!.toLowerCase()),
      columns: { id: true }
    });
    filterInquiryIds = inqIds.map(i => i.id);
    
    // If an institute was specified but no inquiries exist, return empty
    if (filterInquiryIds.length === 0) {
      return <AdmissionsManager admissions={[]} role={role as any} />;
    }
  }

  const queryFilter = filterInquiryIds 
    ? (meta: any, { inArray }: any) => inArray(meta.inquiryId, filterInquiryIds!)
    : undefined;

  const fullResults = await db.query.admissionMeta.findMany({
    with: {
      inquiry: true,
      entranceTest: true,
      homeVisit: true,
      documentChecklists: true,
      studentProfile: {
        with: {
          user: true
        }
      },
      academyStudent: true
    },
    where: queryFilter,
    orderBy: [desc(admissionMeta.createdAt)],
  });

  // Map studentProfile to profile for the component to consume correctly
  const mappedResults = fullResults.map(adm => ({
    ...adm,
    profile: adm.studentProfile
  }));

  return (
    <AdmissionsManager 
      admissions={mappedResults} 
      role={role as any}
    />
  );
}
