"use client";

import { useState, useEffect } from "react";
import { getStudentKpiData, saveKpiData, getStudentMonthlyOverview } from "@/features/scholarship/actions/kpiActions";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

export default function StudentProfileClient({ id, student }: { id: string, student: any }) {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [year, setYear] = useState("2026");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [data, setData] = useState<any>(null);
  const [monthlyOverview, setMonthlyOverview] = useState<any[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    loadOverview();
  }, [year]);

  useEffect(() => {
    if (selectedMonth) {
      loadData();
    }
  }, [selectedMonth, year]);

  const loadOverview = async () => {
    setLoadingOverview(true);
    const res = await getStudentMonthlyOverview(id, year);
    if (res.success) setMonthlyOverview(res.data || []);
    setLoadingOverview(false);
  };

  const loadData = async () => {
    setLoading(true);
    const res = await getStudentKpiData(id, selectedMonth, year);
    if (res.success && res.data) {
      setData(res.data);
      reset({

        attendance: {
          totalDays: res.data.attendance?.totalDays || 0,
          presentDays: res.data.attendance?.presentDays || 0,
        },
        homework: {
          totalGiven: res.data.homework?.totalGiven || 0,
          totalDone: res.data.homework?.totalDone || 0,
        },
        guardian: {
          rating: res.data.guardian?.rating || 0,
        },
        ptm: {
          attended: res.data.ptm?.attended || false,
        }
      });
    }
    setLoading(false);
  };

  const onSubmit = async (formData: any) => {
    setLoading(true);
    setMessage("");
    const res = await saveKpiData(id, selectedMonth, year, {
      attendance: { totalDays: Number(formData.attendance.totalDays), presentDays: Number(formData.attendance.presentDays) },
      homework: { totalGiven: Number(formData.homework.totalGiven), totalDone: Number(formData.homework.totalDone) },
      guardian: { rating: Number(formData.guardian.rating) },
      ptm: { attended: formData.ptm.attended === true || formData.ptm.attended === 'true' }
    });
    setLoading(false);
    if (res.success) {
      setMessage(`Saved Successfully! Total Amount: ₹${res.totalAmount}`);
      loadData(); 
      loadOverview(); // Refresh list as well
    } else {
      setMessage("Error: " + res.error);
    }
  };

  const record = data?.record;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/office/scholarship/students" className="p-2 border rounded-full hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{student?.studentName || "Student Details"}</h1>
            <p className="text-slate-500 text-sm">Scholar #: {student?.scholarNumber || "N/A"} | Admission #: {student?.admissionNumber || "N/A"}</p>
          </div>
        </div>
        {selectedMonth && (
          <button 
            onClick={() => setSelectedMonth("")}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2"
          >
            ← Back to Overview
          </button>
        )}
      </div>

      <div className="flex gap-4 max-w-sm">
        <select value={year} onChange={(e) => setYear(e.target.value)} className="border p-2 rounded-md text-sm bg-white border-slate-300 w-full font-semibold">
          {["2025", "2026", "2027"].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {!selectedMonth ? (
        // --- Monthly Overview View ---
        loadingOverview ? (
          <p>Loading monthly overview...</p>
        ) : monthlyOverview.length > 0 ? (
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold">
                <tr>
                  <th className="px-6 py-4">Month</th>
                  <th className="px-6 py-4">Attendance %</th>
                  <th className="px-6 py-4">Homework %</th>
                  <th className="px-6 py-4">Guardian</th>
                  <th className="px-6 py-4">PTM</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {monthlyOverview.map((item) => (
                  <tr key={item.month} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{item.month}</td>
                    <td className="px-6 py-4">{item.attendance?.percentage !== null && item.attendance?.percentage !== undefined ? `${item.attendance.percentage.toFixed(1)}%` : "N/A"}</td>
                    <td className="px-6 py-4">{item.homework?.percentage !== null && item.homework?.percentage !== undefined ? `${item.homework.percentage.toFixed(1)}%` : "N/A"}</td>
                    <td className="px-6 py-4">{item.guardian?.rating !== null && item.guardian?.rating !== undefined ? `${item.guardian.rating}/10` : "N/A"}</td>
                    <td className="px-6 py-4">
                      {item.ptm ? (
                        item.ptm.attended ? <span className="text-green-600 font-bold flex items-center gap-1">Yes</span> : <span className="text-red-500 flex items-center gap-1">No</span>
                      ) : "N/A"}
                    </td>
                    <td className="px-6 py-4 font-bold text-blue-600">₹{item.record?.totalAmount ?? 0}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setSelectedMonth(item.month)}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-blue-700"
                      >
                        Fill Score
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500 text-center py-10">No data found for this year.</p>
        )
      ) : (
        // --- Edit Form View ---
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-slate-100 px-4 py-2 rounded-md font-semibold text-slate-700">
            Filling Scores for: {selectedMonth} {year}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard 
              title="Attendance"
              percentage={data?.attendance?.percentage}
              amount={record?.attendanceAmount || 0}
              success={(record?.attendanceAmount || 0) > 0}
              requiredThreshold={data?.criteria?.attendanceThreshold}
              maxAmount={data?.criteria?.attendanceAmount}
            >
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div><label className="text-[10px] text-slate-400">Total</label><input type="number" {...register("attendance.totalDays")} className="w-full border p-1 text-sm rounded mt-0.5" /></div>
                <div><label className="text-[10px] text-slate-400">Present</label><input type="number" {...register("attendance.presentDays")} className="w-full border p-1 text-sm rounded mt-0.5" /></div>
              </div>
            </KpiCard>

            <KpiCard 
              title="Homework"
              percentage={data?.homework?.percentage}
              amount={record?.homeworkAmount || 0}
              success={(record?.homeworkAmount || 0) > 0}
              requiredThreshold={data?.criteria?.homeworkThreshold}
              maxAmount={data?.criteria?.homeworkAmount}
            >
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div><label className="text-[10px] text-slate-400">Given</label><input type="number" {...register("homework.totalGiven")} className="w-full border p-1 text-sm rounded mt-0.5" /></div>
                <div><label className="text-[10px] text-slate-400">Done</label><input type="number" {...register("homework.totalDone")} className="w-full border p-1 text-sm rounded mt-0.5" /></div>
              </div>
            </KpiCard>

            <KpiCard 
              title="Guardian Rating"
              amount={record?.guardianAmount || 0}
              success={(record?.guardianAmount || 0) > 0}
              requiredThreshold={data?.criteria?.guardianRatingThreshold}
              maxAmount={data?.criteria?.guardianAmount}
            >
              <div><label className="text-[10px] text-slate-400">Score (1-10)</label><input type="number" max={10} min={0} {...register("guardian.rating")} className="w-full border p-1 text-sm rounded mt-0.5" /></div>
            </KpiCard>

            <KpiCard 
              title="PTM Attended"
              amount={record?.ptmAmount || 0}
              success={(record?.ptmAmount || 0) > 0}
              maxAmount={data?.criteria?.ptmAmount}
            >
              <label className="flex items-center gap-2 mt-4 cursor-pointer">
                <input type="checkbox" {...register("ptm.attended")} className="h-4 w-4 rounded" />
                <span className="text-xs font-bold text-slate-700">Attended</span>
              </label>
            </KpiCard>
          </div>

          <div className="bg-white border p-4 rounded-xl flex justify-between items-center max-w-md">
            <span className="font-bold text-slate-700">Total Earned</span>
            <span className="text-xl font-black text-blue-600">₹{record?.totalAmount || 0}</span>
          </div>

          {message && <p className={`text-sm text-center font-bold ${message.startsWith("Saved") ? "text-green-600" : "text-red-500"}`}>{message}</p>}

          <button type="submit" disabled={loading} className="w-full max-w-md bg-slate-900 text-white p-3 rounded-xl font-bold hover:bg-slate-800 disabled:bg-slate-300">
            {loading ? "Saving..." : "Calculate & Save Scores"}
          </button>
        </form>
      )}
    </div>
  );
}

function KpiCard({ title, percentage, amount, success, requiredThreshold, maxAmount, children }: { title: string, percentage?: number, amount: number, success: boolean, requiredThreshold?: number, maxAmount?: number, children: React.ReactNode }) {

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {percentage !== undefined && <p className="text-xs text-slate-400 font-medium">{percentage?.toFixed(1) ?? "0.0"}%</p>}
          {(requiredThreshold !== undefined || maxAmount !== undefined) && (
            <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
              {requiredThreshold !== undefined ? `Req: ${requiredThreshold}${title === "Guardian Rating" ? "/10" : "%"}` : ""}
              {maxAmount !== undefined ? ` (Max: ₹${maxAmount})` : ""}
            </p>
          )}
        </div>
        {success ? <CheckCircle2 className="text-green-500 h-5 w-5" /> : <XCircle className="text-slate-300 h-5 w-5" />}
      </div>
      <div className="flex-1 py-1">{children}</div>
      <div className="border-t pt-2 mt-2 flex justify-between items-center border-slate-100">
        <span className="text-xs text-slate-500">Reward</span>
        <span className={`font-bold text-sm ${success ? "text-green-600" : "text-slate-400"}`}>₹{amount}</span>
      </div>
    </div>
  );
}
