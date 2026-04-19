"use client";

import React, { useState } from "react";
import { 
  User, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle,
  AlertCircle,
  BadgeCent
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { OfficeFinalManager } from "./OfficeFinalManager";

interface FinalAdmissionTableProps {
  applicants: any[];
}

export function FinalAdmissionTable({ applicants }: FinalAdmissionTableProps) {
  const searchParams = useSearchParams();
  const expandId = searchParams.get("expand");
  const [expandedId, setExpandedId] = useState<string | null>(expandId);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getFeeBadge = (appliedScholarship: boolean | null) => {
    if (appliedScholarship === true) {
      return (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm shadow-emerald-500/10">
          Scholarship
        </span>
      );
    }
    if (appliedScholarship === false) {
      return (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-800 border border-blue-200 shadow-sm shadow-blue-500/10 whitespace-nowrap">
          Normal Fee
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-200 animate-pulse whitespace-nowrap">
        Pending Choice
      </span>
    );
  };

  if (applicants.length === 0) {
    return (
      <div className="bg-white p-20 rounded-[40px] border border-slate-100 text-center space-y-4 shadow-sm">
        <AlertCircle size={48} className="text-slate-200 mx-auto" strokeWidth={1.5} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No candidates found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead className="bg-slate-50/50 text-slate-500 text-[10px] font-black uppercase tracking-[0.15em]">
            <tr>
              <th className="px-6 py-6 border-b border-slate-100">Entry ID</th>
              <th className="px-6 py-6 border-b border-slate-100">Student Candidate</th>
              <th className="px-6 py-6 border-b border-slate-100">Class</th>
              <th className="px-6 py-6 border-b border-slate-100">Fee Choice</th>
              <th className="px-6 py-6 border-b border-slate-100 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {applicants.map((applicant) => {
              const isExpanded = expandedId === applicant.id;
              const isAdmitted = applicant.studentProfile?.isFullyAdmitted;

              return (
                <React.Fragment key={applicant.id}>
                  <tr 
                    className={cn(
                      "group transition-all hover:bg-slate-50/80 cursor-pointer",
                      isExpanded && "bg-slate-50/50"
                    )}
                    onClick={() => toggleExpand(applicant.id)}
                  >
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1.5 rounded border border-blue-100 whitespace-nowrap">
                        {applicant.entryNumber || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-blue-500 transition-colors shadow-sm">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm italic uppercase tracking-tight">{applicant.inquiry?.studentName}</p>
                          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{applicant.inquiry?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-black px-2 py-1 bg-slate-100 text-slate-700 rounded border border-slate-200">
                        C-{applicant.inquiry?.appliedClass}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {getFeeBadge(applicant.appliedScholarship)}
                    </td>
                    <td className="px-6 py-5 text-right">
                       {isAdmitted ? (
                         <div className="flex items-center justify-end gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                            <CheckCircle size={14} /> Admitted
                         </div>
                       ) : (
                         <button 
                            className={cn(
                              "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all",
                              isExpanded 
                                ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20" 
                                : "bg-white text-blue-600 border border-blue-100 hover:bg-blue-50"
                            )}
                          >
                            {isExpanded ? "Close" : "Finalize"}
                          </button>
                       )}
                    </td>
                  </tr>
                  
                  {isExpanded && !isAdmitted && (
                    <tr>
                      <td colSpan={5} className="p-0 border-none">
                        <div className="bg-slate-50/30 p-8 md:p-12 border-b border-t border-slate-100">
                           <div className="max-w-4xl mx-auto animate-in slide-in-from-top-4 duration-300">
                              <OfficeFinalManager applicant={applicant} />
                           </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
