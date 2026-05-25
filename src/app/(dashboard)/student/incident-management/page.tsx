import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { studentProfiles } from "@/db/schema";
import { redirect } from "next/navigation";
import StudentIncidentClient from "./StudentIncidentClient";

export const dynamic = "force-dynamic";

export default async function StudentIncidentPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  const results = await db
    .select({
      id: studentProfiles.admissionMetaId,
    })
    .from(studentProfiles)
    .where(eq(studentProfiles.userId, session.user.id))
    .limit(1);

  if (!results.length || !results[0].id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">No student profile registered.</h2>
      </div>
    );
  }

  return <StudentIncidentClient admissionId={results[0].id} />;
}
