import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { redirect } from "next/navigation";
import TeacherIncidentClient from "./TeacherIncidentClient";

export const dynamic = "force-dynamic";

export default async function TeacherIncidentPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  const teacher = await db.query.teachers.findFirst({
    where: (t, { eq }) => eq(t.userId, session.user.id)
  });

  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">No teacher profile registered.</h2>
      </div>
    );
  }

  return <TeacherIncidentClient teacherId={teacher.id} />;
}
