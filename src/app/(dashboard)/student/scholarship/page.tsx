import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { studentProfiles } from "@/db/schema";
import { redirect } from "next/navigation";
import ScholarshipClient from "./ScholarshipClient";

export default async function StudentScholarshipPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  const profile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userId, session.user.id),
    with: {
      admissionMeta: true
    }
  });

  if (!profile || !profile.admissionMetaId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">No Profile Found</h2>
      </div>
    );
  }

  return (
    <ScholarshipClient 
      admissionId={profile.admissionMetaId} 
      isScholarshipAwarded={profile.admissionMeta?.awardedScholarship ?? false} 
    />
  );
}
