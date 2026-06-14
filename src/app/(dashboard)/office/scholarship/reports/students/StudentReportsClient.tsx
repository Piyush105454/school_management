"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useInstitute } from "@/providers/InstituteProvider";
import { getDetailedStudentReports } from "@/features/scholarship/actions/reportActions";
import { 
  ChevronLeft, 
  Search, 
  Download, 
  Printer, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  IndianRupee,
  RefreshCw,
  SlidersHorizontal
} from "lucide-react";

interface StudentReportsClientProps {
  classesList: string[];
  limitToClasses?: string[];
}

export default function StudentReportsClient({ classesList, limitToClasses }: StudentReportsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedInstitute } = useInstitute();

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const years = ["2024", "2025", "2026", "2027"];

  // Default to URL params or current date
  const currentMonthName = months[new Date().getMonth()];
  const currentYearStr = new Date().getFullYear().toString();

  const [month, setMonth] = useState(searchParams.get("month") || currentMonthName);
  const [year, setYear] = useState(searchParams.get("year") || currentYearStr);
  const [selectedClass, setSelectedClass] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("SCHOLARSHIP");
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available classes based on teacher assignments if any
  const availableClasses = limitToClasses !== undefined ? limitToClasses : classesList;

  useEffect(() => {
    loadReports();
  }, [month, year, selectedClass, selectedInstitute]);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDetailedStudentReports({
        month,
        year,
        className: selectedClass || undefined,
        school: selectedInstitute,
        classesFilter: limitToClasses
      });

      if (res.success) {
        setStudentsData(res.data || []);
      } else {
        setError(res.error || "Failed to fetch student reports.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Filter students by search query (name or scholar/admission/entry number)
  const filteredStudents = studentsData.filter((student) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const nameMatch = student.studentName?.toLowerCase().includes(query);
    const scholarNumber = (student.scholarNumber || student.metaScholarNumber || student.admissionNumber || student.entryNumber || "")
      .toLowerCase()
      .includes(query);

    return nameMatch || scholarNumber;
  });

  // Calculate statistics
  const totalStudents = filteredStudents.length;
  const calculatedCount = filteredStudents.filter((s) => s.recordId).length;
  const paidCount = filteredStudents.filter((s) => s.status === "PAID").length;
  const approvedCount = filteredStudents.filter((s) => s.status === "APPROVED").length;
  const pendingCount = filteredStudents.filter((s) => s.status === "PENDING").length;

  const totalProjectedPayout = filteredStudents.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalDisbursedPayout = filteredStudents
    .filter((s) => s.status === "PAID")
    .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  // CSV Export logic
  const handleExportCSV = () => {
    const headers = [
      "Student Name",
      "Scholar/ID Number",
      "Class",
      "Attendance Pct",
      "Attendance Amt",
      "Homework Pct",
      "Homework Amt",
      "Guardian Rating",
      "Guardian Amt",
      "PTM Attended",
      "PTM Amt",
      "Adjustment Amt",
      "Total Earned",
      "Status"
    ];

    const rows = filteredStudents.map((s) => [
      s.studentName || "N/A",
      s.scholarNumber || s.metaScholarNumber || s.admissionNumber || s.entryNumber || "N/A",
      s.appliedClass || "N/A",
      s.attendancePct !== null ? `${s.attendancePct}%` : "N/A",
      s.attendanceAmount || 0,
      s.homeworkPct !== null ? `${s.homeworkPct}%` : "N/A",
      s.homeworkAmount || 0,
      s.guardianRating !== null ? `${s.guardianRating}/10` : "N/A",
      s.guardianAmount || 0,
      s.ptmAttended !== null ? (s.ptmAttended ? "Yes" : "No") : "N/A",
      s.ptmAmount || 0,
      s.adjustmentAmount || 0,
      s.totalAmount || 0,
      s.status || "NOT_CALCULATED"
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Student_Scholarship_Report_${month}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report logic
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 print:space-y-4 print:p-0">
      {/* Header and Back Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/office/scholarship/reports")}
            className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-outfit uppercase">
              Student Monthly Reports
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Detailed breakdown of student criteria evaluations and scholarship distribution.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={filteredStudents.length === 0}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl font-bold text-sm shadow-sm hover:border-slate-300 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            disabled={filteredStudents.length === 0}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-sm hover:shadow-indigo-500/10 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="h-4 w-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Print-Only Title block */}
      <div className="hidden print:block text-center space-y-2 pb-6 border-b-2 border-slate-200">
        <h1 className="text-3xl font-bold text-slate-900">Student Scholarship Report</h1>
        <p className="text-slate-600 font-semibold">
          Month: {month} {year} | School/Institute: {selectedInstitute || "All Institutes"}
        </p>
        <p className="text-xs text-slate-400">Generated on {new Date().toLocaleDateString()}</p>
      </div>

      {/* Filters Section */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm print:hidden">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[240px]">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">
              Search Student
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name or scholar ID..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white transition-all text-sm outline-none placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>

          <div className="w-full sm:w-auto min-w-[130px]">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white transition-all text-sm outline-none font-bold text-slate-800"
            >
              <option value="">All Classes</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  Class {cls}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-auto min-w-[130px]">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">
              Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white transition-all text-sm outline-none font-bold text-slate-800"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-auto min-w-[100px]">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">
              Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white transition-all text-sm outline-none font-bold text-slate-800"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-auto self-end">
            <button
              onClick={loadReports}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200/50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="flex items-center gap-6 border-b border-slate-200 overflow-x-auto no-scrollbar print:hidden mt-2">
        <button 
          onClick={() => setActiveTab('SCHOLARSHIP')}
          className={`pb-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all relative ${
            activeTab === 'SCHOLARSHIP' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Scholarship Report
          {activeTab === 'SCHOLARSHIP' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('ATTENDANCE')}
          className={`pb-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all relative ${
            activeTab === 'ATTENDANCE' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Attendance Report
          {activeTab === 'ATTENDANCE' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('HOMEWORK')}
          className={`pb-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all relative ${
            activeTab === 'HOMEWORK' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Homework Report
          {activeTab === 'HOMEWORK' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>
      </div>

      {activeTab === 'SCHOLARSHIP' && (
        <>
          {/* KPI Stats summary blocks */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-500 shadow-inner">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Students</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{totalStudents}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {calculatedCount} calculated ({totalStudents - calculatedCount} pending calculation)
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shadow-inner">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid Status</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{paidCount}</h3>
            <p className="text-[10px] text-green-600 font-bold mt-0.5">
              ₹{totalDisbursedPayout.toLocaleString("en-IN")} Disbursed
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending & Approved</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{pendingCount + approvedCount}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {pendingCount} pending, {approvedCount} approved
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
            <IndianRupee className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Projected Payout</p>
            <h3 className="text-xl font-black text-indigo-600 mt-0.5">₹{totalProjectedPayout.toLocaleString("en-IN")}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">For selected filters & query</p>
          </div>
        </div>
      </div>

      {/* Main Reports Table */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
            <p className="text-slate-400 text-sm font-semibold">Loading student report records...</p>
          </div>
        ) : filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Scholar ID / Roll</th>
                  <th className="px-6 py-4 text-center">Class</th>
                  <th className="px-6 py-4 text-center">Attendance Metric</th>
                  <th className="px-6 py-4 text-center">Homework Metric</th>
                  <th className="px-6 py-4 text-center">Guardian Rating</th>
                  <th className="px-6 py-4 text-center">PTM Attendance</th>
                  <th className="px-6 py-4 text-center">Adjustment</th>
                  <th className="px-6 py-4 text-right">Total Payout</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {filteredStudents.map((student) => {
                  const scholarId = student.scholarNumber || student.metaScholarNumber || student.admissionNumber || student.entryNumber || "N/A";

                  return (
                    <tr key={student.admissionId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link 
                          href={`/office/scholarship/students/${student.admissionId}`}
                          className="font-bold text-slate-900 hover:text-indigo-600 hover:underline transition-colors block"
                        >
                          {student.studentName || "N/A"}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-bold">
                        {scholarId}
                      </td>
                      <td className="px-6 py-4 text-center font-bold">
                        {student.appliedClass || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {student.attendancePct !== null ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="text-slate-800 font-bold">{student.attendancePct}%</span>
                            <span className="text-[10px] text-slate-400 font-bold">₹{student.attendanceAmount || 0}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {student.homeworkPct !== null ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="text-slate-800 font-bold">{student.homeworkPct}%</span>
                            <span className="text-[10px] text-slate-400 font-bold">₹{student.homeworkAmount || 0}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {student.guardianRating !== null ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="text-slate-800 font-bold">{student.guardianRating}/10</span>
                            <span className="text-[10px] text-slate-400 font-bold">₹{student.guardianAmount || 0}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {student.ptmAttended !== null ? (
                          <div className="inline-flex flex-col items-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              student.ptmAttended 
                                ? "bg-emerald-50 text-emerald-700" 
                                : "bg-rose-50 text-rose-700"
                            }`}>
                              {student.ptmAttended ? "Attended" : "Missed"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold mt-0.5">₹{student.ptmAmount || 0}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {student.adjustmentAmount ? (
                          <div className="inline-flex flex-col items-center" title={student.adjustmentNote || ""}>
                            <span className={`font-bold ${
                              student.adjustmentAmount > 0 ? "text-emerald-600" : "text-rose-600"
                            }`}>
                              {student.adjustmentAmount > 0 ? "+" : ""}₹{student.adjustmentAmount}
                            </span>
                            {student.adjustmentNote && (
                              <span className="text-[9px] text-slate-400 font-bold truncate max-w-[100px]">
                                {student.adjustmentNote}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">₹0</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900 text-sm">
                        ₹{(student.totalAmount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {student.recordId ? (
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                            student.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : student.status === "APPROVED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {student.status || "PENDING"}
                          </span>
                        ) : (
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-400">
                            NOT CALCULATED
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20 space-y-2">
            <Users className="h-10 w-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700">No report data found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              We couldn't find any students matching your selected filters, class name, or search query.
            </p>
          </div>
        )}
      </div>
        </>
      )}

      {activeTab === 'ATTENDANCE' && (
        <div className="bg-white border border-slate-100 rounded-3xl p-20 text-center shadow-sm animate-in fade-in duration-300">
          <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-700 uppercase tracking-tight">Attendance Reports</h2>
          <p className="text-slate-500 mt-2">Comprehensive student attendance metrics and analytics will appear here.</p>
        </div>
      )}

      {activeTab === 'HOMEWORK' && (
        <div className="bg-white border border-slate-100 rounded-3xl p-20 text-center shadow-sm animate-in fade-in duration-300">
          <CheckCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-700 uppercase tracking-tight">Homework Reports</h2>
          <p className="text-slate-500 mt-2">Detailed homework submission and performance metrics will appear here.</p>
        </div>
      )}
    </div>
  );
}
