"use client";

import React, { useState, useEffect } from "react";
import { 
  GraduationCap, 
  Loader2, 
  Lock, 
  Unlock,
  Zap, 
  AlertCircle, 
  Image as ImageIcon, 
  Trash2, 
  Check, 
  ExternalLink,
  ChevronDown,
  User,
  ClipboardList,
  Calendar
} from "lucide-react";
import { 
  getStudentsWithCriteria, 
  saveStudentCriteria, 
  calculateStudentScholarship,
  getAssignedClassesForTeacher
} from "@/features/scholarship/actions/teacherScholarshipActions";
import { getPtmSchedule, savePtmSchedule } from "@/features/scholarship/actions/ptmScheduleActions";
import { proxyUploadDocument } from "@/features/admissions/actions/admissionActions";
import { ensureCompressed } from "@/lib/compression";
import { useSession } from "next-auth/react";

const MONTHS = [
  "April", "May", "June", "July", "August", "September", "October", "November", "December", 
  "January", "February", "March"
];

const YEARS = ["2025", "2026", "2027"];

export default function PtmCriteriaPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role !== "TEACHER";

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
  const [ptmAttended, setPtmAttended] = useState<boolean>(false);
  const [ptmImages, setPtmImages] = useState<string[]>([]);
  const [attendee, setAttendee] = useState<string>("");
  const [guardianName, setGuardianName] = useState<string>("");
  const [guardianRelation, setGuardianRelation] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // PTM Scheduling states
  const [scheduledPtmDate, setScheduledPtmDate] = useState<string | null>(null);
  const [tempPtmDate, setTempPtmDate] = useState<string>("");
  const [scheduleSaving, setScheduleSaving] = useState<boolean>(false);

  // Get today's local date in YYYY-MM-DD
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  // Determine if PTM edit access is open
  const isPtmOpen = isAdmin || (scheduledPtmDate !== null && todayStr === scheduledPtmDate);

  // Initialize defaults and load classes
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
  }, [session]);

  // Fetch PTM scheduled date when filters change
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!selectedMonth || !selectedYear) return;
      try {
        const res = await getPtmSchedule(selectedMonth, selectedYear);
        if (res.success && res.ptmDate) {
          setScheduledPtmDate(res.ptmDate);
          setTempPtmDate(res.ptmDate);
        } else {
          setScheduledPtmDate(null);
          setTempPtmDate("");
        }
      } catch (e) {
        console.error("Failed to load PTM schedule:", e);
      }
    };
    fetchSchedule();
  }, [selectedMonth, selectedYear]);

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
  const isSpecificRecordLocked = activeStudent?.ptm?.locked || false;
  const isLocked = isSpecificRecordLocked || !isPtmOpen;

  // Initialize form state when selected student changes
  useEffect(() => {
    if (activeStudent) {
      setPtmAttended(activeStudent.ptm.attended);
      setPtmImages(activeStudent.ptm.parentImages || []);
      setAttendee(activeStudent.ptm.attendee || "");
      setGuardianName(activeStudent.ptm.guardianName || "");
      setGuardianRelation(activeStudent.ptm.guardianRelation || "");
      setError(null);
      setSuccessMsg(null);
    } else {
      setPtmAttended(false);
      setPtmImages([]);
      setAttendee("");
      setGuardianName("");
      setGuardianRelation("");
    }
  }, [selectedStudentId, students]);

  // Handle PTM Date Scheduling by Admin
  const handleSaveSchedule = async () => {
    if (!tempPtmDate) return;
    setScheduleSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await savePtmSchedule(selectedMonth, selectedYear, tempPtmDate);
      if (res.success) {
        setScheduledPtmDate(tempPtmDate);
        setSuccessMsg(`PTM Date successfully scheduled for ${selectedMonth} ${selectedYear}: ${tempPtmDate}`);
      } else {
        setError(res.error || "Failed to save schedule.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save schedule.");
    } finally {
      setScheduleSaving(false);
    }
  };

  // Validate form entries before saving/calculating
  const validateForm = () => {
    if (ptmAttended) {
      if (!attendee) {
        setError("Please select who attended the meeting.");
        return false;
      }
      if (attendee === "Guardian") {
        if (!guardianName.trim()) {
          setError("Please specify the Guardian's Name.");
          return false;
        }
        if (!guardianRelation.trim()) {
          setError("Please specify the Guardian's Relation to the student.");
          return false;
        }
      }
    }
    return true;
  };

  // Handle Save, Calculate, and Lock (Combined into One Single Button)
  const handleSubmitAndLock = async () => {
    if (!activeStudent) return;
    setError(null);
    setSuccessMsg(null);
    if (!validateForm()) return;

    // Double Confirmation Popup
    const confirm1 = confirm(`Are you sure you want to submit and lock PTM attendance for ${activeStudent.studentName} for ${selectedMonth}?`);
    if (!confirm1) return;

    const confirm2 = confirm(`Confirm Lock?\n\nOnce locked, teachers will NOT be able to modify these details. Only Admin/Office users will be able to update them.`);
    if (!confirm2) return;

    setIsSubmitting(true);
    try {
      const finalAttendee = ptmAttended ? attendee : null;
      const finalGuardianName = ptmAttended && attendee === "Guardian" ? guardianName.trim() : null;
      const finalGuardianRelation = ptmAttended && attendee === "Guardian" ? guardianRelation.trim() : null;

      // 1. Save criteria state first
      const saveRes = await saveStudentCriteria(
        activeStudent.admissionId,
        selectedMonth,
        selectedYear,
        {
          attended: ptmAttended,
          parentImages: ptmImages,
          attendee: finalAttendee,
          guardianName: finalGuardianName,
          guardianRelation: finalGuardianRelation,
          ptmLocked: true
        }
      );

      if (!saveRes.success) {
        throw new Error(saveRes.error || "Failed to save criteria.");
      }

      // 2. Compute final scholarship score and LOCK PTM
      const calcRes = await calculateStudentScholarship(
        activeStudent.admissionId,
        selectedMonth,
        selectedYear,
        {
          attended: ptmAttended,
          ptmLocked: true
        }
      );

      if (calcRes.success) {
        const calculatedPtmAmount = (calcRes as any).ptmAmount ?? 0;
        setSuccessMsg(`PTM Attendance Submitted & Locked successfully! PTM Award: ₹${calculatedPtmAmount}`);
        setStudents(prev => prev.map(s => {
          if (s.admissionId === activeStudent.admissionId) {
            return {
              ...s,
              ptm: { 
                ...s.ptm,
                attended: ptmAttended, 
                parentImages: ptmImages,
                attendee: finalAttendee,
                guardianName: finalGuardianName,
                guardianRelation: finalGuardianRelation,
                locked: true
              },
              record: {
                totalAmount: calcRes.totalAmount!,
                ptmAmount: calculatedPtmAmount,
                guardianAmount: (calcRes as any).guardianAmount ?? 0,
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

  // Handle parent image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeStudent || isLocked) return;
    
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
      setSuccessMsg("Parent image(s) uploaded successfully! Click Submit & Lock to persist.");
    } catch (err: any) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // Delete local uploaded parent image
  const handleDeleteImage = (imgIdx: number) => {
    if (isLocked) return;
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
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight font-outfit">No Classes Available</h2>
        <p className="text-slate-400 text-sm mt-3">No classes were loaded. Please check your admin configuration or teacher profile class assignments.</p>
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
                <ClipboardList className="text-blue-400" size={22} />
              </div>
              <span className="text-[11px] font-black tracking-[0.2em] text-blue-400 uppercase">Scholarship Management</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black font-outfit uppercase tracking-tight">
              PTM Attendance
            </h1>
            <p className="text-slate-400 text-xs md:text-sm font-medium">
              Manage parent-teacher meeting status and upload verification images.
            </p>
          </div>

          {/* Scheduled Date Display Badge */}
          <div className="bg-white/10 border border-white/10 p-4 rounded-2xl flex items-center gap-3">
            <Calendar className="text-blue-400" size={20} />
            <div>
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-black">PTM Scheduled Date</p>
              <p className="text-xs font-black text-white mt-0.5">
                {scheduledPtmDate ? new Date(scheduledPtmDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "Not Scheduled"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Scheduler Card */}
      {isAdmin && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm space-y-4 animate-in fade-in-50">
          <div className="flex items-center gap-3">
            <Calendar className="text-slate-700" size={18} />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 font-outfit">Admin Panel: Schedule PTM Date</h2>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Choose Date</label>
              <input
                type="date"
                value={tempPtmDate}
                onChange={(e) => setTempPtmDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveSchedule}
              disabled={scheduleSaving || !tempPtmDate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
            >
              {scheduleSaving ? <Loader2 className="animate-spin w-4 h-4" /> : "Save Schedule Date"}
            </button>
          </div>
        </div>
      )}

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
          
          {/* Lock State Warning Banners */}
          {isSpecificRecordLocked ? (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 text-xs font-black font-outfit shadow-sm">
              <Lock className="shrink-0 text-amber-600" size={18} />
              This record is submitted & locked. Only Admin/Office users can modify it.
            </div>
          ) : !isPtmOpen ? (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 text-xs font-black font-outfit shadow-sm">
              <Lock className="shrink-0 text-amber-600" size={18} />
              {scheduledPtmDate 
                ? `PTM Attendance UI is closed. It is only open on the scheduled date: ${new Date(scheduledPtmDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}. (Today is ${new Date(todayStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}).` 
                : `PTM Attendance UI is closed. No PTM date has been scheduled yet for ${selectedMonth} ${selectedYear}.`
              }
            </div>
          ) : null}

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
              disabled={isLocked}
              onClick={() => {
                const nextVal = !ptmAttended;
                setPtmAttended(nextVal);
                if (!nextVal) {
                  setAttendee("");
                  setGuardianName("");
                  setGuardianRelation("");
                }
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                ptmAttended ? "bg-blue-600" : "bg-slate-200"
              } ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  ptmAttended ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* PTM Attendee Details */}
          {ptmAttended && (
            <div className="space-y-4 bg-slate-50/50 p-4 border border-slate-100 rounded-2xl animate-in fade-in-50 slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Who Attended the Meeting?</label>
                <div className="flex flex-wrap gap-2.5">
                  {["Mother", "Father", "Both", "Guardian"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      disabled={isLocked}
                      onClick={() => {
                        setAttendee(opt);
                        if (opt !== "Guardian") {
                          setGuardianName("");
                          setGuardianRelation("");
                        }
                      }}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${
                        attendee === opt
                          ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                      } ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {attendee === "Guardian" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in-50 slide-in-from-top-2 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Guardian Name</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={guardianName}
                      disabled={isLocked}
                      onChange={(e) => setGuardianName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors disabled:bg-slate-55 disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Relation to Student</label>
                    <input
                      type="text"
                      placeholder="e.g. Uncle, Aunt, Grandfather"
                      value={guardianRelation}
                      disabled={isLocked}
                      onChange={(e) => setGuardianRelation(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors disabled:bg-slate-55 disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

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
                      {!isLocked && (
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(imgIdx)}
                          className="p-1.5 bg-rose-500/80 hover:bg-rose-500 text-white rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
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
            {!isLocked && (
              <label className={`relative flex items-center justify-center gap-2 cursor-pointer border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 p-4 rounded-2xl transition-all ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                <input 
                  type="file" 
                  className="hidden" 
                  multiple 
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading || isLocked}
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
            )}
          </div>

          {/* Calculation Status Box */}
          {activeStudent.record && (
            <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">PTM Award</span>
                <div className="text-sm font-black text-slate-800 mt-1">₹{activeStudent.record.ptmAmount ?? 0}</div>
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
                disabled={isSubmitting || uploading}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-slate-950/10"
              >
                {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Lock size={14} />}
                Submit & Lock PTM Attendance
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
            Choose a confirmed student from class "{selectedClass}" in the dropdown list above to view and update their PTM attendance.
          </p>
        </div>
      )}
    </div>
  );
}
