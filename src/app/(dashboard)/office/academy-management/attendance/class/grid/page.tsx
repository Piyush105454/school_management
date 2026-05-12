"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, Filter, Search, User, Download, Calendar } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ClassAttendanceGrid() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [month, setMonth] = useState(searchParams.get("month") || "April");
  const [year, setYear] = useState(Number(searchParams.get("year")) || 2026);
  const [classId, setClassId] = useState<string>("");
  const [classes, setClasses] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysInMonth = 31; // Simplified for grid header

  useEffect(() => {
    // Fetch classes for dropdown
    const fetchClasses = async () => {
      const currentInstitute = searchParams.get("institute");
      const url = currentInstitute && currentInstitute !== "ALL" 
        ? `/api/classes?institute=${encodeURIComponent(currentInstitute)}`
        : "/api/classes";
        
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
        // If the current classId is not in the new classes list, reset it
        if (data.length > 0) {
          const isCurrentIdValid = data.some((c: any) => c.id.toString() === classId);
          if (!isCurrentIdValid) {
            setClassId(data[0].id.toString());
          }
        } else {
          setClassId("");
        }
      }
    };
    fetchClasses();
  }, [searchParams.get("institute")]);

  useEffect(() => {
    if (!classId) return;
    const fetchGridData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/attendance/class?class_id=${classId}&month=${month}&year=${year}`);
        const data = await res.json();
        setAttendanceData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGridData();
  }, [classId, month, year]);

  return (
    <div className="p-6 md:p-10 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <Link href="/office/academy-management/attendance" className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all shadow-sm">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-900 font-outfit uppercase">Class Attendance Grid</h1>
          <p className="text-xs text-slate-500 font-medium">Detailed daily view for students.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Select Class</label>
            <select 
              value={classId} 
              onChange={(e) => setClassId(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              <option value="">Choose a class...</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="w-40 space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Month</label>
            <select 
              value={month} 
              onChange={(e) => setMonth(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="w-28 space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Year</label>
            <select 
              value={year} 
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full bg-slate-50 border-none rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="border border-slate-100 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
              <div className="h-10 w-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm font-bold text-slate-400">Loading Grid...</p>
            </div>
          ) : attendanceData.length === 0 ? (
            <div className="p-20 text-center space-y-2">
              <div className="h-12 w-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                <Search className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">No Data Found</p>
              <p className="text-xs text-slate-500">Please select a class and month with existing attendance.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="sticky left-0 bg-slate-50 px-4 py-3 text-[10px] uppercase font-black text-slate-400 border-r border-slate-100 min-w-[60px]">Roll No</th>
                    <th className="sticky left-[60px] bg-slate-50 px-4 py-3 text-[10px] uppercase font-black text-slate-400 border-r border-slate-100 min-w-[180px]">Student Name</th>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                      <th key={d} className="px-2 py-3 text-[10px] font-black text-slate-400 text-center min-w-[32px] border-r border-slate-100 last:border-r-0">
                        {d}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-[10px] uppercase font-black text-slate-400 text-center border-l-2 border-slate-200 bg-slate-100/50">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {attendanceData.map((row) => {
                    const presentCount = Object.values(row.attendance).filter(v => v === "P" || v === "ML").length;
                    return (
                      <tr key={row.studentId} className="hover:bg-slate-50 transition-all group">
                        <td className="sticky left-0 bg-white group-hover:bg-slate-50 px-4 py-3 border-r border-slate-100 text-center text-[10px] font-black text-indigo-600">
                          {row.rollNumber || "--"}
                        </td>
                        <td className="sticky left-[60px] bg-white group-hover:bg-slate-50 px-4 py-3 border-r border-slate-100">
                          <Link href={`./attendance/student/${row.studentId}?month=${month}&year=${year}`} className="flex items-center gap-2">
                            <div className="h-6 w-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500">
                              {row.name.charAt(0)}
                            </div>
                            <span className="text-xs font-bold text-slate-700 truncate max-w-[140px]">{row.name}</span>
                          </Link>
                        </td>
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                          const status = row.attendance[d];
                          return (
                            <td key={d} className="p-0 text-center border-r border-slate-100 last:border-r-0">
                              <div className={cn(
                                "h-9 w-full flex items-center justify-center text-[10px] font-black",
                                status === "P" && "text-emerald-600 bg-emerald-50",
                                status === "A" && "text-rose-600 bg-rose-50",
                                status === "H" && "text-amber-600 bg-amber-50",
                                status === "L" && "text-blue-600 bg-blue-50",
                                status === "ML" && "text-indigo-600 bg-indigo-50",
                                status === "HD" && "text-violet-600 bg-violet-50",
                                !status && "text-slate-200"
                              )}>
                                {status || "-"}
                              </div>
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-xs font-black text-slate-900 text-center border-l-2 border-slate-200 bg-slate-50/30">
                          {presentCount}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
