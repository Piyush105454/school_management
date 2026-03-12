import React from "react";
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
  ClipboardList
} from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { studentProfiles, admissionMeta } from "@/db/schema";
import { redirect } from "next/navigation";

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  const profile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userId, session.user.id),
    with: {
        admissionMeta: {
            with: {
                inquiry: true
            }
        }
    }
  });

  if (!profile) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
            <AlertCircle size={48} className="text-slate-300" />
            <h2 className="text-2xl font-bold text-slate-900">No Profile Found</h2>
            <p className="text-slate-500">Your student profile hasn't been initialized yet. Please contact support.</p>
        </div>
    );
  }

  const studentName = (profile as any).admissionMeta?.inquiry?.studentName || "Student";
  const entryNumber = (profile as any).admissionMeta?.entryNumber || "N/A";
  const currentStep = profile.admissionStep;

  const steps = [
    { name: "Bio Data", icon: Clock },
    { name: "Stats & ID", icon: UserCheck },
    { name: "Address", icon: MapPinned },
    { name: "Academic", icon: BookOpen },
    { name: "Siblings", icon: Users },
    { name: "Parents", icon: Users },
    { name: "Bank Info", icon: Banknote },
    { name: "Review & Sign", icon: ClipboardList },
  ];

  const progressPercentage = Math.round(((currentStep - 1) / 7) * 100);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="bg-blue-600 rounded-xl p-6 md:p-8 text-white shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight">Howdy, {studentName}</h1>
          <p className="opacity-90 mt-1 md:mt-2 text-sm md:text-base font-bold">App ID: {entryNumber}</p>
          <div className="mt-6 md:mt-8">
            <Link href="/student/admission" className="inline-block bg-white text-blue-600 px-6 md:px-8 py-2.5 md:py-3 rounded-lg font-bold tracking-wider hover:bg-blue-50 transition-colors text-xs md:text-sm uppercase text-center w-full md:w-auto">
              {profile.isFullyAdmitted ? "VIEW APPLICATION" : currentStep > 1 ? "CONTINUE ADMISSION" : "START ADMISSION"}
            </Link>
          </div>
        </div>
      </div>

      {/* Application Progress Tracker */}
      <div className="bg-white rounded-xl p-4 md:p-8 border border-slate-200">
        <h2 className="text-[10px] md:text-xs font-bold text-slate-900 uppercase tracking-widest mb-6 md:mb-8 text-center bg-slate-50 py-2 rounded-lg border border-slate-100">Progress Tracking</h2>
        <div className="grid grid-cols-3 md:flex md:items-center md:justify-between max-w-4xl mx-auto relative px-2 gap-y-6">
          {/* Connector Line - Only on Desktop */}
          <div className="absolute left-10 right-10 top-5 h-1 bg-slate-100 hidden md:block">
             <div 
               className="h-full bg-blue-600 transition-all duration-500" 
               style={{ width: profile.isFullyAdmitted ? "100%" : currentStep > 1 ? "20%" : "0%" }}
             />
          </div>

          {[
            { name: "Inquiry", status: "completed", icon: CheckCircle2 },
            { name: "Form", status: profile.isFullyAdmitted ? "completed" : "pending", icon: FileText },
            { name: "Approved", status: "waiting", icon: UserCheck },
            { name: "Exam", status: "waiting", icon: Clock },
            { name: "Visit", status: "waiting", icon: Clock },
            { name: "Final", status: "waiting", icon: GraduationCap },
          ].map((item, i) => (
             <div key={item.name} className="flex flex-col items-center gap-2 relative z-10">
                <div className={cn(
                  "h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center border-2 transition-colors",
                  item.status === "completed" ? "bg-emerald-500 border-emerald-500 text-white" :
                  item.status === "pending" ? "bg-blue-600 border-blue-600 text-white" :
                  "bg-white border-slate-100 text-slate-200"
                )}>
                  {item.status === "completed" ? <CheckCircle2 size={14} /> : <item.icon size={14} />}
                </div>
                <span className={cn(
                  "text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-center",
                  item.status === "waiting" ? "text-slate-300" : "text-slate-900"
                )}>{item.name}</span>
             </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-5 md:p-8 border border-slate-200">
            <div className="flex items-center justify-between mb-6 md:mb-8">
                <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight uppercase">Roadmap</h2>
                <span className="text-[10px] md:text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 uppercase">{progressPercentage}% DONE</span>
            </div>
            
            <div className="relative">
              <div className="absolute left-5 top-3 bottom-0 w-px bg-slate-100"></div>
              <div className="space-y-4 md:space-y-6">
                {steps.map((step, i) => {
                  const stepNum = i + 1;
                  const isComplete = currentStep > stepNum || profile.isFullyAdmitted;
                  const isCurrent = currentStep === stepNum && !profile.isFullyAdmitted;
                  
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
