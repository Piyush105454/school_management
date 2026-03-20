"use client";

import React from "react";
import { Loader2, ExternalLink, FileText } from "lucide-react";
import Link from "next/link";

interface ApplicationsClientProps {
  admissions: any[];
}

export function ApplicationsClient({ admissions }: ApplicationsClientProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 font-outfit tracking-tight">Applications</h1>
        <p className="text-slate-500 font-medium">List of students who have started their admission process.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Applied Class</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admissions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-slate-500 py-12 font-medium">No applications found.</td>
                </tr>
              ) : (
                admissions.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">{adm.inquiry?.studentName}</p>
                        <p className="text-xs text-slate-500">{adm.inquiry?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                        Class {adm.inquiry?.appliedClass}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/office/admissions/${adm.id}`}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10 active:scale-95"
                      >
                        <FileText size={16} /> View Application
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
