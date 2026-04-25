"use client";

import React, { useState } from "react";
import { CheckCircle, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { finalizeFinalAdmission } from "@/features/admissions/actions/admissionActions";

export function OfficeFinalManager({ applicant }: { applicant: any }) {
  const [loading, setLoading] = useState(false);
  const [approveScholarship, setApproveScholarship] = useState(false);
  const studentName = applicant.inquiry?.studentName || "Unknown Applicant";
  const isAdmitted = applicant.studentProfile?.isFullyAdmitted;

  const handleFinalize = async () => {
    if (!confirm(`Are you sure you want to officially ADMIT ${studentName}?${approveScholarship ? ' (with Scholarship)' : ''}`)) return;
    setLoading(true);
    const res = await finalizeFinalAdmission(
      applicant.id, 
      applicant.appliedScholarship ?? false, 
      approveScholarship, 
      36000
    );
    setLoading(false);
    if (res.success) {
      alert("Student Admitted Successfully!");
      window.location.reload();
    } else {
      alert("Error: " + (res as any).error);
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
                    {applicant.appliedScholarship === true && (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm shadow-emerald-500/10">
                            SCHOLARSHIP APPLIED
                        </span>
                    )}
                    {applicant.appliedScholarship === false && (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-800 border border-blue-200 shadow-sm shadow-blue-500/10">
                            NORMAL FEE SELECTED
                        </span>
                    )}
                    {applicant.appliedScholarship === null && (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-200 animate-pulse">
                            FEE CHOICE PENDING
                        </span>
                    )}
                    <p className="text-[10px] font-black text-slate-400 uppercase">Entry: {applicant.entryNumber}</p>
                </div>
            </div>
       </div>

       <div>
           {!isAdmitted ? (
                <div className="flex flex-col items-end gap-3">
                    {applicant.appliedScholarship && (
                        <label className="flex items-center gap-2 cursor-pointer bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 hover:bg-emerald-100/50 transition-all">
                            <input 
                                type="checkbox" 
                                checked={approveScholarship} 
                                onChange={(e) => setApproveScholarship(e.target.checked)}
                                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Approve 36,000 Scholarship</span>
                        </label>
                    )}
                    <button 
                        onClick={handleFinalize}
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-xs hover:bg-blue-700 transition-all flex items-center gap-2 shadow-xl shadow-blue-500/20 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                         Confirm Admission Completed
                    </button>
                </div>
           ) : (
                <span className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 font-black uppercase tracking-widest text-[10px]">
                    <CheckCircle size={14} /> ADMITTED
                </span>
           )}
       </div>
    </div>
  );
}
