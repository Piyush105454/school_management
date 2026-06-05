"use client";

import React, { useState, useTransition } from "react";
import {
  createExamAction, updateExamAction, deleteExamAction, getExamsAction, getTimetableSlotsAction
} from "@/features/academy/actions/examActions";
import {
  Plus, ScrollText, Calendar, Clock, BookOpen, School, Pencil, Trash2,
  X, Filter, Search, ChevronDown, AlertCircle, CheckCircle2, Play, Ban
} from "lucide-react";
import { useRouter } from "next/navigation";

const EXAM_TYPES = [
  { value: "WEEKLY_TEST",    label: "📝 Weekly Test",      color: "bg-blue-100 text-blue-700",     border: "border-blue-200" },
  { value: "MONTHLY_TEST",   label: "📅 Monthly Test",     color: "bg-cyan-100 text-cyan-700",     border: "border-cyan-200" },
  { value: "UNIT_TEST",      label: "📖 Unit Test",        color: "bg-violet-100 text-violet-700", border: "border-violet-200" },
  { value: "QUARTERLY",      label: "🗓️ Quarterly Exam",  color: "bg-amber-100 text-amber-700",   border: "border-amber-200" },
  { value: "HALF_YEARLY",    label: "📋 Half Yearly Exam", color: "bg-orange-100 text-orange-700", border: "border-orange-200" },
  { value: "ANNUAL",         label: "🏆 Annual Exam",      color: "bg-red-100 text-red-700",       border: "border-red-200" },
  { value: "PRACTICE_TEST",  label: "✏️ Practice Test",   color: "bg-slate-100 text-slate-600",   border: "border-slate-200" },
];

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  SCHEDULED:  { label: "Scheduled",  color: "bg-blue-50 text-blue-700 border-blue-200",    icon: Calendar },
  ONGOING:    { label: "Ongoing",    color: "bg-amber-50 text-amber-700 border-amber-200",  icon: Play },
  COMPLETED:  { label: "Completed",  color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  CANCELLED:  { label: "Cancelled",  color: "bg-red-50 text-red-700 border-red-200",        icon: Ban },
};

interface ExamClientProps {
  initialExams: any[];
  classes: any[];
  allSubjects: any[]; // all subjects keyed by classId
}

