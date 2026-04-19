"use client";

import { useState } from "react";
import { awardScholarshipDirect } from "@/features/admissions/actions/admissionActions";
import { CheckCircle, Clock, Award } from "lucide-react";

export default function AwardClient({ students }: { students: any[] }) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAward = async (admissionId: string) => {
    if (!confirm("Are you sure you want to Award 36,000 Scholarship to this student?")) return;
    setLoading(admissionId);
    const res = await awardScholarshipDirect(admissionId, 36000);
    setLoading(null);
    if (res.success) {
      alert("Scholarship Awarded Successfully!");
      window.location.reload();
    } else {
      alert("Error: " + (res as any).error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Award Scholarship</h1>
          <p className="text-slate-500 mt-1">Directly award scholarships to fully admitted students.</p>
        </div>
        <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2">
            <Award className="text-emerald-600" size={18} />
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">36,000 Max Award</span>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-slate-500 font-bold">
            <tr>
              <th className="px-6 py-4">Student Name</th>
              <th className="px-6 py-4">Class</th>
              <th className="px-6 py-4">Applied</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {students.map((student) => (
              <tr key={student.admissionId} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{student.studentName}</td>
                <td className="px-6 py-4 text-xs font-bold uppercase text-slate-500">{student.appliedClass}</td>
                <td className="px-6 py-4">
                  {student.appliedScholarship === true && (
                    <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 uppercase tracking-wider">Yes</span>
                  )}
                  {student.appliedScholarship === false && (
                    <span className="text-slate-400 font-bold text-[10px] bg-slate-50 px-2 py-1 rounded-md uppercase tracking-wider whitespace-nowrap">Normal Fee</span>
                  )}
                  {student.appliedScholarship === null && (
                    <span className="text-amber-500 font-bold text-[10px] bg-amber-50 px-2 py-1 rounded-md border border-amber-100 uppercase tracking-wider">Pending</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {student.awardedScholarship ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                      <CheckCircle size={14} /> Awarded (36,000)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-amber-600 font-bold text-xs">
                      <Clock size={14} /> Not Awarded
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {!student.awardedScholarship && (
                    <button 
                      onClick={() => handleAward(student.admissionId)}
                      disabled={loading === student.admissionId}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                      {loading === student.admissionId ? "Awarding..." : "Award 36,000"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No fully admitted students found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
