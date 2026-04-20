import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { studentProfiles, studentDocuments, admissionMeta, inquiries, documentChecklists } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { DocumentVerificationCard } from "@/features/admissions/components/DocumentVerificationCard";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

export default async function StudentDocumentVerificationPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  // OPTIMIZED QUERY: We join everything, but we do NOT fetch the heavy 'affidavit' base64 string here.
  // Instead, we fetch it only when the user needs to view/download it.
  const profileResults = await db
    .select({
      profile: {
        id: studentProfiles.id,
        admissionMetaId: studentProfiles.admissionMetaId,
        admissionStep: studentProfiles.admissionStep,
      },
      admissionMeta: {
        officeRemarks: admissionMeta.officeRemarks,
      },
      inquiry: {
        studentName: inquiries.studentName,
      },
      documents: {
        id: studentDocuments.id,
        // We only check if the affidavit EXISTS, we don't fetch the 6MB string yet.
        hasAffidavit: sql<boolean>`CASE WHEN ${studentDocuments.affidavit} IS NOT NULL THEN true ELSE false END`,
      },
      checklist: documentChecklists,
    })
    .from(studentProfiles)
    .leftJoin(admissionMeta, eq(studentProfiles.admissionMetaId, admissionMeta.id))
    .leftJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
    .leftJoin(studentDocuments, eq(admissionMeta.id, studentDocuments.admissionId))
    .leftJoin(documentChecklists, eq(admissionMeta.id, documentChecklists.admissionId))
    .where(eq(studentProfiles.userId, session.user.id))
    .limit(1);

  if (!profileResults.length || !profileResults[0].profile.admissionMetaId) {
    redirect("/student/dashboard");
  }

  const result = profileResults[0];
  
  // Transform the simplified doc object for the component
  const docData = result.documents ? { 
    id: result.documents.id, 
    affidavit: result.documents.hasAffidavit ? "PRESENT" : null // Just a flag
  } : null;

  const checklistData = result.checklist;
  const studentName = result.inquiry?.studentName || "Student";
  const admissionId = result.profile.admissionMetaId!;

  return (
    <div className="py-8 max-w-3xl mx-auto px-4 space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
         <Link href="/student/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold uppercase tracking-widest text-[10px] transition-colors">
            <ArrowLeft size={16} /> Back to Dashboard
         </Link>
         <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase italic underline decoration-blue-500 decoration-3 underline-offset-4 font-outfit">Document Verification</h1>
      </div>

      <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100 flex items-start gap-4 shadow-sm">
        <FileText className="text-blue-500 shrink-0 mt-1" size={24} />
        <div className="space-y-1">
           <p className="text-sm font-black text-blue-900 uppercase tracking-tight">Upload Required Documents</p>
           <p className="text-xs font-medium text-blue-700 leading-relaxed uppercase tracking-wider">
              Please download the application form from your admission form and upload the affidavit document below.
           </p>
        </div>
      </div>

      <DocumentVerificationCard 
        docData={docData} 
        checklistData={checklistData}
        admissionId={admissionId}
        studentName={studentName} 
        officeRemarks={result.admissionMeta?.officeRemarks}
        admissionStep={result.profile.admissionStep}
      />
    </div>
  );
}
