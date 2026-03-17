import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { admissionMeta, studentDocuments, inquiries, studentProfiles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { 
  FileText, 
  AlertCircle,
  CheckCircle,
  Eye,
  Download
} from "lucide-react";
import Link from "next/link";
import ViewDocumentButton from "./components/ViewDocumentButton";


export default async function OfficeDocumentVerificationPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OFFICE") redirect("/");

  const rows = await db
    .select({
      admissionMeta: admissionMeta,
      inquiry: inquiries,
      studentDocuments: studentDocuments,
      studentProfile: studentProfiles,
    })
    .from(admissionMeta)
    .leftJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
    .leftJoin(studentDocuments, eq(admissionMeta.id, studentDocuments.admissionId))
    .leftJoin(studentProfiles, eq(admissionMeta.id, studentProfiles.admissionMetaId))
    .orderBy(desc(admissionMeta.createdAt));

  const applicants = rows
    .map(row => ({
      ...row.admissionMeta,
      inquiry: row.inquiry,
      studentDocuments: row.studentDocuments,
      studentProfile: row.studentProfile
    }))
    .filter(a => 
      (a.studentProfile?.admissionStep ?? 0) >= 10 || a.studentProfile?.isFullyAdmitted
    );

  const withAffidavit = applicants.filter(a => a.studentDocuments?.affidavit);
  const withoutAffidavit = applicants.filter(a => !a.studentDocuments?.affidavit);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase italic underline decoration-blue-500 decoration-4 underline-offset-8">Document Verification</h1>
          <p className="text-slate-500 text-sm mt-4 font-medium uppercase tracking-widest">Review and verify student affidavit documents.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                  <CheckCircle size={20} />
              </div>
              <div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Uploaded</p>
                  <p className="text-xl font-black text-emerald-900 leading-none">{withAffidavit.length}</p>
              </div>
          </div>
          <div className="bg-amber-50 px-6 py-3 rounded-2xl border border-amber-100 flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-600/20">
                  <AlertCircle size={20} />
              </div>
              <div>
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Pending</p>
                  <p className="text-xl font-black text-amber-900 leading-none">{withoutAffidavit.length}</p>
              </div>
          </div>
        </div>
      </div>

      {/* UPLOADED DOCUMENTS */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Documents Uploaded</h2>
        {withAffidavit.length === 0 ? (
          <div className="bg-white p-12 rounded-[32px] border border-slate-100 text-center">
            <FileText size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest">No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {withAffidavit.map((applicant) => (
              <DocumentRow key={applicant.id} applicant={applicant} />
            ))}
          </div>
        )}
      </div>

      {/* PENDING DOCUMENTS */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Pending Upload</h2>
        {withoutAffidavit.length === 0 ? (
          <div className="bg-white p-12 rounded-[32px] border border-slate-100 text-center">
            <CheckCircle size={48} className="text-emerald-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest">All documents uploaded!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {withoutAffidavit.map((applicant) => (
              <PendingRow key={applicant.id} applicant={applicant} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentRow({ applicant }: { applicant: any }) {
  const studentName = applicant.inquiry?.studentName || "Unknown";
  const affidavitUrl = applicant.studentDocuments?.affidavit;

  return (
    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-lg transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{studentName}</h3>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Entry: {applicant.entryNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <ViewDocumentButton url={affidavitUrl || ""} />

          <a
            href={affidavitUrl}
            download
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <Download size={14} /> Download
          </a>
        </div>
      </div>
    </div>
  );
}

function PendingRow({ applicant }: { applicant: any }) {
  const studentName = applicant.inquiry?.studentName || "Unknown";

  return (
    <div className="bg-amber-50 p-6 rounded-[24px] border border-amber-100 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-amber-900 uppercase tracking-tight">{studentName}</h3>
            <p className="text-xs font-medium text-amber-700 uppercase tracking-wider">Entry: {applicant.entryNumber}</p>
          </div>
        </div>
        <span className="px-4 py-2 bg-amber-200 text-amber-800 rounded-lg font-black uppercase tracking-widest text-[10px]">
          Awaiting Upload
        </span>
      </div>
    </div>
  );
}
