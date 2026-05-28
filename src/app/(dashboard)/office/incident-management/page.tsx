import IncidentManagementClient from "./IncidentManagementClient";
import { getIncidentsAction, getIncidentMetadataAction } from "@/features/academy/actions/incidentActions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic"; // Bypass Next.js router cache to guarantee fresh logs on reload

export default async function IncidentManagementPage() {
  const session = await getServerSession(authOptions);
  const incidentsRes = await getIncidentsAction();
  const metadataRes = await getIncidentMetadataAction();

  if (!incidentsRes.success) {
    console.error("PAGE_FETCH_ERROR [Incidents]:", incidentsRes.error);
  } else {
    console.log("PAGE_FETCH_SUCCESS [Incidents]:", incidentsRes.data?.length, "records loaded");
  }

  if (!metadataRes.success) {
    console.error("PAGE_FETCH_ERROR [Metadata]:", metadataRes.error);
  } else {
    console.log("PAGE_FETCH_SUCCESS [Metadata]: Loaded", metadataRes.classes?.length, "classes,", metadataRes.teachers?.length, "teachers");
  }

  const initialIncidents = incidentsRes.success ? (incidentsRes.data || []) : [];
  const classesList = metadataRes.success ? (metadataRes.classes || []) : [];
  const teachersList = metadataRes.success ? (metadataRes.teachers || []) : [];

  return (
    <IncidentManagementClient 
      initialIncidents={initialIncidents as any}
      classesList={classesList}
      teachersList={teachersList}
      userRole={session?.user?.role || "OFFICE"}
    />
  );
}
