import { 
  GraduationCap, 
  MapPin, 
  CreditCard, 
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  MapPinned,
  BookOpen,
  Users,
  Banknote,
  ClipboardList,
  ArrowRight,
  Award
} from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { studentProfiles, admissionMeta, entranceTests, inquiries, documentChecklists, homeVisits, declarations } from "@/db/schema";

import { redirect } from "next/navigation";
import { formatDate, formatTime } from "@/lib/utils";
import { EntranceTestCard } from "@/features/admissions/components/EntranceTestCard";
import { protectRoute } from "@/lib/roleGuard";
import { getComputedStep } from "@/features/admissions/utils/admissionSteps";

export default async function StudentDashboard() {
  // Protect this route - only STUDENT_PARENT role can access
  await protectRoute(["STUDENT_PARENT"]);

  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  // Optimized: Break monolithic 5-way join into focused parallel queries
  // This prevents the slow join that was causing timeouts (11s render time)
  const coreProfile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userId, session.user.id),
    with: {
      admissionMeta: {
        with: {
          inquiry: true
        }
      }
    }
  });

  if (!coreProfile) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
            <AlertCircle size={48} className="text-slate-300" />
            <h2 className="text-2xl font-bold text-slate-900">No Profile Found</h2>
            <p className="text-slate-500">Your student profile hasn't been initialized yet. Please contact support.</p>
        </div>
    );
  }

  const admissionId = coreProfile.admissionMetaId;

  // Parallel fetch ancillary data - extremely efficient with unique indexed admissionId
  const [checklist, test, visit, declaration] = admissionId ? await Promise.all([
    db.query.documentChecklists.findFirst({ where: eq(documentChecklists.admissionId, admissionId) }),
    db.query.entranceTests.findFirst({ where: eq(entranceTests.admissionId, admissionId) }),
    db.query.homeVisits.findFirst({ where: eq(homeVisits.admissionId, admissionId) }),
    db.query.declarations.findFirst({ where: eq(declarations.admissionId, admissionId) })
  ]) : [null, null, null, null];
  
  // Reconstruct profile object to match existing UI logic
  const profile = {
    ...coreProfile,
    admissionMeta: coreProfile.admissionMeta ? {
      ...coreProfile.admissionMeta,
      documentChecklists: checklist,
      entranceTest: test,
      homeVisit: visit,
      declarations: declaration
    } : null
  };

  const studentName = (profile as any).admissionMeta?.inquiry?.studentName || "Student";
  const entryNumber = (profile as any).admissionMeta?.entryNumber || "N/A";
  const currentStep = profile.admissionStep;

  const testData = (profile as any).admissionMeta?.entranceTest || null;
  const visitData = (profile as any).admissionMeta?.homeVisit || null;


  // --- SYNCHRONIZED SEQUENTIAL LOGIC ---
  const computedStep = getComputedStep(profile);
  
  const hasDocRemark = !!(profile as any).admissionMeta?.documentRemarks;
  const hasOfficeRemark = !!(profile as any).admissionMeta?.officeRemarks;
  const hasDeclaration = !!declaration || hasDocRemark || hasOfficeRemark;

  const isFormDone = computedStep >= 10 || hasDeclaration;
  const isVerified = computedStep >= 12 || (checklist?.parentAffidavit as any) === "VERIFIED" || (hasDocRemark && (checklist?.parentAffidavit as any) === "VERIFIED");
  const isTestPassed = computedStep >= 13 || test?.status === "PASS";
  const isHomeVisitPassed = computedStep >= 14 || visit?.status === "PASS";
  const isAdmitted = computedStep >= 15 || profile.isFullyAdmitted;
  const isScholarshipApplied = (profile as any).admissionMeta?.appliedScholarship;
  const isScholarshipAwarded = !!(profile as any).admissionMeta?.awardedScholarship;

  const inquiryStatus = "completed";
  const formStatus = hasDocRemark ? "correction" : isFormDone ? "completed" : "pending";
  
  const verificationStatus = 
    hasOfficeRemark ? "correction" :
    isVerified ? "completed" : 
    (formStatus === "completed" || formStatus === "correction" ? "pending" : "waiting");

  const entranceTestStatus = 
    isTestPassed ? "completed" :
    (verificationStatus === "completed" || verificationStatus === "correction" ? "pending" : "waiting");

  const homeVisitStatus = 
    isHomeVisitPassed ? "completed" :
    (entranceTestStatus === "completed" ? "pending" : "waiting");

  const finalAdmissionStatus = 
    isAdmitted ? "completed" :
    (homeVisitStatus === "completed" ? "pending" : "waiting");

  const scholarshipStatus = 
    isScholarshipAwarded ? "completed" :
    (isAdmitted && isScholarshipApplied ? "pending" : "waiting");

  const progressItems = [
    { name: "Inquiry", status: inquiryStatus, icon: CheckCircle2, href: "#" },
    { name: "Form", status: formStatus, icon: FileText, href: "/student/admission" },
    { name: "Verification", status: verificationStatus, icon: UserCheck, href: "/student/document-verification" },
    { name: "Entrance Test", status: entranceTestStatus, icon: ClipboardList, href: "/student/entrance-test" },
    { name: "Home Visit", status: homeVisitStatus, icon: Users, href: "/student/home-visit" },
    { name: "Admission Approval", status: finalAdmissionStatus, icon: GraduationCap, href: "/student/final-admission" },
    { name: "Scholarship", status: scholarshipStatus, icon: Award, href: "#" },

  ];

  const steps = [
    { name: "Bio Data", icon: Clock },
    { name: "Stats & ID", icon: UserCheck },
    { name: "Address", icon: MapPinned },
    { name: "Academic", icon: BookOpen },
    { name: "Siblings", icon: Users },
    { name: "Parents", icon: Users },
    { name: "Bank Info", icon: Banknote },
    { name: "Documents", icon: FileText },
    { name: "Review & Sign", icon: ClipboardList },
  ];

  const progressPercentage = finalAdmissionStatus === "completed" ? 100 : Math.min(99, Math.round(((currentStep - 1) / 9) * 100));

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Application Progress Tracker */}
      <div className="bg-white rounded-xl p-4 md:p-8 border border-slate-200">
        
        {/* NEW: Final Admission Success & Scholarship Pending Banner */}

        {/* Quick Alerts for Various Remarks - Hide if already admitted */}
        {finalAdmissionStatus !== "completed" && (
          <div className="max-w-4xl mx-auto mb-6 space-y-4 animate-in slide-in-from-top-4 duration-500">
            {profile.admissionMeta?.officeRemarks && (
              <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-5 md:p-6 flex items-start gap-5 shadow-xl shadow-red-100/50">
                <div className="h-12 w-12 bg-red-100 rounded-2xl flex items-center justify-center shrink-0 border border-red-200 shadow-inner">
                  <AlertCircle className="text-red-600" size={24} />
                </div>
                <div className="space-y-1.5 flex-1 pt-1">
                  <h4 className="text-[10px] font-black text-red-900 uppercase tracking-[0.2em]">Requirement / Correction Needed</h4>
                  <p className="text-sm font-bold text-red-700 leading-tight italic">
                    "{profile.admissionMeta.officeRemarks}"
                  </p>
                  <p className="text-[10px] font-bold text-red-400 pt-1 uppercase tracking-widest">
                    Please update your information/documents as mentioned above.
                  </p>
                </div>
                <Link 
                  href="/student/admission" 
                  className="hidden md:flex bg-red-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95 self-center"
                >
                  Go to Form
                </Link>
              </div>
            )}
            
            {profile.admissionMeta?.documentRemarks && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-5 md:p-6 flex items-start gap-5 shadow-xl shadow-amber-100/50">
                <div className="h-12 w-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0 border border-amber-200 shadow-inner">
                  <FileText className="text-amber-600" size={24} />
                </div>
                <div className="space-y-1.5 flex-1 pt-1">
                  <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-[0.2em]">Document Correction Needed</h4>
                  <p className="text-sm font-bold text-amber-700 leading-tight italic">
                    "{profile.admissionMeta.documentRemarks}"
                  </p>
                  <p className="text-[10px] font-bold text-amber-500 pt-1 uppercase tracking-widest">
                    Please update your documents in Step 8.
                  </p>
                </div>
                <Link 
                  href="/student/admission" 
                  className="hidden md:flex bg-amber-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-200 active:scale-95 self-center"
                >
                  Go to Documents
                </Link>
              </div>
            )}

            {profile.admissionMeta?.verificationRemarks && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-5 md:p-6 flex items-start gap-5 shadow-xl shadow-blue-100/50">
                <div className="h-12 w-12 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0 border border-blue-200 shadow-inner">
                  <ClipboardList className="text-blue-600" size={24} />
                </div>
                <div className="space-y-1.5 flex-1 pt-1">
                  <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em]">Affidavit Correction Needed</h4>
                  <p className="text-sm font-bold text-blue-700 leading-tight italic">
                    "{profile.admissionMeta.verificationRemarks}"
                  </p>
                  <p className="text-[10px] font-bold text-blue-400 pt-1 uppercase tracking-widest">
                    Please upload the corrected affidavit in Step 10.
                  </p>
                </div>
                <Link 
                  href="/student/admission" 
                  className="hidden md:flex bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 self-center"
                >
                  Go to Affidavit
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Simplified Next Action Card */}
        <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-blue-600 rounded-3xl p-6 md:p-8 text-white shadow-2xl shadow-blue-100 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden transition-all">
                <div className="relative z-10 space-y-2 text-center md:text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Your Current Status</p>
                    <h3 className="text-2xl md:text-3xl font-black font-outfit uppercase italic leading-none tracking-tight">
                        {scholarshipStatus === "completed" ? "Scholarship Awarded" :
                         finalAdmissionStatus === "completed" ? (isScholarshipApplied && !isScholarshipAwarded ? "Scholarship Review" : "Admission Successful") : 
                         hasDocRemark ? "Document Correction" :
                         hasOfficeRemark ? "Affidavit Correction" :
                         formStatus === "pending" ? "Admission Form" :
                         verificationStatus === "pending" ? "Document Review" :
                         entranceTestStatus === "pending" ? "Entrance Test" :
                         homeVisitStatus === "pending" ? "Home Visit" :
                         finalAdmissionStatus === "pending" ? "Final Fee Choice" :
                         "Application Finalized"}
                    </h3>
                    <p className="text-xs font-bold opacity-80 uppercase tracking-widest leading-relaxed">
                        {scholarshipStatus === "completed" ? "Your scholarship has been approved and applied." :
                         finalAdmissionStatus === "completed" ? (isScholarshipApplied && !isScholarshipAwarded ? "Your admission is confirmed. The Scholarship Committee is now reviewing your application." : "Welcome to the school community. Your admission is now complete.") : 
                         hasDocRemark ? "Please update your documents in the admission form to proceed." :
                         hasOfficeRemark ? "Please update your affidavit and signatures to proceed." :
                         formStatus === "pending" ? "Please complete and submit your details." :
                         verificationStatus === "pending" ? "We are verifying your submitted files." :
                         entranceTestStatus === "pending" ? "View your test schedule and location details." :
                         homeVisitStatus === "pending" ? 
                         (visitData?.visitDate ? `Family Visit Scheduled: ${formatDate(visitData.visitDate)} at ${formatTime(visitData.visitTime)} with ${(() => {
                             try {
                                 if (visitData.teacherName?.startsWith('{')) {
                                     const p = JSON.parse(visitData.teacherName);
                                     return [p.teacher1, p.teacher2, p.teacher3].filter(Boolean).join(", ");
                                 }
                                 return visitData.teacherName || "Assigned Faculty";
                             } catch(e) { return "Assigned Faculty"; }
                         })()}` : "Awaiting Home Visit schedule from Office.") :
                         finalAdmissionStatus === "pending" ? "Select your enrollment path (Scholarship vs. Normal Fee) to finalize admission." :
                         "Your application is being finalized by the Principal."}

                    </p>
                </div>
                {finalAdmissionStatus !== "completed" && (
                    <div className="flex gap-3 relative z-10 shrink-0">
                        {(formStatus === "pending" || hasDocRemark) && (
                            <Link href="/student/admission" className="bg-white text-blue-600 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl shadow-blue-900/20 active:scale-95">
                                {hasDocRemark ? "Correct Form" : "Start Form"}
                            </Link>
                        )}
                        {verificationStatus === "correction" && (
                            <Link href="/student/document-verification" className="bg-white text-blue-600 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl shadow-blue-900/20 active:scale-95">
                                Correct Affidavit
                            </Link>
                        )}
                        {entranceTestStatus === "pending" && !hasDocRemark && (
                            <Link href="/student/entrance-test" className="bg-white text-blue-600 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl shadow-blue-900/20 active:scale-95">
                                View Details
                            </Link>
                        )}
                        {finalAdmissionStatus === "pending" && !hasDocRemark && (
                            <Link href="/student/admission" className="bg-white text-blue-600 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl shadow-blue-900/20 active:scale-95">
                                Choose Enrollment
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>

        <div className="grid grid-cols-3 md:flex md:items-center md:justify-between max-w-4xl mx-auto relative px-2 gap-y-6">
          {/* Connector Line - Only on Desktop */}
          <div className="absolute left-10 right-10 top-5 h-1 bg-slate-50 hidden md:block">
             <div 
               className="h-full bg-blue-600 transition-all duration-700" 
               style={{ width: finalAdmissionStatus === "completed" ? "100%" : 
                               finalAdmissionStatus === 'pending' ? "95%" :
                               homeVisitStatus === 'pending' ? "80%" :
                               entranceTestStatus === 'pending' ? "53%" :
                               verificationStatus === 'pending' ? "38%" :
                               formStatus === 'pending' ? "18%" : "0%" }}
             />
          </div>

          {progressItems.map((item, i) => (
             <Link key={item.name} href={item.href} className={cn(
               "flex flex-col items-center gap-2 relative z-10",
               item.status === "waiting" && "pointer-events-none opacity-40"
             )}>
                <div className={cn(
                  "h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center border-2 transition-all",
                  item.status === "completed" ? "bg-emerald-500 border-emerald-500 text-white" :
                  item.status === "correction" ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-200" :
                  item.status === "pending" ? "bg-amber-400 border-amber-400 text-white shadow-lg shadow-amber-200" :
                  "bg-white border-slate-100 text-slate-300"
                )}>
                  {item.status === "completed" ? <CheckCircle2 size={16} /> : 
                   item.status === "correction" ? <AlertCircle size={16} /> : 
                   <item.icon size={16} />}
                </div>
                <span className={cn(
                  "text-[8px] md:text-[10px] font-bold uppercase tracking-[0.15em] text-center max-w-[80px]",
                  item.status === "correction" ? "text-red-600" :
                  item.status === "waiting" ? "text-slate-200" : "text-slate-900"
                )}>{item.name}</span>
             </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* DYNAMIC MILESTONE DETAILS */}
          <div className="bg-white rounded-xl p-5 md:p-8 border border-slate-200">
            <div className="flex items-center justify-between mb-6 md:mb-8 border-b border-slate-50 pb-4">
                <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight uppercase italic underline decoration-blue-500/20 underline-offset-8">Current Step Details</h2>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 uppercase tracking-widest">{progressPercentage}% DONE</span>
                </div>
            </div>

            {/* If Form is still pending or needs document correction, show the 9 steps roadmap */}
            {formStatus === "pending" || hasDocRemark ? (
                <div className="relative">
                  <div className="absolute left-5 top-3 bottom-0 w-px bg-slate-100"></div>
                  <div className="space-y-4 md:space-y-6">
                    {steps.map((step, i) => {
                      const stepNum = i + 1;
                      const hasDocRemark = !!profile.admissionMeta?.documentRemarks;
                      
                      let isComplete = currentStep > stepNum || finalAdmissionStatus === "completed";
                      let isCurrent = currentStep === stepNum && finalAdmissionStatus !== "completed";
                      
                      if (hasDocRemark) {
                          if (stepNum === 8) {
                              isComplete = false;
                              isCurrent = true;
                          } else if (stepNum === 9) {
                              isComplete = true;
                              isCurrent = false;
                          }
                      }
                      
                      return (
                        <div key={step.name} className="flex items-center gap-4 md:gap-8 relative">
                          <div className={cn(
                            "h-10 w-10 md:h-12 md:w-12 rounded-xl border-2 border-slate-50 flex items-center justify-center z-10 transition-colors",
                            isComplete ? 'bg-emerald-500 text-white border-emerald-500' : 
                            isCurrent && hasDocRemark ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-200' :
                            isCurrent ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-300'
                          )}>
                            {isComplete ? <CheckCircle2 size={16} /> : 
                             isCurrent && hasDocRemark ? <AlertCircle size={16} /> :
                             <step.icon size={16} />}
                          </div>
                          <div className="flex-1">
                            <p className={cn(
                              "text-xs md:text-sm font-bold uppercase tracking-widest",
                              isComplete || isCurrent ? 'text-slate-900' : 'text-slate-300'
                            )}>
                              {step.name}
                            </p>
                            <p className={cn(
                                "text-[8px] md:text-[10px] font-bold mt-0.5 md:mt-1 uppercase tracking-wider",
                                isCurrent && hasDocRemark ? "text-red-500" : "text-slate-400"
                            )}>
                              {isComplete ? 'COMPLETED' : 
                               isCurrent && hasDocRemark ? 'CORRECTION NEEDED' :
                               isCurrent ? 'FILL NOW' : 'LOCKED'}
                            </p>
                          </div>
                          {isCurrent && (
                              <Link href="/student/admission" className="text-[10px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase bg-blue-50 px-3 py-1 rounded-lg">
                                  START
                              </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
            ) : entranceTestStatus === "pending" ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <EntranceTestCard testData={testData} studentName={studentName} />
                    <Link href="/student/entrance-test" className="mt-8 flex items-center justify-center gap-2 w-full p-4 rounded-[24px] border-2 border-dashed border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-600 transition-all font-black text-[10px] uppercase tracking-[0.2em] group">
                        Open Full Test Page <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            ) : homeVisitStatus === "pending" ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-center text-center space-y-4">
                        <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/10">
                            <Users size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase italic leading-none tracking-tight">Home Visit Details</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Details about your faculty visitation schedule</p>
                        </div>
                        {visitData?.visitDate ? (
                            <div className="bg-white p-4 rounded-xl border border-slate-100/80 w-full max-w-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Date</span>
                                    <span className="text-sm font-bold text-slate-900">{formatDate(visitData.visitDate)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Time</span>
                                    <span className="text-sm font-bold text-slate-900">{formatTime(visitData.visitTime)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Teacher</span>
                                    <span className="text-sm font-bold text-slate-900">
                                        {(() => {
                                            if (!visitData.teacherName) return "Assigned shortly";
                                            try {
                                                if (visitData.teacherName.startsWith('{')) {
                                                    const p = JSON.parse(visitData.teacherName);
                                                    return [p.teacher1, p.teacher2, p.teacher3].filter(Boolean).join(", ");
                                                }
                                                return visitData.teacherName;
                                            } catch (e) {
                                                return visitData.teacherName;
                                            }
                                        })()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-t pt-2 border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Status</span>
                                    <span className={cn(
                                        "text-xs font-black uppercase tracking-widest",
                                        visitData?.status === "PASS" ? "text-emerald-600" : "text-blue-600"
                                    )}>
                                        {visitData?.status === "PASS" ? "Completed" : "Scheduled"}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 font-medium italic">Layout schedule is being updated from the office dashboard.</p>
                        )}
                    </div>
                </div>
            ) : finalAdmissionStatus === "completed" ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-5 bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100">
                    <div className="h-20 w-20 bg-emerald-500 text-white rounded-[32px] flex items-center justify-center border-4 border-white shadow-xl shadow-emerald-200">
                        <GraduationCap size={40} />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight font-outfit leading-none">
                            {isScholarshipAwarded ? "Scholarship Awarded!" : 
                             isScholarshipApplied ? "Scholarship Pending" : "Admission Confirmed"}
                        </h3>
                        
                        <p className={cn(
                            "text-xs font-bold uppercase tracking-widest",
                            isScholarshipAwarded ? "text-emerald-600" : "text-amber-600"
                        )}>
                            {isScholarshipAwarded ? "Your admission and scholarship are finalized." :
                             isScholarshipApplied ? "Your admission is approved. Scholarship award is pending review." :
                             "Your admission is finalized and admitted."}
                        </p>
                        
                        {isScholarshipAwarded && (
                            <div className="mt-4 bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm max-w-sm mx-auto space-y-2 relative overflow-hidden">
                                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center justify-center gap-2">
                                     You have been awarded
                                </p>
                                <p className="text-3xl font-black text-emerald-600 tracking-tight leading-none">₹{(profile as any).admissionMeta.scholarshipAmount.toLocaleString()}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Scholarship for the full year</p>
                                <div className="border-t border-slate-100 pt-3 mt-2 space-y-3">
                                    <p className="text-[9px] font-bold text-slate-500 uppercase leading-normal">Note: Payout is ₹3,000/month based on attendance, homework, guardian rating & PTM criteria.</p>
                                    
                                    <a 
                                        href="/api/scholarship/certificate" 
                                        download 
                                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"
                                    >
                                        <FileText size={14} />
                                        Download Your Scholarship Certificate
                                    </a>
                                </div>
                            </div>
                        )}
                        
                        {!isScholarshipAwarded && isScholarshipApplied && (
                             <div className="mt-4 bg-amber-50 p-5 rounded-2xl border border-amber-100 shadow-sm max-w-sm mx-auto">
                                <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Pending Recommendation</p>
                                <p className="text-sm font-black text-amber-600 mt-1 uppercase italic">Pending for Award Scholarship</p>
                                <p className="text-[9px] font-bold text-slate-400 mt-3 uppercase leading-relaxed tracking-wider">The principal is finalizing your scholarship amount based on your profile.</p>
                             </div>
                        )}
                        
                        <p className="text-[10px] text-slate-400 max-w-sm pt-2 uppercase font-bold tracking-widest leading-relaxed">
                            {isScholarshipApplied && !isScholarshipAwarded ? "Check back soon for the award update." : "Welcome to our school community!"}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-20 w-20 bg-slate-50 text-slate-400 rounded-[32px] flex items-center justify-center border-4 border-white shadow-xl shadow-slate-100">
                        <Clock size={40} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-black text-slate-900 uppercase italic">In Progress</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">The school office is updating your status shortly.</p>
                    </div>
                </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-5 md:p-8 border border-slate-200">
            <h2 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-6">Utilities</h2>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {[
                { name: "PROFILER", icon: MapPin },
                { name: "FEES", icon: CreditCard },
                { name: "SUPPORT", icon: AlertCircle },
                { name: "NOTICES", icon: FileText },
              ].map((item) => (
                <button key={item.name} className="flex flex-col items-center justify-center p-4 md:p-5 rounded-xl border border-slate-50 hover:bg-slate-50 hover:border-slate-200 transition-colors gap-2 md:gap-3">
                  <item.icon className="text-slate-400" size={20} />
                  <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-8 text-white relative">
            <div className="relative z-10">
               <div className="flex items-center gap-2 text-blue-400 mb-3">
                  <AlertCircle size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">URGENT</span>
               </div>
                <p className="font-bold text-lg leading-tight uppercase">Documentation</p>
                <p className="text-xs text-slate-400 mt-2 font-medium uppercase tracking-wider">Please verify all uploaded documents after submission.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
