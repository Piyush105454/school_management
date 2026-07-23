"use client";

import { useState, useMemo, useEffect } from "react";
import { awardScholarshipDirect, revokeScholarshipDirect } from "@/features/admissions/actions/admissionActions";
import { CheckCircle, Clock, Award, RotateCcw, Loader2, Search, School, Layers, X } from "lucide-react";
import { useInstitute } from "@/providers/InstituteProvider";

export default function AwardClient({ students }: { students: any[] }) {
  const { selectedInstitute, dbClasses } = useInstitute();
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 1. Filter students strictly by Global Institute Filter first
  const instituteStudents = useMemo(() => {
    if (!selectedInstitute || selectedInstitute === "ALL") return students;
    return students.filter((student) => student.school === selectedInstitute);
  }, [students, selectedInstitute]);

  // 2. Extract unique classes belonging ONLY to the selected institute
  const availableClasses = useMemo(() => {
    const classSet = new Set<string>();
    
    if (Array.isArray(instituteStudents)) {
      instituteStudents.forEach((s) => {
        if (s.appliedClass) classSet.add(String(s.appliedClass).trim());
      });
    }

    if (Array.isArray(dbClasses)) {
      dbClasses.forEach((c) => {
        if (c) classSet.add(String(c).trim());
      });
    }

    return Array.from(classSet).sort((a, b) => 
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [instituteStudents, dbClasses]);

  // 3. Reset selectedClass to "ALL" if selectedClass is not in the new institute's available classes
  useEffect(() => {
    if (selectedClass !== "ALL" && !availableClasses.includes(selectedClass)) {
      setSelectedClass("ALL");
    }
  }, [selectedInstitute, availableClasses, selectedClass]);

  // 4. Final filter by Class and Search Query
  const filteredStudents = useMemo(() => {
    return instituteStudents.filter((student) => {
      // Class Filter
      if (selectedClass && selectedClass !== "ALL") {
        if (String(student.appliedClass).trim() !== String(selectedClass).trim()) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = student.studentName?.toLowerCase().includes(query);
        const scholarMatch = student.scholarNumber?.toLowerCase().includes(query);
        const entryMatch = student.entryNumber?.toLowerCase().includes(query);
        if (!nameMatch && !scholarMatch && !entryMatch) {
          return false;
        }
      }

      return true;
    });
  }, [instituteStudents, selectedClass, searchQuery]);

  const handleAward = async (admissionId: string) => {
    if (!confirm("Are you sure you want to Award 36,000 Scholarship to this student?")) return;
    setLoading(admissionId);
    const res = await awardScholarshipDirect(admissionId, 36000);
    setLoading(null);
    if (res.success) {
      alert("Scholarship Awarded Successfully!");
      window.location.reload();
    } else {
      alert("Error: " + (res as any).error);
    }
  };

  const handleRevoke = async (admissionId: string) => {
    if (!confirm("Are you sure you want to REVOKE the scholarship for this student? This will clear the awarded amount.")) return;
    setLoading(admissionId);
    const res = await revokeScholarshipDirect(admissionId);
    setLoading(null);
    if (res.success) {
      alert("Scholarship Revoked successfully.");
      window.location.reload();
    } else {
      alert("Error revoking scholarship: " + (res as any).error);
    }
  };

  const hasActiveFilters = selectedClass !== "ALL" || searchQuery.trim() !== "" || (selectedInstitute && selectedInstitute !== "ALL");

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Award Scholarship</h1>
          <p className="text-slate-500 mt-1">Directly award scholarships to fully admitted students.</p>
        </div>
        <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2 self-start md:self-auto">
          <Award className="text-emerald-600" size={18} />
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">36,000 Max Award</span>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white border rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search student or scholar no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Class Filter Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 rounded-xl text-slate-500 text-xs font-bold uppercase tracking-wider">
                <Layers size={14} className="text-blue-600" />
                <span>Class:</span>
              </div>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer min-w-[140px]"
              >
                <option value="ALL">All Classes</option>
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls.toLowerCase().startsWith("class") ? cls : `Class ${cls}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count & Reset */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
              Showing <span className="text-blue-600 font-extrabold">{filteredStudents.length}</span> of {instituteStudents.length}
            </span>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSelectedClass("ALL");
                  setSearchQuery("");
                }}
                className="text-xs font-bold text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors"
              >
                <X size={13} /> Clear Filters
              </button>
            )}
          </div>

        </div>

        {/* Active Filter Badges Indicator */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Active Filters:</span>
          
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100">
            <School size={11} /> Institute: {selectedInstitute === "ALL" ? "All Institutes" : selectedInstitute}
          </span>

          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${selectedClass !== "ALL" ? "bg-purple-50 text-purple-700 border-purple-100" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
            <Layers size={11} /> Class: {selectedClass === "ALL" ? "All Classes" : (selectedClass.toLowerCase().startsWith("class") ? selectedClass : `Class ${selectedClass}`)}
          </span>

          {searchQuery && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-100">
              <Search size={11} /> Search: "{searchQuery}"
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-slate-500 font-bold">
            <tr>
              <th className="px-6 py-4">Student Name</th>
              <th className="px-6 py-4">Class</th>
              <th className="px-6 py-4">Applied</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredStudents.map((student) => (
              <tr key={student.admissionId} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">
                  <div>{student.studentName}</div>
                  {student.scholarNumber && (
                    <div className="text-[10px] text-slate-400 font-medium">No: {student.scholarNumber}</div>
                  )}
                </td>
                <td className="px-6 py-4 text-xs font-bold uppercase text-slate-500">{student.appliedClass}</td>
                <td className="px-6 py-4">
                  {student.appliedScholarship === true && (
                    <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 uppercase tracking-wider">Yes</span>
                  )}
                  {student.appliedScholarship === false && (
                    <span className="text-slate-400 font-bold text-[10px] bg-slate-50 px-2 py-1 rounded-md uppercase tracking-wider whitespace-nowrap">Normal Fee</span>
                  )}
                  {student.appliedScholarship === null && (
                    <span className="text-amber-500 font-bold text-[10px] bg-amber-50 px-2 py-1 rounded-md border border-amber-100 uppercase tracking-wider">Pending</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {student.awardedScholarship ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                      <CheckCircle size={14} /> Awarded ({student.scholarshipAmount ? student.scholarshipAmount.toLocaleString() : "36,000"})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-amber-600 font-bold text-xs">
                      <Clock size={14} /> Not Awarded
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {!student.awardedScholarship && (
                    <button 
                      onClick={() => handleAward(student.admissionId)}
                      disabled={loading === student.admissionId}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                      {loading === student.admissionId ? <Loader2 className="animate-spin" size={14}/> : "Award 36,000"}
                    </button>
                  )}
                  {student.awardedScholarship && (
                    <button 
                      onClick={() => handleRevoke(student.admissionId)}
                      disabled={loading === student.admissionId}
                      className="text-red-500 hover:text-red-700 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1 bg-red-50 px-3 py-2 rounded-xl border border-red-100 hover:bg-red-100 transition-all"
                    >
                      {loading === student.admissionId ? <Loader2 className="animate-spin" size={12}/> : <><RotateCcw size={12} /> Undo Award</>}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                  No students found for the selected institute / class filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
