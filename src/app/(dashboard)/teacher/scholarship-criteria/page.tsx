"use client";

import React, { useState, useEffect } from "react";
import { 
  GraduationCap, 
  Loader2, 
  Save, 
  Zap, 
  AlertCircle, 
  Image as ImageIcon, 
  Trash2, 
  Check, 
  ExternalLink,
  ChevronDown,
  User,
  ShieldAlert,
  ClipboardList,
  Star
} from "lucide-react";
import { 
  getStudentsWithCriteria, 
  saveStudentCriteria, 
  calculateStudentScholarship 
} from "@/features/scholarship/actions/teacherScholarshipActions";
import { proxyUploadDocument } from "@/features/admissions/actions/admissionActions";
import { ensureCompressed } from "@/lib/compression";

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
  checked: boolean;
  comment: string;
}

export default function ScholarshipCriteriaPage() {
  const [classes, setClasses] = useState<any[]>([]);
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
  const [ptmAttended, setPtmAttended] = useState<boolean>(false);
  const [ptmImages, setPtmImages] = useState<string[]>([]);
  const [guardianComments, setGuardianComments] = useState<Record<string, CategoryState>>({});
  const [uploading, setUploading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Initialize defaults
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

    fetch("/api/classes")
      .then(res => res.json())
      .then(data => {
        setClasses(data || []);
        if (data && data.length > 0) {
          setSelectedClass(data[0].name);
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

  // Initialize form state when selected student changes
  useEffect(() => {
    if (activeStudent) {
      setPtmAttended(activeStudent.ptm.attended);
      setPtmImages(activeStudent.ptm.parentImages || []);
      
      const initialComments: Record<string, CategoryState> = {};
      GUARDIAN_CATEGORIES.forEach((_, idx) => {
        const key = `cat_${idx}`;
        const existingVal = activeStudent.guardian.comments?.[key];
        initialComments[key] = {
          checked: existingVal?.checked ?? false,
          comment: existingVal?.comment ?? ""
        };
      });
      setGuardianComments(initialComments);
      setError(null);
      setSuccessMsg(null);
    } else {
      setPtmAttended(false);
      setPtmImages([]);
      setGuardianComments({});
    }
  }, [selectedStudentId, students]);

  // Calculate rating based on checked sub-criteria
  const calculatedRating = Object.values(guardianComments).filter(c => c.checked).length;

  // Toggle Category Checkbox
  const handleToggleCategory = (key: string) => {
    setGuardianComments(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        checked: !prev[key].checked
      }
    }));
  };

  // Change Category Comment
  const handleCommentChange = (key: string, val: string) => {
    setGuardianComments(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        comment: val
      }
    }));
  };

  // Handle save ratings & PTM
  const handleSave = async () => {
    if (!activeStudent) return;
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await saveStudentCriteria(
        activeStudent.admissionId,
        selectedMonth,
        selectedYear,
        {
          attended: ptmAttended,
          parentImages: ptmImages,
          rating: calculatedRating,
          comments: guardianComments
        }
      );
      if (res.success) {
        setSuccessMsg("Ratings and PTM saved successfully!");
        // Refresh local student record state
        setStudents(prev => prev.map(s => {
          if (s.admissionId === activeStudent.admissionId) {
            return {
              ...s,
              ptm: { attended: ptmAttended, parentImages: ptmImages },
              guardian: { rating: calculatedRating, comments: guardianComments }
            };
          }
          return s;
        }));
      } else {
        setError(res.error || "Failed to save record.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Calculate & Fill Scholarship Score
  const handleCalculate = async () => {
    if (!activeStudent) return;
    setIsCalculating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      // 1. Save state first
      await saveStudentCriteria(
        activeStudent.admissionId,
        selectedMonth,
        selectedYear,
        {
          attended: ptmAttended,
          parentImages: ptmImages,
          rating: calculatedRating,
          comments: guardianComments
        }
      );

      // 2. Compute final scholarship score
      const res = await calculateStudentScholarship(
        activeStudent.admissionId,
        selectedMonth,
        selectedYear,
        {
          attended: ptmAttended,
          rating: calculatedRating
        }
      );

      if (res.success) {
        setSuccessMsg(`Scholarship Score Filled Successfully! Total amount calculated: ₹${res.totalAmount}`);
        // Refresh local student record state
        setStudents(prev => prev.map(s => {
          if (s.admissionId === activeStudent.admissionId) {
            return {
              ...s,
              ptm: { attended: ptmAttended, parentImages: ptmImages },
              guardian: { rating: calculatedRating, comments: guardianComments },
              record: {
                totalAmount: res.totalAmount!,
                status: "PENDING",
                updatedAt: new Date()
              }
            };
          }
          return s;
        }));
      } else {
        setError(res.error || "Failed to calculate scores.");
      }
    } catch (err: any) {
      setError(err.message || "Calculation failed.");
    } finally {
      setIsCalculating(false);
    }
  };

  // Handle parent image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeStudent) return;
    
    setUploading(true);
    setError(null);
    setSuccessMsg(null);
    
    try {
      const currentImages = [...ptmImages];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await ensureCompressed(file, 0.5);
        
        const formData = new FormData();
        formData.append("file", compressed);
        formData.append("admissionId", activeStudent.admissionId);
        formData.append("category", "scholarship-ptm");
        
        const res = await proxyUploadDocument(formData);
        if (res.success && res.publicUrl) {
          currentImages.push(res.publicUrl);
        } else {
          throw new Error(res.error || "File upload failed.");
        }
      }
      
      setPtmImages(currentImages);
      setSuccessMsg("Parent image(s) uploaded successfully! Click save to persist.");
    } catch (err: any) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // Delete local uploaded parent image
  const handleDeleteImage = (imgIdx: number) => {
    if (!confirm("Are you sure you want to remove this image?")) return;
    setPtmImages(prev => prev.filter((_, i) => i !== imgIdx));
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
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/25 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/10 rounded-2xl flex items-center justify-center">
                <GraduationCap className="text-blue-400" size={22} />
              </div>
              <span className="text-[11px] font-black tracking-[0.2em] text-blue-400 uppercase">Scholarship Management</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black font-outfit uppercase tracking-tight">
              Scholarship Ratings & PTM
            </h1>
            <p className="text-slate-400 text-xs md:text-sm font-medium">
              Manage parent ratings and PTM attendance, and automatically fetch/fill student scholarship scores.
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
              {classes.map((cls) => (
                <option key={cls.id} value={cls.name}>
                  {cls.name}
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

      {/* Split Form View */}
      {activeStudent ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-in slide-in-from-bottom-6 duration-300">
          
          {/* LEFT SIDE: PTM Attendance & Uploads */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <ClipboardList size={18} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">PTM Attendance Form</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Parent-Teacher Meeting Status</p>
              </div>
            </div>

            {/* PTM Toggle */}
            <div className="flex items-center justify-between bg-slate-50/50 p-4 border border-slate-100 rounded-2xl">
              <div>
                <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Meeting Attendance</span>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Did the parent/guardian attend the meeting?</p>
              </div>
              <button
                type="button"
                onClick={() => setPtmAttended(!ptmAttended)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  ptmAttended ? "bg-blue-600" : "bg-slate-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    ptmAttended ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* PTM Image Uploads */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Parent Images (Meeting Proof)</label>
              
              {/* Image previews */}
              {ptmImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {ptmImages.map((imgUrl, imgIdx) => (
                    <div key={imgIdx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 shadow-sm group">
                      <img 
                        src={imgUrl} 
                        alt="Parent meeting attachment" 
                        className="h-full w-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2.5 transition-all">
                        <a
                          href={`/api/view-doc?id=${activeStudent.admissionId}&field=${imgIdx}&type=ptm&month=${selectedMonth}&year=${selectedYear}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                          title="View Full Image"
                        >
                          <ExternalLink size={14} />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(imgIdx)}
                          className="p-1.5 bg-rose-500/80 hover:bg-rose-500 text-white rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-100 rounded-2xl p-6 text-center text-slate-400 text-xs font-bold">
                  No images uploaded yet.
                </div>
              )}

              {/* Upload Input */}
              <label className={`relative flex items-center justify-center gap-2 cursor-pointer border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 p-4 rounded-2xl transition-all ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                <input 
                  type="file" 
                  className="hidden" 
                  multiple 
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4 text-blue-600" />
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Uploading and compressing...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon size={18} className="text-slate-400" />
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Upload Parent Image(s)</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* RIGHT SIDE: Guardian Ratings & Comments */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
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
                <span className="text-lg font-black text-slate-800 font-outfit">{calculatedRating} / 5</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Calculated Rating</span>
              </div>
            </div>

            {/* Criteria Checklist */}
            <div className="space-y-4">
              {GUARDIAN_CATEGORIES.map((category, idx) => {
                const key = `cat_${idx}`;
                const state = guardianComments[key] || { checked: false, comment: "" };

                return (
                  <div key={key} className={`border border-slate-100 rounded-2xl p-4 transition-all duration-300 ${state.checked ? "bg-amber-50/10 border-amber-200/50 shadow-sm" : "bg-white"}`}>
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleCategory(key)}
                        className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                          state.checked 
                            ? "bg-amber-400 border-amber-400 text-white" 
                            : "border-slate-300 hover:border-amber-400 bg-white"
                        }`}
                      >
                        {state.checked && <Check size={14} className="stroke-[3]" />}
                      </button>
                      
                      <div className="flex-1 space-y-2">
                        <span className={`text-xs font-bold transition-colors ${state.checked ? "text-slate-800" : "text-slate-500"}`}>
                          {category}
                        </span>

                        {/* Comment input field */}
                        <div className="transition-all animate-in fade-in-50 slide-in-from-top-1">
                          <input 
                            type="text" 
                            placeholder="Add a small comment (optional)..."
                            value={state.comment}
                            onChange={(e) => handleCommentChange(key, e.target.value)}
                            className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-amber-400 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calculation Status Box */}
            {activeStudent.record && (
              <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Scholarship Score</span>
                  <div className="text-sm font-black text-slate-800 mt-1">₹{activeStudent.record.totalAmount} (Calculated)</div>
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

            {/* Actions for active student */}
            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isCalculating || uploading}
                className="flex-1 flex items-center justify-center gap-2 border-2 border-slate-200 text-slate-700 hover:border-slate-900 hover:bg-slate-50 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={14} />}
                Save Rating & PTM
              </button>

              <button
                type="button"
                onClick={handleCalculate}
                disabled={isSaving || isCalculating || uploading}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-slate-950/10"
              >
                {isCalculating ? <Loader2 className="animate-spin w-4 h-4" /> : <Zap size={14} />}
                Fill Score
              </button>
            </div>

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
            Choose a confirmed student from class "{selectedClass}" in the dropdown list above to view and update their PTM attendance, parent pictures, and Guardian sub-criteria ratings.
          </p>
        </div>
      )}

    </div>
  );
}
