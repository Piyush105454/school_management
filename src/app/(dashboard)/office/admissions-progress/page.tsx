import React from "react";
import { db } from "@/db";
import { inquiries, admissionMeta, studentProfiles } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { AdmissionsManager } from "@/features/admissions/components/AdmissionsManager";

export const dynamic = "force-dynamic";

import { protectRoute } from "@/lib/roleGuard";

export default async function AdmissionsProgressPage() {
  const session = await protectRoute(["OFFICE", "TEACHER"]);
  const role = session.user?.role;
  
  // Re-fetch with everything joined to be safe and fast (single roundtrip)
  let filter = undefined;
  if (role === "TEACHER") {
    const teacherProfile = await db.query.teachers.findFirst({
      where: (t, { eq }) => eq(t.userId, session.user.id)
    });
    if (teacherProfile?.institute) {
      // Find inquiries for this institute
      const inqIds = await db.query.inquiries.findMany({
        where: (inq, { eq }) => eq(inq.school, teacherProfile.institute!),
        columns: { id: true }
      });
      const ids = inqIds.map(i => i.id);
      
      // If no inquiries found for this institute, return empty early to avoid query errors
      if (ids.length === 0) {
        return (
          <AdmissionsManager 
            admissions={[]} 
            role={role as any}
          />
        );
      }
      
      filter = (meta: any, { inArray }: any) => inArray(meta.inquiryId, ids);
    }
  }

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
    where: filter,
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
