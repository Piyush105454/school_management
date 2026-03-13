import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { studentProfiles, entranceTests, admissionMeta, inquiries } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { EntranceTestCard } from "@/features/admissions/components/EntranceTestCard";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function StudentEntranceTestPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  // Use standard join for stability with Neon pooler/Drizzle 0.45
  const profileResults = await db
    .select({
      profile: studentProfiles,
      admissionMeta: admissionMeta,
      inquiry: inquiries,
    })
    .from(studentProfiles)
    .leftJoin(admissionMeta, eq(studentProfiles.admissionMetaId, admissionMeta.id))
    .leftJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
    .where(eq(studentProfiles.userId, session.user.id))
    .limit(1);

  if (!profileResults.length || !profileResults[0].profile.admissionMetaId) {
    redirect("/student/dashboard");
  }

  const result = profileResults[0];
  const profile = {
    ...result.profile,
    admissionMeta: result.admissionMeta ? {
      ...result.admissionMeta,
      inquiry: result.inquiry,
    } : null
  };

  const testResults = await db
    .select()
    .from(entranceTests)
    .where(eq(entranceTests.admissionId, profile.admissionMetaId!))
    .limit(1);
    
  const testData = testResults[0] || null;

  const studentName = (profile as any).admissionMeta?.inquiry?.studentName || "Student";

  return (
    <div className="py-8 max-w-3xl mx-auto px-4 space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
         <Link href="/student/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold uppercase tracking-widest text-[10px] transition-colors">
            <ArrowLeft size={16} /> Back to Dashboard
         </Link>
         <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase italic underline decoration-blue-500 decoration-3 underline-offset-4 font-outfit">Entrance Test Details</h1>
      </div>

      {profile.admissionStep < 10 && !profile.isFullyAdmitted && (
         <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 flex items-start gap-4 shadow-sm">
            <AlertCircle className="text-amber-500 shrink-0 mt-1" size={24} />
            <div className="space-y-1">
               <p className="text-sm font-black text-amber-900 uppercase tracking-tight">Form Submission Required</p>
               <p className="text-xs font-medium text-amber-700 leading-relaxed uppercase tracking-wider">
                  You must complete and submit your admission form (Step 10) before the school can schedule your entrance test.
               </p>
               <Link href="/student/admission" className="inline-block mt-3 text-[10px] font-black bg-amber-200 text-amber-800 px-4 py-2 rounded-xl hover:bg-amber-300 transition-colors uppercase tracking-widest">
                  COMPLETE FORM NOW
               </Link>
            </div>
         </div>
      )}

      <EntranceTestCard 
        testData={testData} 
        studentName={studentName} 
      />
      
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
         <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Entrance Exam Guidelines</h3>
         <div className="space-y-4">
            <Guideline title="Reporting Time" description="Please report to the school premises at least 15 minutes prior to the scheduled test time." />
            <Guideline title="Required Stationery" description="Bring your own blue/black ballpoint pens, pencils, and an eraser. The school will provide the answer sheets." />
            <Guideline title="Dress Code" description="Wear comfortable, formal or semi-formal attire. No school uniform is required for the entrance test." />
            <Guideline title="Document Verification" description="Bring original copies of your Birth Certificate and Aadhaar Card for spot verification." />
         </div>
      </div>
    </div>
  );
}

function Guideline({ title, description }: { title: string, description: string }) {
    return (
        <div className="flex items-start gap-4">
            <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 shrink-0" />
            <div className="space-y-0.5">
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{title}</p>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider leading-relaxed">{description}</p>
            </div>
        </div>
    );
}