export default function ExamManagementClient({ initialExams, classes, allSubjects }: ExamClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [exams, setExams] = useState<any[]>(initialExams);
  const [showForm, setShowForm] = useState(false);
  const [editExam, setEditExam] = useState<any | null>(null);

  // Filters
  const [filterType, setFilterType] = useState("ALL");
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQ, setSearchQ] = useState("");

  // Form state
  const [fExamType, setFExamType] = useState("WEEKLY_TEST");
  const [fTitle, setFTitle] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fClassId, setFClassId] = useState("");
  const [fSubjectId, setFSubjectId] = useState("");
  const [fDate, setFDate] = useState("");
  const [fStartTime, setFStartTime] = useState("");
  const [fEndTime, setFEndTime] = useState("");
  const [fMaxMarks, setFMaxMarks] = useState("100");
  const [fPassMarks, setFPassMarks] = useState("35");
  const [fVenue, setFVenue] = useState("Classroom");
  const [fInstructions, setFInstructions] = useState("");
  const [fPeriod, setFPeriod] = useState("");
  const [formMsg, setFormMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Timetable slots
  const [ttSlots, setTtSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Subjects for selected class
  const subjectsForClass = fClassId
    ? allSubjects.filter(s => s.classId === parseInt(fClassId))
    : [];

  // Load timetable slots when class+date selected
  const loadSlots = async (classId: string, dateStr: string) => {
    if (!classId || !dateStr) return;
    setLoadingSlots(true);
    const day = DAYS_OF_WEEK[new Date(dateStr).getDay() - 1] || "";
    if (!day) { setTtSlots([]); setLoadingSlots(false); return; }
    const res = await getTimetableSlotsAction(parseInt(classId), day);
    setTtSlots(res.slots || []);
    setLoadingSlots(false);
  };

  const handleClassChange = (val: string) => {
    setFClassId(val);
    setFSubjectId("");
    setFPeriod("");
    loadSlots(val, fDate);
  };

  const handleDateChange = (val: string) => {
    setFDate(val);
    setFPeriod("");
    loadSlots(fClassId, val);
  };

  const handleSlotSelect = (slot: any) => {
    setFStartTime(slot.startTime);
    setFEndTime(slot.endTime);
    setFPeriod(slot.periodName);
    // auto-select subject if slot has one
    if (slot.subjectId) {
      setFSubjectId(String(slot.subjectId));
    }
  };

  const resetForm = () => {
    setFExamType("WEEKLY_TEST"); setFTitle(""); setFDesc(""); setFClassId("");
    setFSubjectId(""); setFDate(""); setFStartTime(""); setFEndTime("");
    setFMaxMarks("100"); setFPassMarks("35"); setFVenue("Classroom");
    setFInstructions(""); setFPeriod(""); setTtSlots([]);
    setFormMsg(null); setEditExam(null);
  };

  const openAdd = () => { resetForm(); setShowForm(true); };

  const openEdit = (exam: any) => {
    setEditExam(exam);
    setFExamType(exam.examType);
    setFTitle(exam.title);
    setFDesc(exam.description || "");
    setFClassId(String(exam.classId || ""));
    setFSubjectId(String(exam.subjectId || ""));
    setFDate(exam.examDate);
    setFStartTime(exam.startTime);
    setFEndTime(exam.endTime);
    setFMaxMarks(String(exam.maxMarks ?? 100));
    setFPassMarks(String(exam.passingMarks ?? 35));
    setFVenue(exam.venue || "Classroom");
    setFInstructions(exam.instructions || "");
    setFPeriod(exam.timetablePeriod || "");
    setFormMsg(null);
    setShowForm(true);
    loadSlots(String(exam.classId || ""), exam.examDate);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);
    const cls = classes.find(c => c.id === parseInt(fClassId));
    const sub = allSubjects.find(s => s.id === parseInt(fSubjectId));

    const payload = {
      examType: fExamType,
      title: fTitle,
      description: fDesc,
      classId: parseInt(fClassId),
      className: cls?.name || "",
      subjectId: fSubjectId ? parseInt(fSubjectId) : null,
      subjectName: sub?.name || "",
      examDate: fDate,
      startTime: fStartTime,
      endTime: fEndTime,
      maxMarks: parseInt(fMaxMarks) || 100,
      passingMarks: parseInt(fPassMarks) || 35,
      venue: fVenue,
      instructions: fInstructions,
      timetablePeriod: fPeriod,
    };

    startTransition(async () => {
      let res;
      if (editExam) {
        res = await updateExamAction(editExam.id, payload);
      } else {
        res = await createExamAction(payload);
      }

      if (res.success) {
        setFormMsg({ type: "success", text: editExam ? "Exam updated!" : "Exam scheduled successfully!" });
        setTimeout(() => { setShowForm(false); resetForm(); router.refresh(); }, 800);
      } else {
        setFormMsg({ type: "error", text: res.error || "Failed." });
      }
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await deleteExamAction(id);
      if (res.success) router.refresh();
      else alert(res.error || "Failed to delete.");
    });
  };

  const handleStatusChange = (id: string, status: string) => {
    startTransition(async () => {
      await updateExamAction(id, { status });
      router.refresh();
    });
  };

  // Filter logic
  const filtered = exams.filter(e => {
    if (filterType !== "ALL" && e.examType !== filterType) return false;
    if (filterClass !== "ALL" && String(e.classId) !== filterClass) return false;
    if (filterStatus !== "ALL" && e.status !== filterStatus) return false;
    if (searchQ && !e.title.toLowerCase().includes(searchQ.toLowerCase()) &&
        !e.className?.toLowerCase().includes(searchQ.toLowerCase()) &&
        !e.subjectName?.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  // Group by exam type for the calendar view
  const typeInfo = (type: string) => EXAM_TYPES.find(t => t.value === type) || EXAM_TYPES[0];

  const stats = {
    total: exams.length,
    scheduled: exams.filter(e => e.status === "SCHEDULED").length,
    completed: exams.filter(e => e.status === "COMPLETED").length,
    upcoming: exams.filter(e => e.examDate >= new Date().toISOString().split("T")[0] && e.status === "SCHEDULED").length,
  };

  return (
    <div className="space-y-6 p-1">

      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ScrollText className="h-7 w-7 text-amber-600" /> Test & Exam Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">Schedule weekly tests, unit tests, quarterly, half-yearly and annual exams.</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm shadow-md shadow-amber-500/20 transition-all active:scale-95">
          <Plus className="h-4 w-4" /> Schedule Exam / Test
        </button>
      </div>

      {/* ===== STATS ROW ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Scheduled", value: stats.total, color: "slate", icon: ScrollText },
          { label: "Upcoming", value: stats.upcoming, color: "blue", icon: Calendar },
          { label: "Completed", value: stats.completed, color: "emerald", icon: CheckCircle2 },
          { label: "This Month", value: exams.filter(e => e.examDate?.startsWith(new Date().toISOString().slice(0,7))).length, color: "amber", icon: Clock },
        ].map(s => (
          <div key={s.label} className={`bg-${s.color}-50 border border-${s.color}-100 rounded-2xl p-4 flex items-center gap-3`}>
            <div className={`h-10 w-10 bg-${s.color}-100 rounded-xl flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`h-5 w-5 text-${s.color}-600`} />
            </div>
            <div>
              <div className={`text-2xl font-black text-${s.color}-700`}>{s.value}</div>
              <div className={`text-[10px] font-bold text-${s.color}-500 uppercase tracking-wide`}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== EXAM TYPE QUICK FILTER PILLS ===== */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterType("ALL")}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${filterType === "ALL" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
          All Types
        </button>
        {EXAM_TYPES.map(t => (
          <button key={t.value} onClick={() => setFilterType(t.value)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
              filterType === t.value ? `${t.color} ${t.border}` : "bg-slate-100 text-slate-500 hover:bg-slate-200 border-transparent"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== FILTERS BAR ===== */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder="Search exams..."
            className="pl-8 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-500 w-44" />
        </div>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
          className="text-xs font-bold p-2 pl-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-500">
          <option value="ALL">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="text-xs font-bold p-2 pl-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-500">
          <option value="ALL">All Status</option>
          {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>
        <span className="text-xs text-slate-400 font-bold">{filtered.length} exam{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* ===== EXAM TABLE ===== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center">
              <ScrollText className="h-8 w-8 text-amber-400" />
            </div>
            <div>
              <p className="font-bold text-slate-700">No exams found</p>
              <p className="text-xs text-slate-400 mt-1">Click "Schedule Exam / Test" to create one</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-5 py-3">Exam / Test</th>
                  <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-3">Type</th>
                  <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-3">Class</th>
                  <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-3">Subject</th>
                  <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-3">Date</th>
                  <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-3">Time</th>
                  <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-3 text-center">Marks</th>
                  <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-3">Status</th>
                  <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(exam => {
                  const ti = typeInfo(exam.examType);
                  const sc = STATUS_CONFIG[exam.status] || STATUS_CONFIG.SCHEDULED;
                  const StatusIcon = sc.icon;
                  const dateObj = new Date(exam.examDate + "T00:00:00");
                  const isPast = exam.examDate < new Date().toISOString().split("T")[0];

                  return (
                    <tr key={exam.id} className={`hover:bg-slate-50/60 transition-colors group ${isPast && exam.status === "SCHEDULED" ? "opacity-60" : ""}`}>
                      <td className="px-5 py-3.5">
                        <div className="font-black text-slate-900 text-xs">{exam.title}</div>
                        {exam.timetablePeriod && (
                          <div className="text-[9px] text-slate-400 font-semibold mt-0.5">🕐 {exam.timetablePeriod}</div>
                        )}
                        {exam.venue && exam.venue !== "Classroom" && (
                          <div className="text-[9px] text-slate-400 font-semibold">📍 {exam.venue}</div>
                        )}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black ${ti.color}`}>
                          {ti.label}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-xs font-bold text-slate-700">{exam.className}</td>
                      <td className="px-3 py-3.5 text-xs font-semibold text-slate-500">{exam.subjectName || "—"}</td>
                      <td className="px-3 py-3.5">
                        <div className="text-xs font-bold text-slate-800">
                          {dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                        <div className="text-[9px] text-slate-400 font-semibold">
                          {dateObj.toLocaleDateString("en-IN", { weekday: "long" })}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-xs font-semibold text-slate-600">
                        {exam.startTime} – {exam.endTime}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <div className="text-xs font-black text-slate-800">{exam.maxMarks}</div>
                        <div className="text-[9px] text-slate-400">Pass: {exam.passingMarks}</div>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border ${sc.color}`}>
                          <StatusIcon size={9} /> {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {exam.status === "SCHEDULED" && (
                            <button onClick={() => handleStatusChange(exam.id, "COMPLETED")}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Mark Complete">
                              <CheckCircle2 size={13} />
                            </button>
                          )}
                          <button onClick={() => openEdit(exam)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(exam.id, exam.title)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== SCHEDULE FORM MODAL ===== */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl my-6">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ScrollText className="h-4 w-4 text-amber-600" />
                  {editExam ? "Edit Exam / Test" : "Schedule New Exam / Test"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Fill in the details below. Timetable slot will auto-load.</p>
              </div>
              <button onClick={() => { setShowForm(false); resetForm(); }}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formMsg && (
                <div className={`p-3.5 rounded-xl text-xs font-bold ${formMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {formMsg.text}
                </div>
              )}

              {/* Exam Type */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Exam / Test Type *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {EXAM_TYPES.map(t => (
                    <button key={t.value} type="button" onClick={() => setFExamType(t.value)}
                      className={`py-2 px-2 text-[10px] font-black rounded-xl border text-center transition-all ${
                        fExamType === t.value ? `${t.color} ${t.border} shadow-sm` : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Exam Title *</label>
                <input type="text" value={fTitle} onChange={e => setFTitle(e.target.value)} required
                  placeholder="e.g. Mathematics Weekly Test – June Week 1"
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-amber-500 focus:bg-white" />
              </div>

              {/* Class + Subject */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Class *</label>
                  <select value={fClassId} onChange={e => handleClassChange(e.target.value)} required
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-amber-500">
                    <option value="">— Select Class —</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Subject</label>
                  <select value={fSubjectId} onChange={e => setFSubjectId(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-amber-500">
                    <option value="">— All Subjects / Select —</option>
                    {subjectsForClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Exam Date *</label>
                <input type="date" value={fDate} onChange={e => handleDateChange(e.target.value)} required
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-amber-500" />
              </div>

              {/* Timetable Slot Picker */}
              {fClassId && fDate && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> Pick from Timetable Slot (optional)
                    {loadingSlots && <span className="text-[9px] text-amber-500 animate-pulse">Loading...</span>}
                  </label>
                  {ttSlots.length === 0 && !loadingSlots ? (
                    <div className="text-[10px] text-slate-400 italic bg-slate-50 rounded-xl px-3 py-2">
                      No timetable slots found for this class on{" "}
                      {new Date(fDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long" })}.
                      Enter time manually below.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {ttSlots.map((slot, i) => (
                        <button key={i} type="button" onClick={() => handleSlotSelect(slot)}
                          className={`px-3 py-1.5 text-[10px] font-black rounded-xl border transition-all ${
                            fPeriod === slot.periodName
                              ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50 hover:border-amber-300"
                          }`}>
                          <div>{slot.periodName}</div>
                          <div className="font-semibold opacity-80">{slot.startTime}–{slot.endTime}</div>
                          {slot.customSubject && <div className="opacity-70">{slot.customSubject}</div>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Start / End Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Start Time *</label>
                  <input type="time" value={fStartTime} onChange={e => setFStartTime(e.target.value)} required
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-amber-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">End Time *</label>
                  <input type="time" value={fEndTime} onChange={e => setFEndTime(e.target.value)} required
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-amber-500" />
                </div>
              </div>

              {/* Marks */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Max Marks</label>
                  <input type="number" value={fMaxMarks} onChange={e => setFMaxMarks(e.target.value)} min={1}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-amber-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Passing Marks</label>
                  <input type="number" value={fPassMarks} onChange={e => setFPassMarks(e.target.value)} min={0}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-amber-500" />
                </div>
              </div>

              {/* Venue + Instructions */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Venue</label>
                  <input type="text" value={fVenue} onChange={e => setFVenue(e.target.value)}
                    placeholder="e.g. Classroom, Hall A"
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-amber-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Description</label>
                  <input type="text" value={fDesc} onChange={e => setFDesc(e.target.value)}
                    placeholder="Optional notes"
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-amber-500" />
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Instructions for Students</label>
                <textarea value={fInstructions} onChange={e => setFInstructions(e.target.value)} rows={2}
                  placeholder="e.g. Bring your own stationery. No calculators allowed."
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-amber-500 resize-none" />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isPending}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 disabled:opacity-50">
                  {isPending ? "Saving..." : editExam ? "Update Exam" : "Schedule Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
