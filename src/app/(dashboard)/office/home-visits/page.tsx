import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { admissionMeta, homeVisits, inquiries, studentProfiles, entranceTests, teachers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { 
  Users, 
  AlertCircle
} from "lucide-react";
import { OfficeHomeVisitManager } from "./OfficeHomeVisitManager";

export default async function OfficeHomeVisitsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "OFFICE" && session.user.role !== "TEACHER")) redirect("/");

  const rows = await db
    .select({
      admissionMeta: admissionMeta,
      inquiry: inquiries,
      homeVisit: {
        id: homeVisits.id,
        admissionId: homeVisits.admissionId,
        visitDate: homeVisits.visitDate,
        visitTime: homeVisits.visitTime,
        teacherName: homeVisits.teacherName,
        remarks: homeVisits.remarks,
        status: homeVisits.status,
        createdAt: homeVisits.createdAt,
        updatedAt: homeVisits.updatedAt,
      },
      studentProfile: studentProfiles,
      entranceTest: entranceTests,
    })
    .from(admissionMeta)
    .leftJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
    .leftJoin(homeVisits, eq(admissionMeta.id, homeVisits.admissionId))
    .leftJoin(studentProfiles, eq(admissionMeta.id, studentProfiles.admissionMetaId))
    .leftJoin(entranceTests, eq(admissionMeta.id, entranceTests.admissionId))
    .orderBy(desc(admissionMeta.createdAt));

  const teachersList = await db.select().from(teachers).orderBy(teachers.name);

  const eligibleApplicants = rows
    .map(row => ({
      ...row.admissionMeta,
      inquiry: row.inquiry,
      homeVisit: row.homeVisit,
      studentProfile: row.studentProfile,
      entranceTest: row.entranceTest
    }))
    .filter(a => 
      a.entranceTest?.status === "PASS" || (a.studentProfile?.admissionStep ?? 0) >= 10
    );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase italic underline decoration-blue-500 decoration-4 underline-offset-8">Home Visit Management</h1>
          <p className="text-slate-500 text-sm mt-4 font-medium uppercase tracking-widest">Schedule and manage home visits for approved applicants.</p>
        </div>
        <div className="bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100 flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Users size={20} />
            </div>
            <div>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Eligible Applicants</p>
                <p className="text-xl font-black text-blue-900 leading-none">{eligibleApplicants.length}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {eligibleApplicants.length === 0 ? (
          <div className="bg-white p-20 rounded-[40px] border border-slate-100 text-center space-y-4">
             <AlertCircle size={48} className="text-slate-200 mx-auto" />
             <p className="text-slate-400 font-bold uppercase tracking-widest">No applicants eligible for home visit yet.</p>
          </div>
        ) : (
          eligibleApplicants.map((applicant) => (
            <OfficeHomeVisitManager 
               key={applicant.id} 
               applicant={applicant} 
               teachers={teachersList}
            />
          ))
        )}
      </div>
    </div>
  );
}
