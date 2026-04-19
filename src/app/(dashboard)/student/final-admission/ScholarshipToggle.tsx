"use client";

import React, { useState } from "react";
import { applyScholarship } from "@/features/admissions/actions/admissionActions";
import { Loader2, CheckCircle2, Circle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScholarshipToggle({ admissionId, initialApplied }: { admissionId: string, initialApplied: boolean | null }) {
  const [agreed, setAgreed] = useState(initialApplied !== null);
  const [selected, setSelected] = useState<boolean | null>(initialApplied);
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState<boolean | null>(initialApplied);
  const [isLocked, setIsLocked] = useState(initialApplied !== null);

  const handleToggle = async () => {
    if (selected === null) return;
    setLoading(true);
    const res = await applyScholarship(admissionId, selected);
    setLoading(false);
    if (res.success) {
      setApplied(selected);
      setIsLocked(true);
      alert(selected ? "Scholarship Applied Successfully!" : "Normal Fee Option Confirmed!");
    } else {
      alert("Error: " + res.error);
    }
  };

  return (
    <div className="space-y-6">
        <label className={cn(
            "flex items-center gap-3 p-4 rounded-xl transition-all border",
            agreed ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50 border-slate-100",
            (isLocked || loading) ? "opacity-75 cursor-not-allowed" : "cursor-pointer hover:bg-slate-100/50"
        )}>
            <input 
                type="checkbox" 
                checked={agreed} 
                disabled={isLocked || loading}
                onChange={(e) => setAgreed(e.target.checked)} 
                className="h-5 w-5 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
            />
            <span className={cn(
                "text-xs font-black uppercase tracking-wide",
                agreed ? "text-emerald-800" : "text-slate-700"
            )}>I Agree to the above Admission Guidelines</span>
            {agreed && <CheckCircle2 size={18} className="text-emerald-500 ml-auto animate-in zoom-in-50 duration-200" />}
        </label>

        {agreed && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    Choose Fee Route Type {isLocked && <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 uppercase tracking-wider flex items-center gap-1"><ShieldAlert size={10}/> Locked</span>}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                        onClick={() => !isLocked && setSelected(false)}
                        disabled={loading || isLocked}
                        className={cn(
                            "p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-2",
                            selected === false ? "border-blue-600 bg-blue-50/20 text-blue-900 shadow-md ring-2 ring-blue-100" : "border-slate-100 bg-white text-slate-400 hover:border-slate-200",
                            (isLocked || loading) && "opacity-75 cursor-not-allowed"
                        )}
                    >
                        {selected === false ? <CheckCircle2 className="text-blue-600" size={20} /> : <Circle size={20} className="text-slate-200" />}
                        <span className="text-xs font-black uppercase tracking-widest">Normal Fee</span>
                        <span className="text-[9px] font-bold opacity-60">Apply Standard Fee Structure</span>
                    </button>

                    <button 
                        onClick={() => !isLocked && setSelected(true)}
                        disabled={loading || isLocked}
                        className={cn(
                            "p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-2",
                            selected === true ? "border-emerald-600 bg-emerald-50/20 text-emerald-900 shadow-md ring-2 ring-emerald-100" : "border-slate-100 bg-white text-slate-400 hover:border-slate-200",
                            (isLocked || loading) && "opacity-75 cursor-not-allowed"
                        )}
                    >
                        {selected === true ? <CheckCircle2 className="text-emerald-600" size={20} /> : <Circle size={20} className="text-slate-200" />}
                        <span className="text-xs font-black uppercase tracking-widest">Apply Scholarship</span>
                        <span className="text-[9px] font-bold opacity-60">Submit for Fee Concessions</span>
                    </button>
                </div>

                <div className="pt-2">
                    <button 
                        onClick={handleToggle}
                        disabled={loading || selected === null || isLocked}
                        className={cn(
                            "w-full p-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2",
                            (selected === null || loading || isLocked)
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                                : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98]"
                        )}
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : isLocked ? "Applied & Locked" : "Confirm & Apply Fee Option"}
                    </button>
                </div>
            </div>
        )}
    </div>
  );
}
