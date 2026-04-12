"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ChevronLeft, User, Calendar, MapPin, Award, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export default function StudentAttendancePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const studentId = params.studentId as string;
  
  const [month, setMonth] = useState(searchParams.get("month") || "April");
  const [year, setYear] = useState(Number(searchParams.get("year")) || 2026);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  useEffect(() => {
    const fetchStudentData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/attendance/student?student_id=${studentId}&month=${month}&year=${year}`);
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudentData();
  }, [studentId, month, year]);

  if (isLoading) return <div className="p-20 text-center text-slate-400">Loading profile...</div>;
  if (!data?.student) return <div className="p-20 text-center text-slate-400">Student not found.</div>;

  const stats = {
    present: data.attendance.filter((a: any) => a.status === "P").length,
    absent: data.attendance.filter((a: any) => a.status === "A").length,
    total: data.attendance.length,
    pct: data.attendance.length > 0 
      ? Math.round((data.attendance.filter((a: any) => a.status === "P").length / data.attendance.length) * 100) 
      : 0
  };

  return (
    <div className="p-6 md:p-10 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <Link href="/office/academy-management/attendance" className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all shadow-sm">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-900 font-outfit uppercase">Student Attendance Profile</h1>
          <p className="text-xs text-slate-500 font-medium">Individual performance and history.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-4">
            <div className="h-24 w-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
              <User className="h-12 w-12" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">{data.student.name}</h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{data.student.studentId}</p>
            </div>
            <div className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl">
              <Award className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-bold text-slate-600">Overall Rank: #12</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase">Filters</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Month</label>
                <select 
                  value={month} 
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Year</label>
                <select 
                  value={year} 
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-3xl">
              <p className="text-[10px] uppercase font-bold text-emerald-800 opacity-60">Present</p>
              <p className="text-2xl font-black text-emerald-600">{stats.present}</p>
            </div>
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-3xl">
              <p className="text-[10px] uppercase font-bold text-rose-800 opacity-60">Absent</p>
              <p className="text-2xl font-black text-rose-600">{stats.absent}</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-3xl">
              <p className="text-[10px] uppercase font-bold text-indigo-800 opacity-60">Percentage</p>
              <p className="text-2xl font-black text-indigo-600">{stats.pct}%</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400">Date</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400">Class</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.attendance.map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-all">
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">
                      {new Date(a.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{a.className}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider
                        ${a.status === "P" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                      >
                        {a.status === "P" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {a.status === "P" ? "Present" : "Absent"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
