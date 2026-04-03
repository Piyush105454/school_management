import React from "react";
import { db } from "@/db";
import { inquiries, admissionMeta, studentProfiles } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { AdmissionsManager } from "@/features/admissions/components/AdmissionsManager";

export const dynamic = "force-dynamic";

export default async function AdmissionsProgressPage() {
  const allAdmissions = await db.query.admissionMeta.findMany({
    with: {
      inquiry: true,
      entranceTest: true,
      homeVisit: true,
    },
    orderBy: [desc(admissionMeta.createdAt)],
  });

  const admissionsWithDetail = await Promise.all(allAdmissions.map(async (adm) => {
    const profile = await db.query.studentProfiles.findFirst({
        where: eq(studentProfiles.admissionMetaId, adm.id),
        with: {
          user: true
        }
    });
    return {
        ...adm,
        profile
    };
  }));

  return (
    <AdmissionsManager admissions={admissionsWithDetail} />
  );
}
