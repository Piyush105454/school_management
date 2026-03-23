import { getStudentDetails } from "@/features/scholarship/actions/studentActions";
import StudentProfileClient from "./StudentProfileClient";
import { notFound } from "next/navigation";

export default async function StudentProfilePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  const res = await getStudentDetails(id);

  if (!res.success || !res.data) {
    return notFound();
  }

  return <StudentProfileClient id={id} student={res.data} />;
}
