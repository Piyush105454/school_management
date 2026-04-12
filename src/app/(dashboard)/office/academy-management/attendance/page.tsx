"use client";

import React, { useState, useEffect } from "react";
import { CalendarCheck, ChevronRight, AlertCircle, FileText, Users } from "lucide-react";
import AttendanceUploader from "@/features/academy/components/AttendanceUploader";
import Link from "next/link";

export default function AttendancePage() {
  const [month, setMonth] = useState("April");
  const [year, setYear] = useState(2026);
  const [overallData, setOverallData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  const years = [2024, 2025, 2026, 2027];

  const fetchOverall = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/attendance/overall?month=${month}&year=${year}`);
      const data = await res.json();
      setOverallData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverall();
  }, [month, year]);

  return (
    <div className="p-6 md:p-10 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight">
            Attendance Management
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Global tracking and school-wide metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <AttendanceUploader onSuccess={fetchOverall} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="md:col-span-2 flex items-center gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Select Month</label>
            <select 
              value={month} 
              onChange={(e) => setMonth(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Select Year</label>
            <select 
              value={year} 
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full bg-slate-50 border-none rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <Link href={`/office/academy-management/attendance/class/grid?month=${month}&year=${year}`} className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-2xl hover:bg-indigo-100 transition-all group">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-900">Class Wise</p>
              <p className="text-[10px] text-indigo-600 font-medium">View Grids</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-indigo-400 group-hover:translate-x-1 transition-all" />
        </Link>
        <div className="flex items-center justify-center p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
          <div className="text-center">
            <p className="text-xs font-bold text-emerald-900">Avg. Attendance</p>
            <p className="text-xl font-black text-emerald-600">
              {overallData.length > 0 
                ? `${Math.round(overallData.reduce((acc, curr) => acc + curr.attendancePct, 0) / overallData.length)}%` 
                : '--'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="h-12 w-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-500 italic">Syncing metrics...</p>
          </div>
        ) : overallData.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-center gap-4">
            <div className="h-16 w-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center">
              <CalendarCheck className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-slate-800">No records for {month} {year}</p>
              <p className="text-sm text-slate-500 max-w-xs">Upload an attendance sheet for this month to see the analytics.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400">Date</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400">Day</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 text-center">Total</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 text-center">Present</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 text-center">Absent</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 text-right">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {overallData.map((row) => (
                  <tr key={row.id} className={`hover:bg-slate-50/50 transition-all ${row.attendancePct < 75 ? 'bg-red-50/30' : ''}`}>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">
                      {new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{row.day}</td>
                    <td className="px-6 py-4 text-sm font-black text-slate-600 text-center">{row.total}</td>
                    <td className="px-6 py-4 text-sm font-black text-emerald-600 text-center">{row.present}</td>
                    <td className="px-6 py-4 text-sm font-black text-rose-500 text-center">{row.absent}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {row.attendancePct < 75 && <AlertCircle className="h-3 w-3 text-red-500" />}
                        <span className={`text-sm font-black ${row.attendancePct < 75 ? 'text-red-600' : 'text-slate-900'}`}>
                          {row.attendancePct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
