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
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { studentProfiles, admissionMeta, entranceTests, inquiries, documentChecklists, homeVisits } from "@/db/schema";

import { redirect } from "next/navigation";
import { EntranceTestCard } from "@/features/admissions/components/EntranceTestCard";

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  // Use standard join for stability with Neon pooler/Drizzle 0.45
  const results = await db
    .select({
      profile: studentProfiles,
      admissionMeta: admissionMeta,
      inquiry: inquiries,
      documentChecklists: documentChecklists,
    })
    .from(studentProfiles)
    .leftJoin(admissionMeta, eq(studentProfiles.admissionMetaId, admissionMeta.id))
    .leftJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
    .leftJoin(documentChecklists, eq(admissionMeta.id, documentChecklists.admissionId))
    .where(eq(studentProfiles.userId, session.user.id))
    .limit(1);

  if (!results.length) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
            <AlertCircle size={48} className="text-slate-300" />
            <h2 className="text-2xl font-bold text-slate-900">No Profile Found</h2>
            <p className="text-slate-500">Your student profile hasn't been initialized yet. Please contact support.</p>
        </div>
    );
  }
  
  // Map result to a more usable structure
  const result = results[0];
  const profile = {
    ...result.profile,
    admissionMeta: result.admissionMeta ? {
      ...result.admissionMeta,
      inquiry: result.inquiry,
      documentChecklists: result.documentChecklists,
    } : null
  };

  const studentName = (profile as any).admissionMeta?.inquiry?.studentName || "Student";
  const entryNumber = (profile as any).admissionMeta?.entryNumber || "N/A";
  const currentStep = profile.admissionStep;

  const testResults = await db
    .select()
    .from(entranceTests)
    .where(eq(entranceTests.admissionId, profile.admissionMetaId!))
    .limit(1);
    
  const testData = testResults[0] || null;

  const visitResults = await db
    .select()
    .from(homeVisits)
    .where(eq(homeVisits.admissionId, profile.admissionMetaId!))
    .limit(1);
    
  const visitData = visitResults[0] || null;


  // --- STRICT SEQUENTIAL LOGIC ---
  const isFormDone = currentStep >= 10;
  const isVerified = !!((profile as any).admissionMeta?.documentChecklists?.formReceivedComplete);
  const isTestPassed = testData?.status === "PASS";
  const isAdmitted = profile.isFullyAdmitted;

  const inquiryStatus = "completed";
  const formStatus = isFormDone ? "completed" : "pending";
  
  const verificationStatus = 
    (isVerified && isFormDone) ? "completed" : 
    (formStatus === "completed" ? "pending" : "waiting");

  const entranceTestStatus = 
    (isTestPassed && isVerified) ? "completed" :
    (verificationStatus === "completed" ? "pending" : "waiting");

  const homeVisitStatus = 
    (isAdmitted && (visitData?.status === "PASS")) ? "completed" :
    (entranceTestStatus === "completed" || isTestPassed) ? "pending" : "waiting";


  const finalAdmissionStatus = 
    (isAdmitted && isTestPassed && isVerified && isFormDone && homeVisitStatus === "completed") ? "completed" :
    (homeVisitStatus === "completed" ? "pending" : "waiting");

  const progressItems = [
    { name: "Inquiry", status: inquiryStatus, icon: CheckCircle2, href: "#" },
    { name: "Form", status: formStatus, icon: FileText, href: "/student/admission" },
    { name: "Verification", status: verificationStatus, icon: UserCheck, href: "/student/document-verification" },
    { name: "Entrance Test", status: entranceTestStatus, icon: ClipboardList, href: "/student/entrance-test" },
    { name: "Home Visit", status: homeVisitStatus, icon: Users, href: "/student/home-visit" },
    { name: "Final Admission", status: finalAdmissionStatus, icon: GraduationCap, href: "/student/final-admission" },

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
        <h2 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-6 md:mb-8 text-center bg-slate-50 py-2 rounded-lg border border-slate-100/50">Admission Progress Tracker</h2>
        
        {/* Simplified Next Action Card */}
        <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-blue-600 rounded-3xl p-6 md:p-8 text-white shadow-2xl shadow-blue-100 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden transition-all">
                <div className="relative z-10 space-y-2 text-center md:text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Your Current Status</p>
                    <h3 className="text-2xl md:text-3xl font-black font-outfit uppercase italic leading-none tracking-tight">
                        {finalAdmissionStatus === "completed" ? "Admission Successful" : 
                         formStatus === "pending" ? "Admission Form" :
                         verificationStatus === "pending" ? "Document Review" :
                         entranceTestStatus === "pending" ? "Entrance Test" :
                         homeVisitStatus === "pending" ? "Home Visit" :
                         "Application Finalized"}
                    </h3>
                    <p className="text-xs font-bold opacity-80 uppercase tracking-widest leading-relaxed">
                        {finalAdmissionStatus === "completed" ? "Welcome to the school community." : 
                         formStatus === "pending" ? "Please complete and submit your details." :
                         verificationStatus === "pending" ? "We are verifying your submitted files." :
                         entranceTestStatus === "pending" ? "View your test schedule and location details." :
                         homeVisitStatus === "pending" ? 
                         (visitData?.visitDate ? `Family Visit Scheduled: ${visitData.visitDate} at ${visitData.visitTime} with ${visitData.teacherName}` : "Awaiting Home Visit schedule from Office.") :
                         "Final processing is underway."}

                    </p>
                </div>
                {finalAdmissionStatus !== "completed" && (
                    <div className="flex gap-3 relative z-10 shrink-0">
                        {formStatus === "pending" && (
                            <Link href="/student/admission" className="bg-white text-blue-600 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl shadow-blue-900/20 active:scale-95">
                                Start Form
                            </Link>
                        )}
                        {entranceTestStatus === "pending" && (
                            <Link href="/student/entrance-test" className="bg-white text-blue-600 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl shadow-blue-900/20 active:scale-95">
                                View Details
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
                  item.status === "pending" ? "bg-amber-400 border-amber-400 text-white shadow-lg shadow-amber-200" :
                  "bg-white border-slate-100 text-slate-300"
                )}>
                  {item.status === "completed" ? <CheckCircle2 size={16} /> : <item.icon size={16} />}
                </div>
                <span className={cn(
                  "text-[8px] md:text-[10px] font-bold uppercase tracking-[0.15em] text-center max-w-[80px]",
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

            {/* If Form is still pending, show the 9 steps roadmap */}
            {formStatus === "pending" ? (
                <div className="relative">
                  <div className="absolute left-5 top-3 bottom-0 w-px bg-slate-100"></div>
                  <div className="space-y-4 md:space-y-6">
                    {steps.map((step, i) => {
                      const stepNum = i + 1;
                      const isComplete = currentStep > stepNum || finalAdmissionStatus === "completed";
                      const isCurrent = currentStep === stepNum && finalAdmissionStatus !== "completed";
                      
                      return (
                        <div key={step.name} className="flex items-center gap-4 md:gap-8 relative">
                          <div className={cn(
                            "h-10 w-10 md:h-12 md:w-12 rounded-xl border-2 border-slate-50 flex items-center justify-center z-10 transition-colors",
                            isComplete ? 'bg-emerald-500 text-white border-emerald-500' : 
                            isCurrent ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-300'
                          )}>
                            {isComplete ? <CheckCircle2 size={16} /> : <step.icon size={16} />}
                          </div>
                          <div className="flex-1">
                            <p className={cn(
                              "text-xs md:text-sm font-bold uppercase tracking-widest",
                              isComplete || isCurrent ? 'text-slate-900' : 'text-slate-300'
                            )}>
                              {step.name}
                            </p>
                            <p className="text-[8px] md:text-[10px] font-bold text-slate-400 mt-0.5 md:mt-1 uppercase tracking-wider">
                              {isComplete ? 'COMPLETED' : 
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
            ) : entranceTestStatus === "pending" || (entranceTestStatus === "completed" && finalAdmissionStatus !== "completed") ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <EntranceTestCard testData={testData} studentName={studentName} />
                    <Link href="/student/entrance-test" className="mt-8 flex items-center justify-center gap-2 w-full p-4 rounded-[24px] border-2 border-dashed border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-600 transition-all font-black text-[10px] uppercase tracking-[0.2em] group">
                        Open Full Test Page <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            ) : homeVisitStatus === "pending" || (homeVisitStatus === "completed" && finalAdmissionStatus !== "completed") ? (
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
                                    <span className="text-sm font-bold text-slate-900">{visitData.visitDate}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Time</span>
                                    <span className="text-sm font-bold text-slate-900">{visitData.visitTime}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Teacher</span>
                                    <span className="text-sm font-bold text-slate-900">{visitData.teacherName || "Assigned shortly"}</span>
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
            ) : (

                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-20 w-20 bg-emerald-50 text-emerald-500 rounded-[32px] flex items-center justify-center border-4 border-white shadow-xl shadow-emerald-100">
                        <CheckCircle2 size={40} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-black text-slate-900 uppercase italic">Great Progress!</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">The school office will update your status shortly.</p>
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
