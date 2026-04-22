"use client";

import React, { useState } from "react";
import { 
  User, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Clock, 
  MapPin,
  AlertCircle,
  RotateCcw
} from "lucide-react";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";
import { OfficeHomeVisitManager } from "./OfficeHomeVisitManager";
import { undoAdmissionStep } from "../actions/admissionActions";

interface HomeVisitTableProps {
  applicants: any[];
  teachers?: any[];
}

export function HomeVisitTable({ applicants, teachers = [] }: HomeVisitTableProps) {
  const searchParams = useSearchParams();
  const expandId = searchParams.get("expand");
  const [expandedId, setExpandedId] = useState<string | null>(expandId);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string, classes: string }> = {
      "PASS": { label: "Completed", classes: "bg-emerald-50 text-emerald-700 border-emerald-100" },
      "FAIL": { label: "Unsuccessful", classes: "bg-red-50 text-red-700 border-red-100" },
      "PENDING": { label: "Scheduled", classes: "bg-blue-50 text-blue-700 border-blue-100" },
      "NOT_SCHEDULED": { label: "Not Scheduled", classes: "bg-slate-50 text-slate-500 border-slate-100" },
    };

    const config = configs[status] || configs["NOT_SCHEDULED"];

    return (
      <span className={cn(
        "text-[10px] font-black px-2.5 py-1 rounded-md border uppercase tracking-wider",
        config.classes
      )}>
        {config.label}
      </span>
    );
  };

  if (applicants.length === 0) {
    return (
      <div className="bg-white p-20 rounded-[40px] border border-slate-100 text-center space-y-4 shadow-sm">
        <AlertCircle size={48} className="text-slate-200 mx-auto" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No applicants found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead className="bg-slate-50/50 text-slate-500 text-[10px] font-black uppercase tracking-[0.15em]">
            <tr>
              <th className="px-6 py-5 border-b border-slate-100">ID</th>
              <th className="px-6 py-5 border-b border-slate-100">Student Applicant</th>
              <th className="px-6 py-5 border-b border-slate-100">Class</th>
              <th className="px-6 py-5 border-b border-slate-100">Visit Schedule</th>
              <th className="px-6 py-5 border-b border-slate-100">Status</th>
              <th className="px-6 py-5 border-b border-slate-100 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {applicants.map((applicant) => {
              const isExpanded = expandedId === applicant.id;
              const visit = applicant.homeVisit;
              const hasVisit = !!visit?.visitDate;

              return (
                <React.Fragment key={applicant.id}>
                  <tr 
                    className={cn(
                      "group transition-all hover:bg-slate-50/80 cursor-pointer",
                      isExpanded && "bg-slate-50/50"
                    )}
                    onClick={(e) => toggleExpand(applicant.id, e)}
                  >
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 whitespace-nowrap">
                        {applicant.entryNumber || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-blue-500 transition-colors shadow-sm">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm italic uppercase tracking-tight">{applicant.inquiry?.studentName}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{applicant.studentProfile?.user?.email || applicant.inquiry?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-black px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                        C-{applicant.inquiry?.appliedClass}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {hasVisit ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                             <Calendar size={12} className="text-indigo-500" /> {formatDate(visit.visitDate)}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                             <Clock size={12} /> {formatTime(visit.visitTime)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 uppercase italic">Not Scheduled</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(visit?.status || "NOT_SCHEDULED")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(visit?.status === "PASS" || visit?.status === "FAIL") && (
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm("Move this student back to the previous step (Scheduling)?")) {
                                const res = await undoAdmissionStep(applicant.id);
                                if (res.success) window.location.reload();
                              }
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                            title="Undo Step"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
                        <button 
                          className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            isExpanded 
                              ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" 
                              : "bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50"
                          )}
                        >
                          {isExpanded ? "Close" : "Manage"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} className="p-0 border-none">
                        <div className="bg-slate-50/50 p-6 md:p-10 border-b border-t border-slate-100">
                           <div className="max-w-5xl mx-auto animate-in slide-in-from-top-4 duration-300 border border-slate-200 rounded-[40px] overflow-hidden bg-white shadow-2xl shadow-slate-200/50">
                              <OfficeHomeVisitManager applicant={applicant} teachers={teachers} />
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
