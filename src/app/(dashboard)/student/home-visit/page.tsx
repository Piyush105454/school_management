import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { studentProfiles, homeVisits, admissionMeta } from "@/db/schema";
import { redirect } from "next/navigation";
import { Users, Calendar, Clock, UserCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function StudentHomeVisitPage() {
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

  const admissionId = results[0].admissionMeta.id;

  const visitResults = await db
    .select()
    .from(homeVisits)
    .where(eq(homeVisits.admissionId, admissionId))
    .limit(1);

  const visitData = visitResults[0] || null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase italic underline decoration-blue-500 decoration-4 underline-offset-8">Home Visit Detail</h1>
        <p className="text-slate-500 text-sm mt-4 font-medium uppercase tracking-widest">Track and view schedule details of your school faculty visit.</p>
      </div>

      {!visitData ? (
        <div className="bg-white p-20 rounded-[40px] border border-slate-100 text-center space-y-4 shadow-xl shadow-slate-100/30">
           <AlertCircle size={48} className="text-slate-300 mx-auto" />
           <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Waiting for office to update your home visit schedule.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/20 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Users size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Current Stage</p>
                <h2 className="text-xl font-black text-slate-900 uppercase">Home Visitation</h2>
              </div>
            </div>
            <span className={cn(
              "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest",
              visitData.status === "PASS" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
              "bg-blue-100 text-blue-700 border border-blue-200"
            )}>
              {visitData.status === "PASS" ? "Completed" : "Scheduled"}
            </span>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-400">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visit Date</p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{visitData.visitDate || "TBA"}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-400">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visit Time</p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{visitData.visitTime || "TBA"}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-400">
                  <UserCheck size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Teacher</p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{visitData.teacherName || "Assigned Shortly"}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4 flex flex-col justify-center">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 Remarks / Status
              </h4>
              <p className="text-sm text-slate-600 font-medium italic">
                {visitData.remarks || "No remarks loaded for this visit layout yet."}
              </p>
              {visitData.visitImage && (
                <div className="mt-4 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <img src={visitData.visitImage} alt="Visit Report" className="h-48 w-full object-cover" />
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
