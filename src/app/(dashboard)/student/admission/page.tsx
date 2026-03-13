import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { studentProfiles, entranceTests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AdmissionForm } from "@/features/admissions/components/AdmissionForm";
import { getAdmissionData } from "@/features/admissions/actions/admissionActions";
import { EntranceTestCard } from "@/features/admissions/components/EntranceTestCard";
import { cn } from "@/lib/utils";

export default async function StudentAdmissionPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  const profile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userId, session.user.id),
  });

  if (!profile || !profile.admissionMetaId) {
    redirect("/student/dashboard");
  }

  const initialDataResult = await getAdmissionData(profile.admissionMetaId, true);
  const initialData = initialDataResult.success ? initialDataResult.data : null;

  return (
    <div className="py-8 max-w-4xl mx-auto px-4">
      <div className={cn(profile.admissionStep >= 10 && "opacity-50 pointer-events-none")}>
        <AdmissionForm 
          admissionId={profile.admissionMetaId} 
          initialData={initialData} 
          maxStep={profile.admissionStep} 
        />
      </div>
    </div>
  );
}
