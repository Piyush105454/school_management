"use client";

import React, { useState, useMemo } from "react";
import { Search, Filter, X, ClipboardCheck } from "lucide-react";
import { FinalAdmissionTable } from "./FinalAdmissionTable";

const CLASSES = ["LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const FEE_STATUSES = [
  { value: "SCHOLARSHIP", label: "Scholarship Applied" },
  { value: "NORMAL", label: "Normal Fee Selected" },
  { value: "PENDING", label: "Fee Choice Pending" }
];

export function FinalAdmissionDashboard({ 
  applicants 
}: { 
  applicants: any[] 
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [feeFilter, setFeeFilter] = useState("");

  const filteredApplicants = useMemo(() => {
    return applicants.filter((a) => {
      const studentName = a.inquiry?.studentName?.toLowerCase() || "";
      const email = (a.studentProfile?.user?.email || a.inquiry?.email || "").toLowerCase();
      const entryNumber = (a.entryNumber || "").toLowerCase();
      const query = searchQuery.toLowerCase();

      // Search match
      const matchesSearch = studentName.includes(query) || 
                          email.includes(query) || 
                          entryNumber.includes(query);
      if (!matchesSearch) return false;

      // Class filter
      if (classFilter && a.inquiry?.appliedClass !== classFilter) return false;

      // Fee status filter
      if (feeFilter) {
        if (feeFilter === "SCHOLARSHIP" && a.appliedScholarship !== true) return false;
        if (feeFilter === "NORMAL" && a.appliedScholarship !== false) return false;
        if (feeFilter === "PENDING" && a.appliedScholarship !== null) return false;
      }

      return true;
    });
  }, [applicants, searchQuery, classFilter, feeFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setClassFilter("");
    setFeeFilter("");
  };

  const hasActiveFilters = searchQuery || classFilter || feeFilter;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <ClipboardCheck size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase italic underline decoration-blue-500 decoration-4 underline-offset-8">Final Admission Approvals</h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Finalize enrollment and view application fee sources triggers rules.</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by name, email or entry ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
          </div>

          {/* Class Filter */}
          <select 
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Classes</option>
            {CLASSES.map(c => (
              <option key={c} value={c}>{c === "LKG" || c === "UKG" ? c : `Class ${c}`}</option>
            ))}
          </select>

          {/* Fee Status Filter */}
          <select 
            value={feeFilter}
            onChange={(e) => setFeeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Fee Types</option>
            {FEE_STATUSES.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-bold transition-colors"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium px-1">
            <Filter className="h-3 w-3" />
            <span>Showing {filteredApplicants.length} of {applicants.length} candidates</span>
          </div>
        )}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <FinalAdmissionTable applicants={filteredApplicants} />
      </div>
    </div>
  );
}
