"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Download, Search, X, ArrowLeft, IndianRupee, ChevronRight } from "lucide-react";
import { useInstitute } from "@/providers/InstituteProvider";
import Link from "next/link";

interface RecordRow {
  id: string;
  admissionId: string;
  name: string;
  className: string;
  rollNo: string;
  scholarNo: string;
  month: string;
  year: string;
  totalSchoolFee: number;
  scholarshipEarned: number;
  pendingDue: number;
  waiverGiven: number;
  additionalCharge: number;
  finalDue: number;
  status: string;
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function RecordDetailPanel({
  record,
  onClose,
}: {
  record: RecordRow;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full md:max-w-lg md:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800">
          <div>
            <h2 className="text-lg font-black text-white">{record.name}</h2>
            <p className="text-xs text-slate-400 font-medium">
              {record.className} · {record.month} {record.year}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scholar Info */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-6 text-xs font-bold text-slate-500">
          <span>Roll No: <span className="text-slate-800">{record.rollNo}</span></span>
          <span>Scholar No: <span className="text-slate-800">{record.scholarNo}</span></span>
          <span>Status:
            <span className={`ml-1 px-2 py-0.5 rounded-full font-black ${
              record.status === "PAID" ? "bg-emerald-100 text-emerald-700" :
              record.status === "APPROVED" ? "bg-blue-100 text-blue-700" :
              "bg-amber-100 text-amber-700"
            }`}>
              {record.status}
            </span>
          </span>
        </div>

        {/* Fee Breakdown */}
        <div className="px-6 py-5 space-y-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Fee Summary</h3>

          <div className="space-y-2">
            <FeeRow label="Total School Fee" value={record.totalSchoolFee} color="text-slate-700" />
            <FeeRow label="Scholarship Earned" value={-record.scholarshipEarned} color="text-emerald-600" prefix="−" />
            <div className="border-t border-dashed border-slate-200 my-2" />
            <FeeRow label="Pending Due" value={record.pendingDue} color="text-slate-700" bold />
            {record.waiverGiven > 0 && (
              <FeeRow label="Waiver Given" value={-record.waiverGiven} color="text-blue-600" prefix="−" />
            )}
            {record.additionalCharge > 0 && (
              <FeeRow label="Additional Charge" value={record.additionalCharge} color="text-amber-600" prefix="+" />
            )}
            <div className="border-t-2 border-slate-200 mt-2 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-base font-black text-rose-600">Pending Money to Pay</span>
                <span className="text-xl font-black text-rose-600">₹{record.finalDue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <Link
            href={`/office/scholarship/students/${record.admissionId}`}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-bold py-3 rounded-xl hover:bg-slate-700 transition-all active:scale-95"
          >
            View Full Profile <ChevronRight className="h-4 w-4" />
          </Link>
          <button
            onClick={onClose}
            className="px-5 py-3 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function FeeRow({
  label,
  value,
  color,
  prefix,
  bold,
}: {
  label: string;
  value: number;
  color: string;
  prefix?: string;
  bold?: boolean;
}) {
  const display = Math.abs(value).toLocaleString();
  return (
    <div className={`flex justify-between items-center text-sm ${bold ? "font-black" : "font-medium"}`}>
      <span className="text-slate-600">{label}</span>
      <span className={color}>
        {prefix ?? ""}₹{display}
      </span>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function RecordsClient() {
  const { selectedInstitute, dbClasses } = useInstitute();

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const statuses = ["PENDING", "APPROVED", "PAID"];

  const [records, setRecords] = useState<RecordRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<RecordRow | null>(null);

  const [filters, setFilters] = useState(() => {
    const currentMonthIndex = new Date().getMonth();
    const pastMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
    return {
      month: months[pastMonthIndex],
      class: "",
      status: "",
    };
  });

  useEffect(() => {
    fetchRecords();
  }, [filters, selectedInstitute]);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.month) queryParams.append("months", filters.month);
      if (filters.class) queryParams.append("classes", filters.class);
      if (filters.status) queryParams.append("statuses", filters.status);
      if (selectedInstitute && selectedInstitute !== "ALL")
        queryParams.append("institute", selectedInstitute);

      const res = await fetch(`/api/scholarship/records?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    if (!searchQuery) return records;
    const q = searchQuery.toLowerCase();
    return records.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.rollNo.toLowerCase().includes(q) ||
        r.scholarNo.toLowerCase().includes(q) ||
        r.className.toLowerCase().includes(q)
    );
  }, [records, searchQuery]);

  const subtotals = useMemo(
    () =>
      filteredRecords.reduce(
        (acc, curr) => ({
          scholarshipEarned: acc.scholarshipEarned + curr.scholarshipEarned,
          pendingDue: acc.pendingDue + curr.pendingDue,
          waiverGiven: acc.waiverGiven + curr.waiverGiven,
          additionalCharge: acc.additionalCharge + curr.additionalCharge,
          finalDue: acc.finalDue + curr.finalDue,
        }),
        { scholarshipEarned: 0, pendingDue: 0, waiverGiven: 0, additionalCharge: 0, finalDue: 0 }
      ),
    [filteredRecords]
  );

  return (
    <div className="p-6 md:p-10 space-y-6 animate-in fade-in duration-300">
      {/* Detail Panel */}
      {selectedRecord && (
        <RecordDetailPanel record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight">
            Scholarship Records
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Monthly dues and scholarship ledger. Click any row to view details.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* Subtotals Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryCard label="Total Earned" value={subtotals.scholarshipEarned} color="text-emerald-600" />
        <SummaryCard label="Pending Due" value={subtotals.pendingDue} color="text-slate-800" />
        <SummaryCard label="Waiver Given" value={subtotals.waiverGiven} color="text-blue-600" />
        <SummaryCard label="Additional Charge" value={subtotals.additionalCharge} color="text-amber-600" />
        <SummaryCard label="Final Due" value={subtotals.finalDue} color="text-rose-600" highlight />
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student, class, roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 ml-auto">
            <select
              value={filters.month}
              onChange={(e) => setFilters((p) => ({ ...p, month: e.target.value }))}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Months</option>
              {months.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <select
              value={filters.class}
              onChange={(e) => setFilters((p) => ({ ...p, class: e.target.value }))}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Classes</option>
              {dbClasses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-black text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100 tracking-wider">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Name</th>
                <th className="px-4 py-3 whitespace-nowrap">Class</th>
                <th className="px-4 py-3 whitespace-nowrap">Roll No.</th>
                <th className="px-4 py-3 whitespace-nowrap">Scholar No.</th>
                <th className="px-4 py-3 whitespace-nowrap">Month</th>
                <th className="px-4 py-3 whitespace-nowrap text-right text-emerald-600">Sch. Earned</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">Pending Due</th>
                <th className="px-4 py-3 whitespace-nowrap text-right text-blue-600">Waiver Given</th>
                <th className="px-4 py-3 whitespace-nowrap text-right text-amber-600">Addl. Charge</th>
                <th className="px-4 py-3 whitespace-nowrap text-right text-rose-600 font-black">Final Due</th>
                <th className="px-4 py-3 whitespace-nowrap text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-slate-400 text-sm">
                    Loading records…
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-slate-400 text-sm">
                    No records found for the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedRecord(r)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-slate-800">{r.name}</td>
                    <td className="px-4 py-3 font-medium text-slate-600">{r.className}</td>
                    <td className="px-4 py-3 font-medium text-slate-500">{r.rollNo}</td>
                    <td className="px-4 py-3 font-medium text-slate-500">{r.scholarNo}</td>
                    <td className="px-4 py-3 font-bold text-slate-600">{r.month}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600 text-right">₹{r.scholarshipEarned.toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium text-slate-600 text-right">₹{r.pendingDue.toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium text-blue-600 text-right">
                      {r.waiverGiven > 0 ? `₹${r.waiverGiven.toLocaleString()}` : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 font-medium text-amber-600 text-right">
                      {r.additionalCharge > 0 ? `₹${r.additionalCharge.toLocaleString()}` : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 font-black text-right">
                      <span className={r.finalDue > 0 ? "text-rose-600" : "text-emerald-600"}>
                        ₹{r.finalDue.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider ${
                        r.status === "PAID"
                          ? "bg-emerald-100 text-emerald-700"
                          : r.status === "APPROVED"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Totals */}
        {filteredRecords.length > 0 && !isLoading && (
          <div className="border-t-2 border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-wider">
              <span className="mr-auto">{filteredRecords.length} Records</span>
              <span className="text-emerald-600 min-w-[80px] text-right">₹{subtotals.scholarshipEarned.toLocaleString()}</span>
              <span className="min-w-[80px] text-right">₹{subtotals.pendingDue.toLocaleString()}</span>
              <span className="text-blue-600 min-w-[80px] text-right">₹{subtotals.waiverGiven.toLocaleString()}</span>
              <span className="text-amber-600 min-w-[80px] text-right">₹{subtotals.additionalCharge.toLocaleString()}</span>
              <span className="text-rose-600 min-w-[80px] text-right font-black">₹{subtotals.finalDue.toLocaleString()}</span>
              <span className="min-w-[80px]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
  highlight,
}: {
  label: string;
  value: number;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-2xl border shadow-sm flex flex-col items-center justify-center gap-1 ${
        highlight
          ? "bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-100"
          : "bg-white border-slate-100"
      }`}
    >
      <span className={`text-[10px] font-black uppercase tracking-wider text-center ${highlight ? "text-rose-500" : "text-slate-400"}`}>
        {label}
      </span>
      <span className={`text-xl md:text-2xl font-black ${color}`}>
        ₹{value.toLocaleString()}
      </span>
    </div>
  );
}
