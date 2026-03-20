import React from "react";
import { getAdmissionsForList } from "@/features/admissions/actions/admissionActions";
import { ApplicationsClient } from "@/features/admissions/components/ApplicationsClient";

export const dynamic = "force-dynamic";

export default async function OfficeApplicationsPage() {
  const result = await getAdmissionsForList();
  const admissions = result.success ? result.data : [];

  return (
    <ApplicationsClient admissions={admissions} />
  );
}
