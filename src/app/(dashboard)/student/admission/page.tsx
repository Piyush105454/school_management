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
    with: {
      admissionMeta: {
        with: {
          inquiry: true
        }
      }
    }
  });

  if (!profile || !profile.admissionMetaId) {
    redirect("/student/dashboard");
  }

  const initialDataResult = await getAdmissionData(profile.admissionMetaId, true);
  const initialData = initialDataResult.success ? initialDataResult.data : null;

  return (
    <div className="py-8 max-w-4xl mx-auto px-4 space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Admission Application</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Status: {profile.admissionStep >= 10 ? "Submitted" : "In Progress"}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-tighter inline-block">
            Applied Class: {(profile as any).admissionMeta?.inquiry?.appliedClass || "N/A"}
          </p>
        </div>
      </div>

      <div>
        <AdmissionForm 
          admissionId={profile.admissionMetaId} 
          initialData={initialData} 
          maxStep={profile.admissionStep} 
        />
      </div>
    </div>
  );
}
