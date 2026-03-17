"use client";

import React, { useState } from "react";
import { CheckCircle, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { finalizeFinalAdmission } from "@/features/admissions/actions/admissionActions";

export function OfficeFinalManager({ applicant }: { applicant: any }) {
  const [loading, setLoading] = useState(false);
  const studentName = applicant.inquiry?.studentName || "Unknown Applicant";
  const isAdmitted = applicant.studentProfile?.isFullyAdmitted;

  const handleFinalize = async () => {
    if (!confirm(`Are you sure you want to officially ADMIT ${studentName}?`)) return;
    setLoading(true);
    const res = await finalizeFinalAdmission(applicant.id);
    setLoading(false);
    if (res.success) {
      alert("Student Admitted Successfully!");
      window.location.reload();
    } else {
      alert("Error: " + res.error);
    }
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all">
       <div className="flex items-center gap-6">
            <div className="h-14 w-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100">
                <User size={28} />
            </div>
            <div>
                <h3 className="text-xl font-black text-slate-900 uppercase italic font-outfit leading-none">{studentName}</h3>
                <div className="flex items-center gap-3 mt-1.5">
                    <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                        applicant.appliedScholarship ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-blue-100 text-blue-800 border border-blue-200"
                    )}>
                        {applicant.appliedScholarship ? "SCHOLARSHIP APPLIED" : "NORMAL FEE"}
                    </span>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Entry: {applicant.entryNumber}</p>
                </div>
            </div>
       </div>

       <div>
           {!isAdmitted ? (
                <button 
                    onClick={handleFinalize}
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-xs hover:bg-blue-700 transition-all flex items-center gap-2 shadow-xl shadow-blue-500/20 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                     Confirm Admission Completed
                </button>
           ) : (
                <span className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 font-black uppercase tracking-widest text-[10px]">
                    <CheckCircle size={14} /> ADMITTED
                </span>
           )}
       </div>
    </div>
  );
}
