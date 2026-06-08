import { protectRoute } from "@/lib/roleGuard";
import { getAdmittedStudents } from "@/features/scholarship/actions/studentActions";
import AwardClient from "./AwardClient";

export default async function AwardScholarshipPage() {
  await protectRoute(["OFFICE"], "/office/scholarship/award");

  const res = await getAdmittedStudents();
  const students = res.success ? res.data : [];

  return <AwardClient students={students || []} />;
}
