"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Download, Search, Filter } from "lucide-react";
import { useInstitute } from "@/providers/InstituteProvider";

interface RecordRow {
  id: string;
  name: string;
  className: string;
  rollNo: string;
  scholarNo: string;
  month: string;
  scholarshipEarned: number;
  pendingDue: number;
  waiverGiven: number;
  finalDue: number;
  status: string;
}

export default function RecordsClient() {
  const { selectedInstitute, dbClasses } = useInstitute();
  
  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  
  const statuses = ["PENDING", "APPROVED", "PAID"];

  const [records, setRecords] = useState<RecordRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [filters, setFilters] = useState(() => {
    const currentMonthIndex = new Date().getMonth();
    const pastMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
    const defaultMonth = months[pastMonthIndex];
    return {
      month: defaultMonth,
      class: "",
      status: ""
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
      if (selectedInstitute && selectedInstitute !== "ALL") queryParams.append("institute", selectedInstitute);

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
    const lowerQuery = searchQuery.toLowerCase();
    return records.filter(r => 
      r.name.toLowerCase().includes(lowerQuery) ||
      r.rollNo.toString().toLowerCase().includes(lowerQuery) ||
      r.scholarNo.toString().toLowerCase().includes(lowerQuery) ||
      r.className.toLowerCase().includes(lowerQuery)
    );
  }, [records, searchQuery]);

  // Calculate Subtotals
  const subtotals = useMemo(() => {
    return filteredRecords.reduce((acc, curr) => {
      acc.scholarshipEarned += curr.scholarshipEarned;
      acc.pendingDue += curr.pendingDue;
      acc.waiverGiven += curr.waiverGiven;
      acc.finalDue += curr.finalDue;
      return acc;
    }, {
      scholarshipEarned: 0,
      pendingDue: 0,
      waiverGiven: 0,
      finalDue: 0
    });
  }, [filteredRecords]);

  return (
    <div className="p-6 md:p-10 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight">
            Scholarship Records
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Monthly dues and scholarship ledger.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Subtotals Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Total Earned</span>
          <span className="text-xl md:text-2xl font-black text-slate-800">₹{subtotals.scholarshipEarned.toLocaleString()}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Pending Due</span>
          <span className="text-xl md:text-2xl font-black text-slate-800">₹{subtotals.pendingDue.toLocaleString()}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Waiver Given</span>
          <span className="text-xl md:text-2xl font-black text-slate-800">₹{subtotals.waiverGiven.toLocaleString()}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider text-center">Final Due</span>
          <span className="text-xl md:text-3xl font-black text-blue-700">₹{subtotals.finalDue.toLocaleString()}</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search student, class, roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filters.month}
              onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Months</option>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            
            <select
              value={filters.class}
              onChange={(e) => setFilters(prev => ({ ...prev, class: e.target.value }))}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Classes</option>
              {dbClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs font-black text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Name</th>
                <th className="px-4 py-3 whitespace-nowrap">Class</th>
                <th className="px-4 py-3 whitespace-nowrap">Roll No.</th>
                <th className="px-4 py-3 whitespace-nowrap">Scholar No.</th>
                <th className="px-4 py-3 whitespace-nowrap">Month</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">Sch. Earned</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">Pending Due</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">Waiver Given</th>
                <th className="px-4 py-3 whitespace-nowrap text-right font-black text-blue-600">Final Due</th>
                <th className="px-4 py-3 whitespace-nowrap text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">Loading records...</td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">No records found.</td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-800">{r.name}</td>
                    <td className="px-4 py-3 font-medium text-slate-600">{r.className}</td>
                    <td className="px-4 py-3 font-medium text-slate-500">{r.rollNo}</td>
                    <td className="px-4 py-3 font-medium text-slate-500">{r.scholarNo}</td>
                    <td className="px-4 py-3 font-bold text-slate-600">{r.month}</td>
                    <td className="px-4 py-3 font-medium text-slate-600 text-right">₹{r.scholarshipEarned}</td>
                    <td className="px-4 py-3 font-medium text-slate-600 text-right">₹{r.pendingDue}</td>
                    <td className="px-4 py-3 font-medium text-slate-600 text-right">₹{r.waiverGiven}</td>
                    <td className="px-4 py-3 font-black text-blue-600 text-right">₹{r.finalDue}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider ${
                        r.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                        r.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
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
      </div>
    </div>
  );
}
