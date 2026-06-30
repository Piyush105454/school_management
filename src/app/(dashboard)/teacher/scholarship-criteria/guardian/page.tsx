"use client";

import React, { useState, useEffect } from "react";
import { 
  GraduationCap, 
  Loader2, 
  Lock, 
  Zap, 
  AlertCircle, 
  Check, 
  ChevronDown,
  User,
  Star
} from "lucide-react";
import { 
  getStudentsWithCriteria, 
  saveStudentCriteria, 
  calculateStudentScholarship,
  getAssignedClassesForTeacher
} from "@/features/scholarship/actions/teacherScholarshipActions";

const MONTHS = [
  "April", "May", "June", "July", "August", "September", "October", "November", "December", 
  "January", "February", "March"
];

const YEARS = ["2025", "2026", "2027"];

const GUARDIAN_CATEGORIES = [
  "Smooth communication with parent and teacher",
  "Supporting child with homework",
  "Supporting child health and wellness",
  "Supporting in-school development in class",
  "Other"
];

interface CategoryState {
  rating: number;
  comment: string;
}

export default function GuardianCriteriaPage() {
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  
  const [loading, setLoading] = useState<boolean>(false);
  const [classesLoading, setClassesLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // States for the active student form
  const [guardianComments, setGuardianComments] = useState<Record<string, CategoryState>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize defaults and load classes from teacher profile
  useEffect(() => {
    const curDate = new Date();
    const curMonthIndex = curDate.getMonth();
    const monthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonthName = monthNamesEn[curMonthIndex];
    if (MONTHS.includes(currentMonthName)) {
      setSelectedMonth(currentMonthName);
    } else {
      setSelectedMonth("April");
    }
    
    const curYearStr = String(curDate.getFullYear());
    if (YEARS.includes(curYearStr)) {
      setSelectedYear(curYearStr);
    } else {
      setSelectedYear("2026");
    }

    getAssignedClassesForTeacher()
      .then(res => {
        if (res.success && res.data) {
          setClasses(res.data);
          if (res.data.length > 0) {
            setSelectedClass(res.data[0]);
          }
        } else {
          setError(res.error || "Failed to load assigned classes.");
        }
        setClassesLoading(false);
      })
      .catch(err => {
        console.error("Error loading classes:", err);
        setError("Failed to load assigned classes.");
        setClassesLoading(false);
      });
  }, []);

  // Fetch students when filters change
  const fetchStudents = async () => {
    if (!selectedClass || !selectedMonth || !selectedYear) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setSelectedStudentId("");
    try {
      const res = await getStudentsWithCriteria(selectedClass, selectedMonth, selectedYear);
      if (res.success && res.data) {
        setStudents(res.data);
      } else {
        setError(res.error || "Failed to load students list.");
        setStudents([]);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedClass, selectedMonth, selectedYear]);

  // Find active student data
  const activeStudent = students.find(s => s.admissionId === selectedStudentId) || null;
  const isLocked = activeStudent?.guardian?.locked || false;

  // Initialize form state when selected student changes
  useEffect(() => {
    if (activeStudent) {
      const initialComments: Record<string, CategoryState> = {};
      GUARDIAN_CATEGORIES.forEach((_, idx) => {
        const key = `cat_${idx}`;
        const existingVal = activeStudent.guardian.comments?.[key];
        initialComments[key] = {
          rating: existingVal?.rating ?? (existingVal?.checked ? 5 : 1),
          comment: existingVal?.comment ?? ""
        };
      });
      setGuardianComments(initialComments);
      setError(null);
      setSuccessMsg(null);
    } else {
      setGuardianComments({});
    }
  }, [selectedStudentId, students]);

  // Calculate rating based on select ratings
  const calculatedRating = (() => {
    const vals = Object.values(guardianComments).map(c => c.rating || 0).filter(v => v > 0);
    if (vals.length === 0) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  })();

  // Change Category Rating
  const handleRatingChange = (key: string, val: number) => {
    if (isLocked) return;
    setGuardianComments(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        rating: val
      }
    }));
  };

  // Change Category Comment
  const handleCommentChange = (key: string, val: string) => {
    if (isLocked) return;
    setGuardianComments(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        comment: val
      }
    }));
  };

  // Handle Save, Calculate, and Lock (Combined into One Single Button)
  const handleSubmitAndLock = async () => {
    if (!activeStudent) return;
    setError(null);
    setSuccessMsg(null);

    // Double Confirmation Popup
    const confirm1 = confirm(`Are you sure you want to submit and lock Guardian Ratings for ${activeStudent.studentName} for ${selectedMonth}?`);
    if (!confirm1) return;

    const confirm2 = confirm(`Confirm Lock?\n\nOnce locked, you will NOT be able to modify these details. Only Admin/Office users will be able to update them.`);
    if (!confirm2) return;

    setIsSubmitting(true);
    try {
      // 1. Save criteria state first
      const saveRes = await saveStudentCriteria(
        activeStudent.admissionId,
        selectedMonth,
        selectedYear,
        {
          rating: calculatedRating,
          comments: guardianComments,
          guardianLocked: true
        }
      );

      if (!saveRes.success) {
        throw new Error(saveRes.error || "Failed to save criteria.");
      }

      // 2. Compute final scholarship score and LOCK Guardian ratings
      const calcRes = await calculateStudentScholarship(
        activeStudent.admissionId,
        selectedMonth,
        selectedYear,
        {
          rating: calculatedRating,
          guardianLocked: true
        }
      );

      if (calcRes.success) {
        const calculatedGuardianAmount = (calcRes as any).guardianAmount ?? 0;
        setSuccessMsg(`Guardian Ratings Submitted & Locked successfully! Guardian Award: ₹${calculatedGuardianAmount}`);
        setStudents(prev => prev.map(s => {
          if (s.admissionId === activeStudent.admissionId) {
            return {
              ...s,
              guardian: { 
                rating: calculatedRating, 
                comments: guardianComments,
                locked: true
              },
              record: {
                totalAmount: calcRes.totalAmount!,
                ptmAmount: (calcRes as any).ptmAmount ?? 0,
                guardianAmount: calculatedGuardianAmount,
                status: "PENDING",
                locked: (calcRes as any).locked || false,
                updatedAt: new Date()
              }
            };
          }
          return s;
        }));
      } else {
        setError(calcRes.error || "Failed to submit and lock score.");
      }
    } catch (err: any) {
      setError(err.message || "Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (classesLoading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center shadow-lg max-w-xl mx-auto my-12">
        <div className="bg-red-50 text-red-500 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight font-outfit">No Assigned Classes Found</h2>
        <p className="text-slate-400 text-sm mt-3">You do not have any assigned classes linked to your teacher profile. Please contact the administration to register your class assignments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-slate-900 text-white rounded-[32px] p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600/25 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/10 rounded-2xl flex items-center justify-center">
                <Star className="text-amber-400 fill-amber-400" size={22} />
              </div>
              <span className="text-[11px] font-black tracking-[0.2em] text-amber-400 uppercase">Scholarship Management</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black font-outfit uppercase tracking-tight">
              Guardian Ratings
            </h1>
            <p className="text-slate-400 text-xs md:text-sm font-medium">
              Assess parent-guardian support sub-criteria and save rating evaluations.
            </p>
          </div>
        </div>
      </div>

      {/* Selectors and Filters */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 md:p-6 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Class Assigned</label>
          <div className="relative">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-xs font-black uppercase tracking-wider text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white appearance-none cursor-pointer"
            >
              {classes.map((clsName) => (
                <option key={clsName} value={clsName}>
                  {clsName}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-4.5 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Month</label>
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-xs font-black uppercase tracking-wider text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white appearance-none cursor-pointer"
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-4.5 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Academic Year</label>
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-xs font-black uppercase tracking-wider text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white appearance-none cursor-pointer"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-4.5 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Student List Dropdown */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 md:p-6 shadow-sm space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Student</label>
        {loading ? (
          <div className="flex h-12 items-center px-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <Loader2 className="animate-spin text-blue-600 h-4 w-4 mr-2" />
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading student list...</span>
          </div>
        ) : students.length === 0 ? (
          <div className="flex h-12 items-center px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-400 font-bold uppercase tracking-wider">
            No confirmed students registered in class "{selectedClass}"
          </div>
        ) : (
          <div className="relative">
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-xs font-black uppercase tracking-wider text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white appearance-none cursor-pointer"
            >
              <option value="">-- Choose a student from class {selectedClass} --</option>
              {students.map((student) => (
                <option key={student.admissionId} value={student.admissionId}>
                  {student.studentName} (#{student.scholarNumber})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-4.5 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Feedbacks */}
      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-2xl p-4 text-rose-700 text-xs font-bold font-outfit shadow-sm animate-in fade-in-50">
          <AlertCircle className="shrink-0 text-rose-500" size={18} />
          {error}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-emerald-700 text-xs font-bold font-outfit shadow-sm animate-in fade-in-50">
          <Check className="shrink-0 text-emerald-500" size={18} />
          {successMsg}
        </div>
      )}

      {/* Form View */}
      {activeStudent ? (
        <div className="max-w-2xl mx-auto bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 animate-in slide-in-from-bottom-6 duration-300">
          
          {/* Lock State Warning Banner */}
          {isLocked && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 text-xs font-black font-outfit shadow-sm">
              <Lock className="shrink-0 text-amber-600" size={18} />
              This record is submitted & locked. Only Admin/Office users can modify it.
            </div>
          )}

          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                <Star size={18} className="fill-amber-400" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">Guardian Rating Form</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">5-Point Criteria Evaluation</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-lg font-black text-slate-800 font-outfit">{calculatedRating.toFixed(1)} / 5</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Calculated Rating</span>
            </div>
          </div>

          {/* Criteria Checklist */}
          <div className="space-y-4">
            {GUARDIAN_CATEGORIES.map((category, idx) => {
              const key = `cat_${idx}`;
              const state = guardianComments[key] || { rating: 5, comment: "" };

              return (
                <div key={key} className="border border-slate-100 bg-white rounded-2xl p-4 transition-all duration-300 shadow-sm">
                  <div className="flex items-center gap-3">
                    <select
                      value={state.rating ?? 5}
                      disabled={isLocked}
                      onChange={(e) => handleRatingChange(key, Number(e.target.value))}
                      className="bg-white border border-slate-200 rounded-lg p-1 text-xs font-black text-slate-700 outline-none focus:border-amber-400 shrink-0 disabled:bg-slate-50 disabled:cursor-not-allowed"
                    >
                      {[1, 2, 3, 4, 5].map((num) => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                    
                    <div className="flex-1 space-y-2">
                      <span className="text-xs font-black text-slate-800">
                        {category}
                      </span>

                      {/* Comment input field */}
                      <div className="transition-all animate-in fade-in-50 slide-in-from-top-1">
                        <input 
                          type="text" 
                          placeholder="Add a small comment (optional)..."
                          value={state.comment}
                          disabled={isLocked}
                          onChange={(e) => handleCommentChange(key, e.target.value)}
                          className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-amber-400 transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {activeStudent.record && (
            <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Guardian Rating Award</span>
                <div className="text-sm font-black text-slate-800 mt-1">₹{activeStudent.record.guardianAmount ?? 0}</div>
              </div>
              <div className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                activeStudent.record.status === "APPROVED" 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                  : activeStudent.record.status === "PAID"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                {activeStudent.record.status}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-slate-100">
            {isLocked ? (
              <button
                type="button"
                disabled
                className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-400 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest cursor-not-allowed"
              >
                <Lock size={14} />
                Submitted & Locked
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitAndLock}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-slate-950/10"
              >
                {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Lock size={14} />}
                Submit & Lock Guardian Ratings
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Empty placeholder card when no student is selected */
        <div className="bg-white border border-slate-100 rounded-[32px] p-12 text-center shadow-sm max-w-xl mx-auto space-y-4">
          <div className="bg-blue-50 text-blue-500 rounded-2xl p-4 w-14 h-14 flex items-center justify-center mx-auto">
            <User size={24} />
          </div>
          <h3 className="text-slate-800 font-black font-outfit text-base uppercase tracking-tight">Select a Student</h3>
          <p className="text-slate-400 text-xs leading-relaxed max-w-md mx-auto">
            Choose a confirmed student from class "{selectedClass}" in the dropdown list above to view and update their Guardian ratings.
          </p>
        </div>
      )}
    </div>
  );
}
