import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { studentProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AdmissionForm } from "@/features/admissions/components/AdmissionForm";
import { getAdmissionData } from "@/features/admissions/actions/admissionActions";

export default async function StudentAdmissionPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  const profile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userId, session.user.id),
  });

  if (!profile || !profile.admissionMetaId) {
    redirect("/student/dashboard");
  }

  const initialDataResult = await getAdmissionData(profile.admissionMetaId);
  const initialData = initialDataResult.success ? initialDataResult.data : null;

  return (
    <div className="py-8">
      <AdmissionForm 
        admissionId={profile.admissionMetaId} 
        initialData={initialData} 
        maxStep={profile.admissionStep} 
      />
    </div>
  );
}
