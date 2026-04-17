import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { admissionMeta } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { OfficeAdmissionForm } from "@/features/admissions/components/OfficeAdmissionForm";
import { getAdmissionData } from "@/features/admissions/actions/admissionActions";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function AdminAdmissionViewPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ step?: string }> }) {
  const { step } = await searchParams;
  const stepParam = step ? parseInt(step) : undefined;
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "OFFICE" && session.user.role !== "TEACHER")) redirect("/");

  const { id: admissionId } = await params;

  const admission = await db.query.admissionMeta.findFirst({
    where: eq(admissionMeta.id, admissionId),
    with: {
      inquiry: true,
      studentProfile: true
    }
  });

  if (!admission) {
    notFound();
  }

  const initialDataResult = await getAdmissionData(admissionId, true);
  const initialData = initialDataResult.success ? initialDataResult.data : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-4">
        <Link 
          href="/office/inquiries?tab=admissions" 
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm"
        >
          <ChevronLeft size={20} /> Back to Admissions
        </Link>
        <div className="text-right">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Office Application Review</p>
          <div className="flex flex-col items-end">
            <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
              {(admission as any).inquiry?.studentName}
            </p>
            <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md mt-1 italic">
              Applied Class: {(admission as any).inquiry?.appliedClass || "N/A"}
            </p>
          </div>
        </div>
      </div>

      <OfficeAdmissionForm 
        admissionId={admissionId} 
        initialData={initialData} 
        maxStep={(admission as any).studentProfile?.admissionStep || 1} 
        initialStep={stepParam}
      />
    </div>
  );
}
