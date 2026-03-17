import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { studentProfiles, admissionMeta, homeVisits } from "@/db/schema";
import { redirect } from "next/navigation";
import { ClipboardCheck, ShieldAlert } from "lucide-react";
import { ScholarshipToggle } from "./ScholarshipToggle";

export default async function StudentFinalAdmissionPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  const results = await db
    .select({
      profile: studentProfiles,
      admissionMeta: admissionMeta,
    })
    .from(studentProfiles)
    .leftJoin(admissionMeta, eq(studentProfiles.admissionMetaId, admissionMeta.id))
    .where(eq(studentProfiles.userId, session.user.id))
    .limit(1);

  if (!results.length || !results[0].admissionMeta) redirect("/student/dashboard");

  const adm = results[0].admissionMeta;
  
  const visits = await db.select().from(homeVisits).where(eq(homeVisits.admissionId, adm.id)).limit(1);
  const visitPassed = visits[0]?.status === "PASS";

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase italic underline decoration-blue-500 decoration-4 underline-offset-8">Final Admission Option</h1>
        <p className="text-slate-500 text-sm mt-4 font-medium uppercase tracking-widest">Review conditions and confirm your enrollment type.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/20 overflow-hidden p-8 space-y-6">
         <div className="flex items-center gap-4 border-b pb-6 border-slate-50">
            <div className="h-12 w-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <ClipboardCheck size={24} />
            </div>
            <div>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Important</p>
                <h2 className="text-xl font-black text-slate-900 uppercase leading-none">Admission Guidelines</h2>
            </div>
         </div>

         <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <ShieldAlert size={12} /> Necessary Conditions for Continuous Enrollment
            </h4>
            <ul className="space-y-2 text-xs font-bold text-slate-600 list-disc list-inside">
                <li>Minimum 95% attendance is required for the student on active working layouts.</li>
                <li>Mandatory parent visit to the school once per month for progress updates triggers rules.</li>
            </ul>
         </div>

         {!visitPassed && (
            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-100 text-xs font-medium text-center">
               Waiting for Office to Complete the Home Visit details prior to finalizing selections.
            </div>
         )}

         {visitPassed && (
             <ScholarshipToggle admissionId={adm.id} initialApplied={adm.appliedScholarship} />
         )}
      </div>
    </div>
  );
}
