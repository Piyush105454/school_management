"use client";

import React, { useState, useTransition } from "react";
import {
  createExamAction, updateExamAction, deleteExamAction, getExamsAction, getTimetableSlotsAction
} from "@/features/academy/actions/examActions";
import { getSubjectUnitsAndChapters } from "@/features/academy/actions/academyActions";
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
const formatExamDate = (dateStr: string, formatOpts: Intl.DateTimeFormatOptions) => {
  if (!dateStr) return "—";
  try {
    const cleanDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const d = new Date(cleanDate + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", formatOpts);
  } catch (e) {
    return dateStr || "—";
  }
};

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
  const [fPapers, setFPapers] = useState<any[]>([]);
  const [fVenue, setFVenue] = useState("Classroom");
  const [fInstructions, setFInstructions] = useState("");
  const [fPeriod, setFPeriod] = useState("");
  const [formMsg, setFormMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Syllabus / chapters metadata per subject
  const [subjectMetadata, setSubjectMetadata] = useState<Record<number, { units: any[] }>>({});
  const [loadingSubjectId, setLoadingSubjectId] = useState<number | null>(null);
  const [paperSlots, setPaperSlots] = useState<Record<string, any[]>>({});

  const fetchSyllabusForSubject = async (subId: number) => {
    if (subjectMetadata[subId]) return;
    setLoadingSubjectId(subId);
    try {
      const res = await getSubjectUnitsAndChapters(subId);
      if (res.success && res.units) {
        setSubjectMetadata(prev => ({ ...prev, [subId]: { units: res.units } }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSubjectId(null);
    }
  };

  const loadSlotsForPaper = async (paperId: string, dateStr: string) => {
    if (!fClassId || !dateStr) return;
    const day = DAYS_OF_WEEK[new Date(dateStr).getDay() - 1] || "";
    if (!day) return;
    const res = await getTimetableSlotsAction(parseInt(fClassId), day);
    if (res.success && res.slots) {
      setPaperSlots(prev => ({ ...prev, [paperId]: res.slots }));
    }
  };

  const handleClassChange = (val: string) => {
    setFClassId(val);
    setFPapers([{
      id: "1",
      subjectId: "",
      subjectName: "",
      examDate: "",
      startTime: "",
      endTime: "",
      maxMarks: "100",
      passingMarks: "35",
      syllabusUnits: []
    }]);
    setFPeriod("");
    setPaperSlots({});
  };

  const resetForm = () => {
    setFExamType("WEEKLY_TEST"); setFTitle(""); setFDesc(""); setFClassId("");
    setFPapers([{
      id: "1",
      subjectId: "",
      subjectName: "",
      examDate: "",
      startTime: "",
      endTime: "",
      maxMarks: "100",
      passingMarks: "35",
      syllabusUnits: []
    }]);
    setFVenue("Classroom");
    setFInstructions(""); setFPeriod("");
    setFormMsg(null); setEditExam(null);
    setPaperSlots({});
  };

  const openAdd = () => { resetForm(); setShowForm(true); };

  const openEdit = (exam: any) => {
    setEditExam(exam);
    setFExamType(exam.examType);
    setFTitle(exam.title);
    setFDesc(exam.description || "");
    setFClassId(String(exam.classId || ""));
    setFVenue(exam.venue || "Classroom");
    setFInstructions(exam.instructions || "");
    setFPeriod(exam.timetablePeriod || "");
    setFormMsg(null);

    const initialPapers = exam.papers ? JSON.parse(exam.papers) : [{
      subjectId: exam.subjectId ? String(exam.subjectId) : "",
      subjectName: exam.subjectName || "",
      examDate: exam.examDate,
      startTime: exam.startTime,
      endTime: exam.endTime,
      maxMarks: String(exam.maxMarks ?? 100),
      passingMarks: String(exam.passingMarks ?? 35),
      syllabusUnits: []
    }];

    setFPapers(initialPapers.map((p: any, idx: number) => ({
      id: String(idx + 1),
      subjectId: String(p.subjectId || ""),
      subjectName: p.subjectName || "",
      examDate: p.examDate || "",
      startTime: p.startTime || "",
      endTime: p.endTime || "",
      maxMarks: String(p.maxMarks ?? 100),
      passingMarks: String(p.passingMarks ?? 35),
      syllabusUnits: p.syllabusUnits || []
    })));

    setShowForm(true);

    initialPapers.forEach((p: any, idx: number) => {
      if (p.subjectId) {
        fetchSyllabusForSubject(parseInt(p.subjectId));
      }
      if (p.examDate) {
        loadSlotsForPaper(String(idx + 1), p.examDate);
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (fPapers.length === 0) {
      setFormMsg({ type: "error", text: "At least one exam paper is required." });
      return;
    }

    const firstPaper = fPapers[0];
    const cls = classes.find(c => c.id === parseInt(fClassId));

    const payload = {
      examType: fExamType,
      title: fTitle,
      description: fDesc,
      classId: parseInt(fClassId),
      className: cls?.name || "",
      subjectId: firstPaper.subjectId ? parseInt(firstPaper.subjectId) : null,
      subjectName: firstPaper.subjectName || "",
      examDate: firstPaper.examDate,
      startTime: firstPaper.startTime,
      endTime: firstPaper.endTime,
      maxMarks: parseInt(firstPaper.maxMarks) || 100,
      passingMarks: parseInt(firstPaper.passingMarks) || 35,
      venue: fVenue,
      instructions: fInstructions,
      timetablePeriod: fPeriod,
      papers: JSON.stringify(fPapers.map(p => ({
        subjectId: p.subjectId ? parseInt(p.subjectId) : null,
        subjectName: p.subjectName,
        examDate: p.examDate,
        startTime: p.startTime,
        endTime: p.endTime,
        maxMarks: p.maxMarks ? parseInt(p.maxMarks) : 100,
        passingMarks: p.passingMarks ? parseInt(p.passingMarks) : 35,
        syllabusUnits: p.syllabusUnits || []
      })))
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

  const addPaperRow = () => {
    setFPapers(prev => [...prev, {
      id: String(Date.now()),
      subjectId: "",
      subjectName: "",
      examDate: "",
      startTime: "",
      endTime: "",
      maxMarks: "100",
      passingMarks: "35",
      syllabusUnits: []
    }]);
  };

  const removePaperRow = (id: string) => {
    if (fPapers.length <= 1) return;
    setFPapers(prev => prev.filter(p => p.id !== id));
  };

  const updatePaper = (id: string, updates: Partial<any>) => {
    setFPapers(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, ...updates };
      if (updates.subjectId) {
        const subId = parseInt(updates.subjectId);
        const sub = allSubjects.find(s => s.id === subId);
        updated.subjectName = sub?.name || "";
        updated.syllabusUnits = [];
        fetchSyllabusForSubject(subId);
      }
      return updated;
    }));
  };

  const handlePaperDateChange = (id: string, dateVal: string) => {
    updatePaper(id, { examDate: dateVal });
    loadSlotsForPaper(id, dateVal);
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
                      <td className="px-5 py-3.5" colSpan={1}>
                        <div className="font-black text-slate-900 text-xs">{exam.title}</div>
                        {exam.venue && exam.venue !== "Classroom" && (
                          <div className="text-[9px] text-amber-600 font-bold mt-0.5">📍 {exam.venue}</div>
                        )}
                        {exam.papers && (
                          <div className="mt-2 pl-3 border-l-2 border-amber-500 space-y-1.5 max-w-lg">
                            {(() => {
                              try {
                                const parsed = JSON.parse(exam.papers);
                                if (!Array.isArray(parsed)) return null;
                                return parsed.map((p: any, idx: number) => (
                                  <div key={idx} className="text-[10px] text-slate-600 font-bold flex flex-wrap items-center gap-x-2 bg-slate-50 p-1 px-2 rounded border border-slate-100">
                                    <span className="text-slate-900 font-black">{p.subjectName}</span>
                                    <span className="text-slate-300">|</span>
                                    <span className="text-slate-500">{formatExamDate(p.examDate, { day: "numeric", month: "short" })}</span>
                                    <span className="text-slate-300">|</span>
                                    <span>{p.startTime}–{p.endTime}</span>
                                    <span className="text-slate-300">|</span>
                                    <span className="text-slate-500">Marks: {p.maxMarks}</span>
                                    {p.syllabusUnits && p.syllabusUnits.length > 0 && (
                                      <>
                                        <span className="text-slate-300">|</span>
                                        <span className="text-violet-700 bg-violet-50 px-1 rounded-sm text-[8px] font-black" title={p.syllabusUnits.join(", ")}>
                                          Syllabus: {p.syllabusUnits.length} Units
                                        </span>
                                      </>
                                    )}
                                  </div>
                                ));
                              } catch (e) {
                                return null;
                              }
                            })()}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black ${ti.color}`}>
                          {ti.label}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-xs font-bold text-slate-700">{exam.className}</td>
                      <td className="px-3 py-3.5 text-xs font-semibold text-slate-500">
                        {exam.papers ? "Multiple Subjects" : (exam.subjectName || "—")}
                      </td>
                      <td className="px-3 py-3.5">
                        {exam.papers ? (
                          <div className="text-xs font-bold text-slate-800">
                            {(() => {
                              try {
                                const parsed = JSON.parse(exam.papers);
                                if (!Array.isArray(parsed)) return "—";
                                const dates = parsed.map((p: any) => p.examDate).filter(Boolean).sort();
                                if (dates.length === 0) return "—";
                                const startD = dates[0];
                                const endD = dates[dates.length - 1];
                                if (startD === endD) {
                                  return formatExamDate(startD, { day: "numeric", month: "short" });
                                }
                                return `${formatExamDate(startD, { day: "numeric", month: "short" })} – ${formatExamDate(endD, { day: "numeric", month: "short" })}`;
                              } catch (e) {
                                return exam.examDate;
                              }
                            })()}
                          </div>
                        ) : (
                          <>
                            <div className="text-xs font-bold text-slate-800">
                              {formatExamDate(exam.examDate, { day: "numeric", month: "short", year: "numeric" })}
                            </div>
                            <div className="text-[9px] text-slate-400 font-semibold">
                              {formatExamDate(exam.examDate, { weekday: "long" })}
                            </div>
                          </>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-xs font-semibold text-slate-600">
                        {exam.papers ? "See details" : `${exam.startTime} – ${exam.endTime}`}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        {exam.papers ? (
                          <div className="text-xs font-black text-slate-800">
                            {(() => {
                              try {
                                const parsed = JSON.parse(exam.papers);
                                const total = parsed.reduce((acc: number, curr: any) => acc + (parseInt(curr.maxMarks) || 0), 0);
                                return `${total} Total`;
                              } catch (e) {
                                return exam.maxMarks;
                              }
                            })()}
                          </div>
                        ) : (
                          <>
                            <div className="text-xs font-black text-slate-800">{exam.maxMarks}</div>
                            <div className="text-[9px] text-slate-400">Pass: {exam.passingMarks}</div>
                          </>
                        )}
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
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Class *</label>
                <select value={fClassId} onChange={e => handleClassChange(e.target.value)} required
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-amber-500">
                  <option value="">— Select Class —</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Multiple Papers Schedule */}
              {fClassId && (
                <div className="space-y-4 border-t border-b border-slate-100 py-5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-slate-700 tracking-wider">Exam Papers Schedule *</label>
                    <button type="button" onClick={addPaperRow}
                      className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black rounded-lg hover:bg-amber-100 transition-all">
                      <Plus className="h-3 w-3" /> Add Paper
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                    {fPapers.map((paper, idx) => {
                      const paperSubjects = allSubjects.filter(s => s.classId === parseInt(fClassId));
                      const slots = paperSlots[paper.id] || [];
                      const metadata = subjectMetadata[parseInt(paper.subjectId)];

                      return (
                        <div key={paper.id} className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-3 relative">
                          {fPapers.length > 1 && (
                            <button type="button" onClick={() => removePaperRow(paper.id)}
                              className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <div className="text-[10px] font-black text-slate-400">Paper #{idx + 1}</div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400">Subject *</label>
                              <select value={paper.subjectId} onChange={e => updatePaper(paper.id, { subjectId: e.target.value })} required
                                className="w-full text-[11px] font-bold p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-500">
                                <option value="">— Select Subject —</option>
                                {paperSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400">Exam Date *</label>
                              <input type="date" value={paper.examDate} onChange={e => handlePaperDateChange(paper.id, e.target.value)} required
                                className="w-full text-[11px] font-semibold p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-500" />
                            </div>
                          </div>

                          {/* Timetable slot shortcut for this paper */}
                          {paper.examDate && (
                            <div className="space-y-1">
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Autofill from Timetable Slot (optional)</span>
                              {slots.length === 0 ? (
                                <div className="text-[9px] text-slate-400 italic bg-white border border-slate-100 rounded-lg p-1.5">No slots scheduled on this weekday.</div>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {slots.map((slot: any, slotIdx: number) => (
                                    <button key={slotIdx} type="button"
                                      onClick={() => {
                                        updatePaper(paper.id, {
                                          startTime: slot.startTime,
                                          endTime: slot.endTime,
                                          ...(slot.subjectId && { subjectId: String(slot.subjectId), subjectName: paperSubjects.find((s: any) => s.id === slot.subjectId)?.name || "" })
                                        });
                                        if (slot.subjectId) {
                                          fetchSyllabusForSubject(slot.subjectId);
                                        }
                                      }}
                                      className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded text-[9px] font-semibold hover:border-amber-400 hover:text-amber-700 transition-colors">
                                      {slot.periodName} ({slot.startTime}–{slot.endTime})
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400">Start Time *</label>
                              <input type="time" value={paper.startTime} onChange={e => updatePaper(paper.id, { startTime: e.target.value })} required
                                className="w-full text-[11px] font-semibold p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-500" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400">End Time *</label>
                              <input type="time" value={paper.endTime} onChange={e => updatePaper(paper.id, { endTime: e.target.value })} required
                                className="w-full text-[11px] font-semibold p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-500" />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400">Max Marks</label>
                              <input type="number" value={paper.maxMarks} onChange={e => updatePaper(paper.id, { maxMarks: e.target.value })} min={1}
                                className="w-full text-[11px] font-semibold p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-500" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400">Passing Marks</label>
                              <input type="number" value={paper.passingMarks} onChange={e => updatePaper(paper.id, { passingMarks: e.target.value })} min={0}
                                className="w-full text-[11px] font-semibold p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-500" />
                            </div>
                          </div>

                          {/* Dynamic Syllabus / Units Selection */}
                          {paper.subjectId && (
                            <div className="space-y-1 pt-1.5 border-t border-slate-200/50">
                              <label className="text-[9px] font-black uppercase text-slate-400">Syllabus / Units Coverage</label>
                              {loadingSubjectId === parseInt(paper.subjectId) ? (
                                <div className="text-[10px] text-slate-400 animate-pulse">Loading subject units...</div>
                              ) : metadata ? (
                                <div className="bg-white p-2 rounded-lg border border-slate-100 max-h-[140px] overflow-y-auto space-y-1">
                                  {metadata.units && metadata.units.length > 0 ? (
                                    metadata.units.map((unit: any) => (
                                      <div key={unit.id} className="space-y-1">
                                        <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-700 cursor-pointer">
                                          <input type="checkbox"
                                            checked={paper.syllabusUnits.includes(unit.name)}
                                            onChange={(e) => {
                                              const checked = e.target.checked;
                                              const newSyllabus = checked
                                                ? [...paper.syllabusUnits, unit.name]
                                                : paper.syllabusUnits.filter(u => u !== unit.name);
                                              updatePaper(paper.id, { syllabusUnits: newSyllabus });
                                            }}
                                            className="h-3 w-3 rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
                                          <span>{unit.name}</span>
                                        </label>
                                        {unit.chapters && unit.chapters.length > 0 && (
                                          <div className="pl-4 space-y-0.5">
                                            {unit.chapters.map((ch: any) => {
                                              const label = `${unit.name} – Ch ${ch.chapterNo}: ${ch.name}`;
                                              return (
                                                <label key={ch.id} className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 cursor-pointer">
                                                  <input type="checkbox"
                                                    checked={paper.syllabusUnits.includes(label)}
                                                    onChange={(e) => {
                                                      const checked = e.target.checked;
                                                      const newSyllabus = checked
                                                        ? [...paper.syllabusUnits, label]
                                                        : paper.syllabusUnits.filter(u => u !== label);
                                                      updatePaper(paper.id, { syllabusUnits: newSyllabus });
                                                    }}
                                                    className="h-2.5 w-2.5 rounded border-slate-200 text-amber-500 focus:ring-amber-400" />
                                                  <span>Ch {ch.chapterNo}: {ch.name}</span>
                                                </label>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-[9px] text-slate-400 italic">No units or chapters defined for this subject.</div>
                                  )}
                                </div>
                              ) : (
                                <button type="button" onClick={() => fetchSyllabusForSubject(parseInt(paper.subjectId))}
                                  className="text-[9px] text-amber-700 font-bold bg-amber-50/50 hover:bg-amber-50 border border-amber-200 px-2 py-0.5 rounded transition-all">
                                  Load Units & Syllabus Chapters
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Venue */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Venue</label>
                <input type="text" value={fVenue} onChange={e => setFVenue(e.target.value)}
                  placeholder="e.g. Classroom, Hall A"
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-amber-500 focus:bg-white" />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Description</label>
                <input type="text" value={fDesc} onChange={e => setFDesc(e.target.value)}
                  placeholder="Optional notes"
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-amber-500 focus:bg-white" />
              </div>

              {/* Instructions */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Instructions for Students</label>
                <textarea value={fInstructions} onChange={e => setFInstructions(e.target.value)} rows={2}
                  placeholder="e.g. Bring your own stationery. No calculators allowed."
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-amber-500 focus:bg-white resize-none" />
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
