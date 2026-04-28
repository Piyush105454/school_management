"use client";

import React, { useState } from "react";
import { 
  User, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  AlertCircle,
  CheckCircle,
  Eye,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import ViewDocumentButton from "@/app/(dashboard)/office/document-verification/components/ViewDocumentButton";

interface DocumentVerificationTableProps {
  applicants: any[];
}

export function DocumentVerificationTable({ applicants }: DocumentVerificationTableProps) {
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
              <th className="px-6 py-5 border-b border-slate-100">Upload Status</th>
              <th className="px-6 py-5 border-b border-slate-100">Verification</th>
              <th className="px-6 py-5 border-b border-slate-100 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {applicants.map((applicant) => {
              const hasAffidavit = !!applicant.studentDocuments?.affidavit;
              const isVerified = (applicant.studentProfile?.admissionStep ?? 0) >= 11 || applicant.studentProfile?.isFullyAdmitted;

              return (
                <tr 
                  key={applicant.id}
                  className="group transition-all hover:bg-slate-50/80"
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
                    {hasAffidavit ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-md border uppercase tracking-wider bg-emerald-50 text-emerald-700 border-emerald-100 w-fit">
                        <CheckCircle size={12} /> Uploaded
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-md border uppercase tracking-wider bg-amber-50 text-amber-700 border-amber-100 w-fit">
                        <AlertCircle size={12} /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {hasAffidavit ? (
                      isVerified ? (
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-md border uppercase tracking-wider bg-blue-50 text-blue-700 border-blue-100">
                          Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-md border uppercase tracking-wider bg-slate-100 text-slate-600 border-slate-200">
                          Review Needed
                        </span>
                      )
                    ) : (
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                          Awaiting Upload
                       </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {hasAffidavit ? (
                        <>
                          <ViewDocumentButton url={applicant.studentDocuments?.affidavit || ""} />
                          <Link 
                            href={`/office/admissions/${applicant.id}?step=10`}
                            className={cn(
                              "px-4 py-2 rounded-lg font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2",
                              isVerified 
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100" 
                                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                            )}
                          >
                            {isVerified ? <><CheckCircle size={14} /> Verified</> : <><Eye size={14} /> Review & Verify</>}
                          </Link>

                          <a
                            href={applicant.studentDocuments?.affidavit}
                            download
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all flex items-center gap-2"
                          >
                            <Download size={14} />
                          </a>
                        </>
                      ) : (
                        <span className="px-4 py-2 bg-slate-50 text-slate-400 rounded-lg font-black uppercase tracking-widest text-[10px] border border-slate-100 cursor-not-allowed">
                          No Actions
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
