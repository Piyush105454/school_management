"use client";

import React, { useState, useMemo } from "react";
import { Search, Filter, X, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { DocumentVerificationTable } from "./DocumentVerificationTable";

const CLASSES = ["LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const STATUSES = ["ALL", "UPLOADED", "PENDING_UPLOAD", "VERIFIED", "REVIEW_NEEDED"];

export function DocumentVerificationDashboard({ 
  applicants
}: { 
  applicants: any[]
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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

      // Status filter
      const hasAffidavit = !!a.studentDocuments?.affidavit;
      const isVerified = (a.studentProfile?.admissionStep ?? 0) >= 11 || a.studentProfile?.isFullyAdmitted;

      if (statusFilter && statusFilter !== "ALL") {
        if (statusFilter === "UPLOADED" && !hasAffidavit) return false;
        if (statusFilter === "PENDING_UPLOAD" && hasAffidavit) return false;
        if (statusFilter === "VERIFIED" && !isVerified) return false;
        if (statusFilter === "REVIEW_NEEDED" && (!hasAffidavit || isVerified)) return false;
      }

      return true;
    });
  }, [applicants, searchQuery, classFilter, statusFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setClassFilter("");
    setStatusFilter("");
  };

  const hasActiveFilters = searchQuery || classFilter || statusFilter;
  
  const withAffidavit = applicants.filter(a => !!a.studentDocuments?.affidavit);
  const withoutAffidavit = applicants.filter(a => !a.studentDocuments?.affidavit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase italic underline decoration-blue-500 decoration-4 underline-offset-8">Document Verification</h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Review and verify student affidavit documents.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                  <CheckCircle size={20} />
              </div>
              <div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Uploaded</p>
                  <p className="text-xl font-black text-emerald-900 leading-none">{withAffidavit.length}</p>
              </div>
          </div>
          <div className="bg-amber-50 px-6 py-3 rounded-2xl border border-amber-100 flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-600/20">
                  <AlertCircle size={20} />
              </div>
              <div>
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Pending</p>
                  <p className="text-xl font-black text-amber-900 leading-none">{withoutAffidavit.length}</p>
              </div>
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
              placeholder="Search by name, email or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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

          {/* Status Filter */}
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {STATUSES.map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
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
            <span>Showing {filteredApplicants.length} of {applicants.length} applicants</span>
          </div>
        )}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <DocumentVerificationTable applicants={filteredApplicants} />
      </div>
    </div>
  );
}
