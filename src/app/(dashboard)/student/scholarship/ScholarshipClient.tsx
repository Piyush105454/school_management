"use client";

import { useState, useEffect } from "react";
import { getStudentKpiData } from "@/features/scholarship/actions/kpiActions";

export default function ScholarshipClient({ admissionId }: { admissionId: string }) {
  const [month, setMonth] = useState("April");
  const [year, setYear] = useState("2026");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [month, year]);

  const loadData = async () => {
    setLoading(true);
    const res = await getStudentKpiData(admissionId, month, year);
    if (res.success) {
      setData(res.data);
    }
    setLoading(false);
  };

  const record = data?.record;

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-900">My Scholarship</h1>
        <div className="flex gap-2">
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="border p-2 rounded-md text-sm bg-white border-slate-300">
            {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(e.target.value)} className="border p-2 rounded-md text-sm bg-white border-slate-300">
            {["2025", "2026", "2027"].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : record ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-slate-800">{month} {year}</h2>
          </div>

          <div className="space-y-3">
            <KpiRow 
              label="Attendance" 
              value={`${data.attendance?.percentage?.toFixed(1) || 0}%`} 
              amount={record.attendanceAmount} 
              success={record.attendanceAmount > 0} 
            />
            <KpiRow 
              label="Homework" 
              value={`${data.homework?.percentage?.toFixed(1) || 0}%`} 
              amount={record.homeworkAmount} 
              success={record.homeworkAmount > 0} 
            />
            <KpiRow 
              label="Guardian Rating" 
              value={`${data.guardian?.rating || 0}/5`} 
              amount={record.guardianAmount} 
              success={record.guardianAmount > 0} 
            />
            <KpiRow 
              label="PTM Attended" 
              value={data.ptm?.attended ? "Yes" : "No"} 
              amount={record.ptmAmount} 
              success={record.ptmAmount > 0} 
            />
          </div>

          <div className="border-t pt-4 flex justify-between items-center font-bold text-lg text-slate-900">
            <span>Total Earned</span>
            <span>₹{record.totalAmount}</span>
          </div>

          <div className="flex justify-between items-center text-sm border-t pt-2 border-slate-100">
            <span className="text-slate-500">Status</span>
            <span className={`font-black uppercase tracking-wider text-xs px-3 py-1 rounded-full ${record.status === "PAID" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
              {record.status}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-500">
          No records found for {month} {year}.
        </div>
      )}
    </div>
  );
}

function KpiRow({ label, value, amount, success }: { label: string, value: any, amount: number, success: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0 border-slate-100">
      <div className="flex items-center gap-2">
        <span>{success ? "✅" : "❌"}</span>
        <span className="text-slate-700 font-medium text-sm">{label}</span>
        <span className="text-slate-400 text-xs">({value})</span>
      </div>
      <span className={`font-bold text-sm ${success ? "text-green-600" : "text-slate-400"}`}>
        ₹{amount}
      </span>
    </div>
  );
}
