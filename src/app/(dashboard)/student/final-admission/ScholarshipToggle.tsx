"use client";

import React, { useState } from "react";
import { applyScholarship } from "@/features/admissions/actions/admissionActions";
import { Loader2, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScholarshipToggle({ admissionId, initialApplied }: { admissionId: string, initialApplied: boolean }) {
  const [applied, setApplied] = useState(initialApplied);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (val: boolean) => {
    setLoading(true);
    const res = await applyScholarship(admissionId, val);
    setLoading(false);
    if (res.success) {
      setApplied(val);
      alert(val ? "Scholarship Applied!" : "Normal Fee Option Selected!");
    } else {
      alert("Error: " + res.error);
    }
  };

  return (
    <div className="space-y-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Choose Fee Route Type</p>
        <div className="grid grid-cols-2 gap-4">
            <button 
                onClick={() => handleToggle(false)}
                disabled={loading}
                className={cn(
                    "p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-2",
                    !applied ? "border-blue-600 bg-blue-50/20 text-blue-900" : "border-slate-100 text-slate-400 hover:border-slate-200"
                )}
            >
                {!applied ? <CheckCircle2 className="text-blue-600" size={20} /> : <Circle size={20} className="text-slate-200" />}
                <span className="text-xs font-black uppercase tracking-widest">Normal Fee</span>
                <span className="text-[9px] font-bold opacity-60">Apply Standard Fee Structure</span>
            </button>

            <button 
                onClick={() => handleToggle(true)}
                disabled={loading}
                className={cn(
                    "p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-2",
                    applied ? "border-emerald-600 bg-emerald-50/20 text-emerald-900" : "border-slate-100 text-slate-400 hover:border-slate-200"
                )}
            >
                {applied ? <CheckCircle2 className="text-emerald-600" size={20} /> : <Circle size={20} className="text-slate-200" />}
                <span className="text-xs font-black uppercase tracking-widest">Apply Scholarship</span>
                <span className="text-[9px] font-bold opacity-60">Submit for Fee Concessions</span>
            </button>
        </div>
        {loading && <div className="text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={20} /></div>}
    </div>
  );
}
