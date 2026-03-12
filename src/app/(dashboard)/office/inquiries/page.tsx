import React from "react";
import { db } from "@/db";
import { inquiries, admissionMeta, studentProfiles } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { InquiriesManagementClient } from "@/features/admissions/components/InquiriesManagementClient";

export const dynamic = "force-dynamic";

export default async function OfficeInquiriesPage() {
  const allInquiries = await db.query.inquiries.findMany({
    orderBy: [desc(inquiries.createdAt)],
  });

  const allAdmissions = await db.query.admissionMeta.findMany({
    with: {
      inquiry: true,
    },
    orderBy: [desc(admissionMeta.createdAt)],
  });

  // Fetch steps from studentProfiles separately or via relation if defined
  // For now, let's just use the metadata.
  
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
    <InquiriesManagementClient 
      allInquiries={allInquiries} 
      allAdmissions={admissionsWithDetail} 
    />
  );
}
