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
      }
    },
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
