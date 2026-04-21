"use client";

import React, { useState, useMemo } from "react";
import { AdmissionProcessList } from "@/features/admissions/components/AdmissionProcessList";
import { Search, Filter, X } from "lucide-react";
import { ADMISSION_STEPS, getComputedStep, getStatusText } from "../utils/admissionSteps";

const CLASSES = ["LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const STATUSES = [
  "Drafting Application",
  "Remarks Sent",
  "Awaiting Verification",
  "Document Verified",
  "Entrance Test",
  "Home Visit",
  "Final Approved",
  "Admitted"
];

const INSTITUTES = ["Dhanpuri Public School", "WES Academy", "Other"];

export function AdmissionsManager({ 
  admissions 
}: { 
  admissions: any[] 
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [stepFilter, setStepFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [instituteFilter, setInstituteFilter] = useState("");

  const filteredAdmissions = useMemo(() => {
    return admissions.filter((adm) => {
      const studentName = adm.inquiry?.studentName?.toLowerCase() || "";
      const email = (adm.profile?.user?.email || adm.inquiry?.email || "").toLowerCase();
      const entryNumber = (adm.entryNumber || "").toLowerCase();
      const query = searchQuery.toLowerCase();

      // Search match
      const matchesSearch = studentName.includes(query) || 
                          email.includes(query) || 
                          entryNumber.includes(query);
      if (!matchesSearch) return false;

      // Class filter
      if (classFilter && adm.inquiry?.appliedClass !== classFilter) return false;

      // Step filter
      if (stepFilter && String(getComputedStep(adm)) !== stepFilter) return false;

      // Status filter
      if (statusFilter && getStatusText(adm) !== statusFilter) return false;

      // Institute filter
      if (instituteFilter && adm.inquiry?.school !== instituteFilter) return false;

      return true;
    });
  }, [admissions, searchQuery, classFilter, stepFilter, statusFilter, instituteFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setClassFilter("");
    setStepFilter("");
    setStatusFilter("");
    setInstituteFilter("");
  };

  const hasActiveFilters = searchQuery || classFilter || stepFilter || statusFilter || instituteFilter;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 font-outfit tracking-tight">Admission Progress</h1>
          <p className="text-slate-500 font-medium text-sm">Track students through the different admission stages.</p>
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
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Classes</option>
            {CLASSES.map(c => (
              <option key={c} value={c}>{c === "LKG" || c === "UKG" ? c : `Class ${c}`}</option>
            ))}
          </select>

          {/* Step Filter */}
          <select 
            value={stepFilter}
            onChange={(e) => setStepFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Steps</option>
            {Object.entries(ADMISSION_STEPS).map(([val, conf]) => (
              <option key={val} value={val}>{conf.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Statuses</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Institute Filter */}
          <select 
            value={instituteFilter}
            onChange={(e) => setInstituteFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Institutes</option>
            {INSTITUTES.map(i => (
              <option key={i} value={i}>{i}</option>
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
            <span>Showing {filteredAdmissions.length} of {admissions.length} students</span>
          </div>
        )}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <AdmissionProcessList admissions={filteredAdmissions} />
      </div>
    </div>
  );
}
