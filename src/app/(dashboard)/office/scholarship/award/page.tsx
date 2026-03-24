import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAdmittedStudents } from "@/features/scholarship/actions/studentActions";
import AwardClient from "./AwardClient";

export default async function AwardScholarshipPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OFFICE") redirect("/");

  const res = await getAdmittedStudents();
  const students = res.success ? res.data : [];

  return <AwardClient students={students || []} />;
}
