import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { admissionMeta, homeVisits, inquiries, studentProfiles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ClipboardCheck, AlertCircle } from "lucide-react";
import { OfficeFinalManager } from "./OfficeFinalManager";

export default async function OfficeFinalAdmissionsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OFFICE") redirect("/");

  const rows = await db
    .select({
      admissionMeta: admissionMeta,
      inquiry: inquiries,
      homeVisit: homeVisits,
      studentProfile: studentProfiles,
    })
    .from(admissionMeta)
    .leftJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
    .leftJoin(homeVisits, eq(admissionMeta.id, homeVisits.admissionId))
    .leftJoin(studentProfiles, eq(admissionMeta.id, studentProfiles.admissionMetaId))
    .orderBy(desc(admissionMeta.createdAt));

  const eligibleApplicants = rows
    .map(row => ({
      ...row.admissionMeta,
      inquiry: row.inquiry,
      homeVisit: row.homeVisit,
      studentProfile: row.studentProfile
    }))
    .filter(a => a.homeVisit?.status === "PASS");

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase italic underline decoration-blue-500 decoration-4 underline-offset-8">Final Admission Approvals</h1>
          <p className="text-slate-500 text-sm mt-4 font-medium uppercase tracking-widest">Finalize enrollment and view application fee sources triggers rules.</p>
        </div>
        <div className="bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100 flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <ClipboardCheck size={20} />
            </div>
            <div>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Candidates</p>
                <p className="text-xl font-black text-blue-900 leading-none">{eligibleApplicants.length}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {eligibleApplicants.length === 0 ? (
          <div className="bg-white p-20 rounded-[40px] border border-slate-100 text-center space-y-4">
             <AlertCircle size={48} className="text-slate-200 mx-auto" />
             <p className="text-slate-400 font-bold uppercase tracking-widest">No applicants are ready for final approval yet.</p>
          </div>
        ) : (
          eligibleApplicants.map((applicant) => (
            <OfficeFinalManager 
               key={applicant.id} 
               applicant={applicant} 
            />
          ))
        )}
      </div>
    </div>
  );
}
