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
  if (!session) redirect("/login");

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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold font-outfit uppercase tracking-tight">Howdy, {studentName}</h1>
          <p className="opacity-80 mt-2 text-lg font-medium">Application ID: {entryNumber}</p>
          <div className="mt-8 flex gap-4">
            <Link href="/student/admission" className="bg-white text-blue-600 px-8 py-3.5 rounded-2xl font-black tracking-tight hover:bg-blue-50 transition-all hover:scale-105 shadow-xl shadow-black/10 text-sm uppercase">
              {profile.isFullyAdmitted ? "VIEW APPLICATION" : currentStep > 1 ? "CONTINUE ADMISSION" : "START ADMISSION"}
            </Link>
            <button className="bg-blue-500/20 hover:bg-blue-500/30 text-white px-8 py-3.5 rounded-2xl font-bold transition-colors text-sm uppercase">
              VIEW GUIDELINES
            </button>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-y-1/4 translate-x-1/4">
          <GraduationCap size={300} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase">Admission Roadmap</h2>
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">{progressPercentage}% PROGRESS</span>
            </div>
            
            <div className="relative">
              <div className="absolute left-6 top-3 bottom-0 w-px bg-slate-100"></div>
              <div className="space-y-6">
                {steps.map((step, i) => {
                  const stepNum = i + 1;
                  const isComplete = currentStep > stepNum || profile.isFullyAdmitted;
                  const isCurrent = currentStep === stepNum && !profile.isFullyAdmitted;
                  
                  return (
                    <div key={step.name} className="flex items-center gap-8 relative group">
                      <div className={cn(
                        "h-12 w-12 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center z-10 transition-all duration-500",
                        isComplete ? 'bg-emerald-500 text-white rotate-6' : 
                        isCurrent ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-50 text-slate-300 border-slate-50'
                      )}>
                        {isComplete ? <CheckCircle2 size={20} /> : <step.icon size={20} />}
                      </div>
                      <div className="flex-1">
                        <p className={cn(
                          "text-sm font-black uppercase tracking-widest",
                          isComplete || isCurrent ? 'text-slate-900' : 'text-slate-300'
                        )}>
                          {step.name}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                          {isComplete ? 'COMPLETED' : 
                           isCurrent ? 'READY FOR ACTION' : 'LOCKED'}
                        </p>
                      </div>
                      {isCurrent && (
                          <Link href="/student/admission" className="text-xs font-black text-blue-600 hover:underline group-hover:-translate-x-1 transition-transform">
                              FILL NOW →
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
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h2 className="text-sm font-black text-slate-900 font-outfit uppercase tracking-widest mb-6">Utilities</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "PROFILER", icon: MapPin },
                { name: "FEES", icon: CreditCard },
                { name: "SUPPORT", icon: AlertCircle },
                { name: "NOTICES", icon: FileText },
              ].map((item) => (
                <button key={item.name} className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 hover:bg-slate-50 hover:border-slate-300 transition-all gap-3 group">
                  <item.icon className="text-slate-300 group-hover:text-blue-600 transition-colors" size={24} />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-950 rounded-3xl p-8 text-white relative overflow-hidden group">
            <div className="relative z-10">
               <div className="flex items-center gap-2 text-blue-400 mb-3">
                  <AlertCircle size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">URGENT</span>
               </div>
                <p className="font-bold text-lg leading-tight uppercase tracking-tighter">Documentation</p>
                <p className="text-xs text-slate-400 mt-2 font-medium">Please verify all uploaded documents after submission.</p>
            </div>
            <div className="absolute right-0 top-0 opacity-5 group-hover:opacity-10 transition-opacity translate-x-1/3 -translate-y-1/3 scale-150">
               <AlertCircle size={100} />
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
