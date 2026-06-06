"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Clock, Save, RefreshCw, AlertCircle, Calendar, GraduationCap,
  User, X, Undo, BookOpen, BarChart3, Trash2, RotateCcw, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

const CLASSES_COLS = ["Nursery", "KG I", "KG II", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5"];

const PERIOD_ROWS = [
  { name: "Period 1st",    start: "09:00", end: "09:40", isBreak: false },
  { name: "Period 2nd",    start: "09:40", end: "10:20", isBreak: false },
  { name: "Period 3rd",    start: "10:20", end: "11:00", isBreak: false },
  { name: "Period 4th",    start: "11:00", end: "11:40", isBreak: false },
  { name: "LUNCH",         start: "11:40", end: "12:00", isBreak: true  },
  { name: "Period 5th",    start: "12:00", end: "12:40", isBreak: false },
  { name: "Period 6th",    start: "12:40", end: "13:20", isBreak: false },
  { name: "Period 7th",    start: "13:20", end: "14:00", isBreak: false },
  { name: "Period 8th",    start: "14:00", end: "14:30", isBreak: false },
  { name: "PRAYER",        start: "14:30", end: "14:35", isBreak: true  },
  { name: "School Is Out", start: "14:35", end: "14:45", isBreak: true  },
];

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_INDEX_MAP: Record<number, string> = { 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday" };

const isEarlyDismissalClass = (cn2: string) => ["Nursery", "KG I", "KG II"].includes(cn2);

type TabType = "timetable" | "analysis";
type AnalysisFilter = "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "THIS_YEAR";

const ANALYSIS_FILTERS: { value: AnalysisFilter; label: string; desc: string }[] = [
  { value: "TODAY",      label: "Today",      desc: "Periods for today only" },
  { value: "THIS_WEEK",  label: "This Week",  desc: "Mon–Sat current week" },
  { value: "THIS_MONTH", label: "This Month", desc: "Approx. 4 weeks" },
  { value: "THIS_YEAR",  label: "This Year",  desc: "Approx. 52 weeks" },
];

function getFilterMultiplier(filter: AnalysisFilter, todayName: string): { multiplier: number; dayFilter: string | null } {
  switch (filter) {
    case "TODAY":      return { multiplier: 1, dayFilter: todayName };
    case "THIS_WEEK":  return { multiplier: 1, dayFilter: null };      // 1 full week
    case "THIS_MONTH": return { multiplier: 4, dayFilter: null };      // ~4 weeks/month
    case "THIS_YEAR":  return { multiplier: 52, dayFilter: null };     // ~52 weeks/year
    default:           return { multiplier: 1, dayFilter: null };
  }
}

export default function TimetableClient() {
  const todayName = DAY_INDEX_MAP[new Date().getDay()] || "Monday";

  const [activeTab, setActiveTab] = useState<TabType>("timetable");
  const [activeDay, setActiveDay] = useState<string>(todayName);
  const [dbTimetable, setDbTimetable] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [gridData, setGridData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Cell editor
  const [editorCell, setEditorCell] = useState<{ className: string; periodName: string; startTime: string; endTime: string } | null>(null);
  const [editSubjectId, setEditSubjectId] = useState("");
  const [editTeacherId, setEditTeacherId] = useState("");

  // Analysis
  const [analysisTeacherId, setAnalysisTeacherId] = useState<string>("");
  const [analysisFilter, setAnalysisFilter] = useState<AnalysisFilter>("TODAY");

  useEffect(() => { fetchTimetableData(); }, []);

  const fetchTimetableData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/timetable");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load timetable");
      setDbTimetable(data.timetable || []);
      setClassesList(data.classes || []);
      setSubjectsList(data.subjects || []);
      setTeachersList(data.teachers || []);
      buildGridForDay(data.timetable || [], activeDay);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to fetch timetable data" });
    } finally {
      setLoading(false);
    }
  };

  const buildGridForDay = (entries: any[], day: string) => {
    const dayEntries = entries.filter(e => e.dayOfWeek === day);
    const newGrid: Record<string, any> = {};
    dayEntries.forEach(entry => {
      const key = `${entry.className}-${entry.periodName}`;
      newGrid[key] = {
        classId: entry.classId, subjectId: entry.subjectId,
        customSubject: entry.customSubject, teacherId: entry.teacherId,
        customTeacher: entry.customTeacher,
      };
    });
    setGridData(newGrid);
  };

  useEffect(() => {
    if (!loading) { buildGridForDay(dbTimetable, activeDay); setFeedback(null); }
  }, [activeDay]);

  const handleCellClick = (className: string, periodName: string, startTime: string, endTime: string) => {
    if (isEarlyDismissalClass(className) && PERIOD_ROWS.findIndex(r => r.name === periodName) >= 4) return;
    if (periodName === "PRAYER" || periodName === "School Is Out") return;
    const cellKey = `${className}-${periodName}`;
    const cellValue = gridData[cellKey] || {};
    setEditorCell({ className, periodName, startTime, endTime });
    setEditSubjectId(cellValue.subjectId ? String(cellValue.subjectId) : "");
    setEditTeacherId(cellValue.teacherId ? String(cellValue.teacherId) : "");
  };

  const handleSaveCell = () => {
    if (!editorCell) return;
    const { className, periodName } = editorCell;
    const cellKey = `${className}-${periodName}`;
    const matchedClass = classesList.find(c => c.name.toLowerCase() === className.toLowerCase());
    const classId = matchedClass?.id || null;
    const newGrid = { ...gridData };
    if (!editSubjectId && !editTeacherId) { delete newGrid[cellKey]; }
    else { newGrid[cellKey] = { classId, subjectId: editSubjectId ? parseInt(editSubjectId) : null, customSubject: null, teacherId: editTeacherId || null, customTeacher: null }; }
    setGridData(newGrid);
    setEditorCell(null);
  };

  const handleClearCell = () => {
    if (!editorCell) return;
    const key = `${editorCell.className}-${editorCell.periodName}`;
    const newGrid = { ...gridData };
    delete newGrid[key];
    setGridData(newGrid);
    setEditorCell(null);
  };

  // Save PERMANENTLY to DB for this day
  const handleSaveAll = async () => {
    try {
      setSaving(true); setFeedback(null);
      const entries: any[] = [];
      Object.keys(gridData).forEach(key => {
        const [className, periodName] = key.split("-");
        const periodInfo = PERIOD_ROWS.find(r => r.name === periodName);
        if (!periodInfo) return;
        const cell = gridData[key];
        entries.push({ className, periodName, startTime: periodInfo.start, endTime: periodInfo.end, classId: cell.classId, subjectId: cell.subjectId, customSubject: cell.customSubject, teacherId: cell.teacherId, customTeacher: cell.customTeacher });
      });
      CLASSES_COLS.forEach(cls => {
        if (isEarlyDismissalClass(cls)) {
          entries.push({ className: cls, periodName: "LUNCH", startTime: "11:40", endTime: "12:00", customSubject: "School Is Out", customTeacher: null });
        } else {
          const lunchKey = `${cls}-LUNCH`;
          if (!gridData[lunchKey]) entries.push({ className: cls, periodName: "LUNCH", startTime: "11:40", endTime: "12:00", customSubject: "LUNCH", customTeacher: null });
        }
      });
      const res = await fetch("/api/timetable/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dayOfWeek: activeDay, entries }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setFeedback({ type: "success", text: `✅ ${activeDay} timetable permanently saved!` });
      fetchTimetableData();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to save changes" });
    } finally { setSaving(false); }
  };

  // Reset to last saved DB state (discard local edits)
  const handleResetDay = () => { buildGridForDay(dbTimetable, activeDay); setFeedback({ type: "success", text: "Reset to last saved state." }); };

  // Permanent Reset: wipe DB entries for this day
  const handlePermanentReset = async () => {
    if (!confirm(`PERMANENTLY RESET ${activeDay} timetable? This will delete all saved data for this day.`)) return;
    try {
      setSaving(true);
      const res = await fetch("/api/timetable/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dayOfWeek: activeDay, entries: [] }) });
      if (!res.ok) throw new Error("Failed to reset");
      setGridData({});
      setFeedback({ type: "success", text: `🗑️ ${activeDay} timetable permanently reset.` });
      fetchTimetableData();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally { setSaving(false); }
  };

  // Clear today's local view only
  const handleClearDay = () => {
    if (confirm(`Clear all ${activeDay} slots locally? Save to make permanent.`)) {
      setGridData({});
      setFeedback({ type: "success", text: "Cleared. Click 'Permanent Save' to apply." });
    }
  };

  // ===== ANALYSIS LOGIC =====
  // Base weekly analysis (always computed from full timetable)
  const teacherAnalysisBase = useMemo(() => {
    const analysis: Record<string, { name: string; weeklyPeriods: number; byDay: Record<string, { periods: number; slots: string[] }> }> = {};
    teachersList.forEach(t => {
      analysis[t.id] = { name: t.name, weeklyPeriods: 0, byDay: {} };
      DAYS_OF_WEEK.forEach(day => { analysis[t.id].byDay[day] = { periods: 0, slots: [] }; });
    });
    DAYS_OF_WEEK.forEach(day => {
      const dayEntries = dbTimetable.filter(e => e.dayOfWeek === day && e.teacherId);
      dayEntries.forEach(e => {
        const teacherId = e.teacherId;
        if (!analysis[teacherId]) return;
        const period = PERIOD_ROWS.find(r => r.name === e.periodName);
        if (!period || period.isBreak) return;
        analysis[teacherId].byDay[day].periods += 1;
        analysis[teacherId].byDay[day].slots.push(`${e.className} – ${e.periodName} (${period.start})`);
        analysis[teacherId].weeklyPeriods += 1;
      });
    });
    return analysis;
  }, [dbTimetable, teachersList]);

  // Apply filter multiplier to get display totals
  const { multiplier, dayFilter } = getFilterMultiplier(analysisFilter, todayName);

  const teacherAnalysis = useMemo(() => {
    return Object.entries(teacherAnalysisBase).map(([id, data]) => {
      // If TODAY filter, only count today's day
      const displayByDay: Record<string, { periods: number; scaledPeriods: number; slots: string[] }> = {};
      let displayTotal = 0;
      DAYS_OF_WEEK.forEach(day => {
        const base = data.byDay[day];
        const isIncluded = dayFilter ? day === dayFilter : true;
        const scaled = isIncluded ? base.periods * multiplier : 0;
        displayByDay[day] = { periods: base.periods, scaledPeriods: scaled, slots: base.slots };
        if (isIncluded) displayTotal += base.periods * multiplier;
      });
      return { id, name: data.name, weeklyPeriods: data.weeklyPeriods, totalPeriods: displayTotal, byDay: displayByDay };
    }).sort((a, b) => b.totalPeriods - a.totalPeriods);
  }, [teacherAnalysisBase, analysisFilter, multiplier, dayFilter, todayName]);

  const selectedTeacherData = useMemo(() => {
    if (!analysisTeacherId) return null;
    return teacherAnalysis.find(t => t.id === analysisTeacherId) || null;
  }, [analysisTeacherId, teacherAnalysis]);

  const maxHours = teacherAnalysis.length > 0 ? (teacherAnalysis[0].totalPeriods || 1) : 1;

  const filterLabel = ANALYSIS_FILTERS.find(f => f.value === analysisFilter)?.label || "";
  const unitLabel = analysisFilter === "TODAY" ? "periods today" : analysisFilter === "THIS_WEEK" ? "periods/week" : analysisFilter === "THIS_MONTH" ? "periods this month" : "periods this year";

  return (
    <div className="space-y-6">

      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Clock className="text-pink-600 animate-pulse" size={28} /> Time Table Management
          </h1>
          <p className="text-xs text-slate-500 font-medium">Define lectures, subject distributions, and class sessions.</p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Tab Buttons */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button onClick={() => setActiveTab("timetable")}
              className={cn("flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-lg transition-all",
                activeTab === "timetable" ? "bg-pink-600 text-white shadow-md" : "text-slate-500 hover:text-slate-700")}>
              <Calendar size={12} /> Edit Timetable
            </button>
            <button onClick={() => setActiveTab("analysis")}
              className={cn("flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-lg transition-all",
                activeTab === "analysis" ? "bg-violet-600 text-white shadow-md" : "text-slate-500 hover:text-slate-700")}>
              <BarChart3 size={12} /> Teacher Analysis
            </button>
          </div>

          {activeTab === "timetable" && (
            <>
              {/* Today button */}
              <button onClick={() => setActiveDay(todayName)}
                className={cn("flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-xl border transition-all",
                  activeDay === todayName ? "bg-emerald-600 text-white border-emerald-600" : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100")}>
                <Calendar size={12} /> Today ({todayName})
              </button>

              {/* Reset (local) */}
              <button onClick={handleResetDay} disabled={loading || saving}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-all active:scale-95 disabled:opacity-50">
                <Undo size={12} /> Reset Day
              </button>

              {/* Clear Day (local) */}
              <button onClick={handleClearDay} disabled={loading || saving}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-black rounded-xl transition-all active:scale-95 disabled:opacity-50">
                <Trash2 size={12} /> Clear Day
              </button>

              {/* Permanent Reset */}
              <button onClick={handlePermanentReset} disabled={loading || saving}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-red-500/20">
                <RotateCcw size={12} /> Permanent Reset
              </button>

              {/* Permanent Save */}
              <button onClick={handleSaveAll} disabled={loading || saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-pink-500/20 active:scale-95 disabled:opacity-50">
                {saving ? <RefreshCw className="animate-spin" size={12} /> : <Save size={12} />}
                {saving ? "Saving..." : "Permanent Save"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ===== FEEDBACK ===== */}
      {feedback && (
        <div className={cn("p-4 rounded-2xl border flex items-center gap-3 animate-in zoom-in-95 duration-200",
          feedback.type === "success" ? "bg-emerald-50 border-emerald-200/60 text-emerald-800" : "bg-rose-50 border-rose-200/60 text-rose-800")}>
          <AlertCircle size={18} />
          <span className="text-xs font-bold">{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="ml-auto text-xs opacity-60 hover:opacity-100"><X size={14} /></button>
        </div>
      )}

      {/* ===== TIMETABLE TAB ===== */}
      {activeTab === "timetable" && (
        <>
          {/* Day selector */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50 shadow-inner max-w-2xl">
            {DAYS_OF_WEEK.map(day => (
              <button key={day} onClick={() => setActiveDay(day)} disabled={loading || saving}
                className={cn(
                  "flex-1 py-2 text-[10px] md:text-xs font-black uppercase tracking-wider rounded-xl transition-all relative",
                  activeDay === day ? "bg-pink-600 text-white shadow-lg shadow-pink-500/20" : "text-slate-500 hover:text-slate-700"
                )}>
                {day.slice(0, 3)}
                {day === todayName && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-emerald-400 rounded-full border border-white" />
                )}
              </button>
            ))}
          </div>

          {/* Timetable grid */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4 text-slate-400 font-bold text-xs uppercase tracking-widest">
              <RefreshCw className="animate-spin text-pink-600" size={24} />
              Synchronizing Timetable Grid...
            </div>
          ) : (
            <div className="bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-sm max-w-full overflow-x-auto select-none">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100">
                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider w-[120px]">From - To</th>
                    {CLASSES_COLS.map(cls => (
                      <th key={cls} className="p-4 text-xs font-black text-slate-800 uppercase tracking-widest text-center border-l border-slate-100 bg-pink-50/10">{cls}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {PERIOD_ROWS.map((row) => {
                    const isLunch = row.name === "LUNCH";
                    const isPrayer = row.name === "PRAYER";
                    const isOut = row.name === "School Is Out";
                    return (
                      <tr key={row.name} className={cn("hover:bg-slate-50/20 transition-colors", (isLunch || isPrayer || isOut) && "bg-slate-50/50")}>
                        <td className="p-4 border-r border-slate-100">
                          <div className="text-xs font-black text-slate-900 leading-none">{row.start} - {row.end}</div>
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1.5">{row.name}</div>
                        </td>
                        {CLASSES_COLS.map(cls => {
                          const cellKey = `${cls}-${row.name}`;
                          const cell = gridData[cellKey];
                          if (isEarlyDismissalClass(cls) && (isLunch || PERIOD_ROWS.indexOf(row) > 4)) {
                            if (isLunch) return (
                              <td key={cellKey} rowSpan={PERIOD_ROWS.length - 4}
                                className="p-4 border-l border-slate-100 bg-rose-50/30 text-center font-bold text-xs text-rose-500 uppercase tracking-widest align-middle border-b border-slate-100 w-[110px]">
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <span>School Is Out</span>
                                  <span className="text-[9px] font-bold text-slate-400 capitalize">11:40 dismissal</span>
                                </div>
                              </td>
                            );
                            return null;
                          }
                          if (isLunch) return (
                            <td key={cellKey} onClick={() => handleCellClick(cls, row.name, row.start, row.end)}
                              className="p-4 border-l border-slate-100 text-center cursor-pointer hover:bg-slate-100/50 transition-all group">
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">LUNCH</div>
                              <div className="text-[9px] font-bold text-slate-400 mt-1 italic leading-tight group-hover:text-pink-600">
                                {cell?.customTeacher || cell?.teacherId ? (cell.customTeacher || teachersList.find(t => t.id === cell.teacherId)?.name) : "No Duty"}
                              </div>
                            </td>
                          );
                          if (isPrayer || isOut) return (
                            <td key={cellKey} className="p-4 border-l border-slate-100 text-center font-bold text-[10px] uppercase tracking-wider text-slate-500">{row.name}</td>
                          );
                          const displaySubject = cell?.customSubject || (cell?.subjectId && subjectsList.find(s => s.id === cell.subjectId)?.name) || "";
                          const displayTeacher = cell?.customTeacher || (cell?.teacherId && teachersList.find(t => t.id === cell.teacherId)?.name) || "";
                          return (
                            <td key={cellKey} onClick={() => handleCellClick(cls, row.name, row.start, row.end)}
                              className={cn("p-3 border-l border-slate-100 text-center cursor-pointer transition-all hover:bg-pink-50/10 active:scale-[0.98]",
                                (displaySubject || displayTeacher) ? "bg-amber-50/20 hover:bg-amber-50/30" : "hover:bg-slate-50")}>
                              {displaySubject ? (
                                <div className="space-y-1">
                                  <div className="text-xs font-black text-slate-800 uppercase tracking-wide leading-tight">{displaySubject}</div>
                                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{displayTeacher || "--"}</div>
                                </div>
                              ) : (
                                <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest py-2">+ Empty</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ===== ANALYSIS TAB ===== */}
      {activeTab === "analysis" && (
        <div className="space-y-6">

          {/* ── FILTER PILLS ── */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">View By:</span>
            {ANALYSIS_FILTERS.map(f => (
              <button key={f.value} onClick={() => setAnalysisFilter(f.value)}
                title={f.desc}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border",
                  analysisFilter === f.value
                    ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/20"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700"
                )}>
                {f.value === "TODAY" && "📅"}
                {f.value === "THIS_WEEK" && "🗓️"}
                {f.value === "THIS_MONTH" && "📆"}
                {f.value === "THIS_YEAR" && "🏫"}
                {f.label}
              </button>
            ))}
            <span className="ml-auto text-[10px] text-violet-500 font-bold italic bg-violet-50 px-3 py-1.5 rounded-lg border border-violet-100">
              Showing: {ANALYSIS_FILTERS.find(f => f.value === analysisFilter)?.desc}
            </span>
          </div>

          {/* Overview: all teachers sorted by hours */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-violet-600" /> Teacher Workload Overview
              </h2>
              <p className="text-xs text-slate-400 font-semibold">Sorted by total periods — <span className="text-violet-600">{filterLabel}</span></p>
            </div>
            <div className="p-5 space-y-3">
              {teacherAnalysis.filter(t => t.totalPeriods > 0).length === 0 ? (
                <p className="text-center text-slate-400 italic text-xs py-8">No teacher assignments found. Fill in the timetable first.</p>
              ) : (
                teacherAnalysis.filter(t => t.totalPeriods > 0).map((teacher, idx) => (
                  <div key={teacher.id}
                    onClick={() => { setAnalysisTeacherId(teacher.id); }}
                    className={cn("flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all hover:bg-violet-50 border",
                      analysisTeacherId === teacher.id ? "border-violet-400 bg-violet-50" : "border-transparent hover:border-violet-200")}>
                    {/* Rank */}
                    <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0",
                      idx === 0 ? "bg-amber-100 text-amber-700" : idx === 1 ? "bg-slate-200 text-slate-600" : idx === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500")}>
                      #{idx + 1}
                    </div>
                    {/* Name + count */}
                    <div className="w-36 flex-shrink-0">
                      <div className="text-xs font-black text-slate-900 truncate">{teacher.name}</div>
                      <div className="text-[9px] text-violet-600 font-semibold">{teacher.totalPeriods} {unitLabel}</div>
                    </div>
                    {/* Bar chart */}
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full transition-all duration-700"
                          style={{ width: `${Math.round((teacher.totalPeriods / maxHours) * 100)}%` }} />
                      </div>
                      <span className="text-xs font-black text-violet-700 w-12 text-right">{teacher.totalPeriods}</span>
                    </div>
                    {/* Day breakdown mini — always show weekly base counts */}
                    {analysisFilter !== "TODAY" && (
                      <div className="hidden md:flex gap-1 flex-shrink-0">
                        {DAYS_OF_WEEK.map(day => {
                          const count = teacher.byDay[day]?.periods || 0;
                          return (
                            <div key={day} title={`${day}: ${count} periods/week`}
                              className={cn("h-6 w-6 rounded-md flex items-center justify-center text-[9px] font-black",
                                count === 0 ? "bg-slate-100 text-slate-400" : count <= 2 ? "bg-blue-100 text-blue-700" : count <= 4 ? "bg-violet-100 text-violet-700" : "bg-pink-100 text-pink-700")}>
                              {count || "—"}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {analysisFilter === "TODAY" && (
                      <div className="hidden md:flex flex-shrink-0">
                        <div title={`${todayName}: ${teacher.byDay[todayName]?.periods || 0} periods`}
                          className={cn("px-3 h-7 rounded-lg flex items-center text-[9px] font-black gap-1",
                            (teacher.byDay[todayName]?.periods || 0) === 0 ? "bg-slate-100 text-slate-400" : "bg-emerald-100 text-emerald-700")}>
                          {todayName.slice(0,3)}: {teacher.byDay[todayName]?.periods || 0}
                        </div>
                      </div>
                    )}
                    <button className="p-1.5 text-violet-400 hover:text-violet-600 flex-shrink-0">
                      <Eye size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Teacher Detail: day-by-day breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-4 flex-wrap">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-violet-600" /> Teacher Detail View
              </h2>
              <select value={analysisTeacherId} onChange={e => setAnalysisTeacherId(e.target.value)}
                className="text-xs font-bold p-2 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-500">
                <option value="">— Select a Teacher —</option>
                {teacherAnalysis.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.totalPeriods} {unitLabel})</option>
                ))}
              </select>
              {/* Filter badge in detail header */}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[9px] font-black bg-violet-100 text-violet-700 px-2 py-1 rounded-lg uppercase tracking-wider">
                  {filterLabel}
                </span>
              </div>
            </div>

            {!selectedTeacherData ? (
              <div className="py-16 text-center text-slate-400">
                <User className="h-10 w-10 mx-auto mb-3 text-slate-200" />
                <p className="font-bold text-sm">Select a teacher above or click a row in the chart</p>
                <p className="text-xs mt-1">to see their full schedule breakdown</p>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {/* Summary header */}
                <div className="flex items-center gap-4 flex-wrap p-4 bg-violet-50 rounded-2xl border border-violet-100">
                  <div className="h-12 w-12 bg-violet-600 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                    {selectedTeacherData.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-black text-slate-900">{selectedTeacherData.name}</div>
                    <div className="text-xs text-violet-600 font-bold mt-0.5">
                      {selectedTeacherData.totalPeriods} {unitLabel}
                      <span className="text-slate-400 ml-2 font-normal">(base: {selectedTeacherData.weeklyPeriods}/week)</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: filterLabel + " Total", value: selectedTeacherData.totalPeriods, color: "violet" },
                      { label: "Busiest Day", value: Object.entries(selectedTeacherData.byDay).sort(([,a]: any, [,b]: any) => b.periods - a.periods)[0]?.[0]?.slice(0,3) || "—", color: "pink" },
                      { label: "Days Active", value: Object.values(selectedTeacherData.byDay).filter((d: any) => d.periods > 0).length, color: "emerald" },
                    ].map(s => (
                      <div key={s.label} className={`bg-${s.color}-100 rounded-xl p-2.5 text-center`}>
                        <div className={`text-base font-black text-${s.color}-700`}>{s.value}</div>
                        <div className={`text-[9px] font-bold text-${s.color}-500 uppercase tracking-wide leading-tight`}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Day-by-day breakdown table */}
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-4 py-3">Day</th>
                        <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-3 text-center">Per Week</th>
                        {analysisFilter !== "THIS_WEEK" && analysisFilter !== "TODAY" && (
                          <th className="text-[10px] font-black uppercase tracking-wider text-violet-500 px-3 py-3 text-center">{filterLabel} Total</th>
                        )}
                        <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-3">Schedule Slots</th>
                        <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-4 py-3">Load</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {DAYS_OF_WEEK.map(day => {
                        const dayData = selectedTeacherData.byDay[day];
                        const count = (dayData as any)?.periods || 0;
                        const scaledCount = (dayData as any)?.scaledPeriods || 0;
                        const isToday = day === todayName;
                        const isFiltered = dayFilter && day !== dayFilter;
                        return (
                          <tr key={day} className={cn("hover:bg-slate-50/60 transition-colors",
                            isToday && "bg-emerald-50/30",
                            isFiltered && "opacity-30"
                          )}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className={cn("text-xs font-black", isToday ? "text-emerald-700" : "text-slate-800")}>{day}</div>
                                {isToday && <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">TODAY</span>}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black",
                                count === 0 ? "bg-slate-100 text-slate-400" : count <= 2 ? "bg-blue-100 text-blue-700" : count <= 4 ? "bg-violet-100 text-violet-700" : "bg-pink-100 text-pink-700")}>
                                {count}
                              </span>
                            </td>
                            {analysisFilter !== "THIS_WEEK" && analysisFilter !== "TODAY" && (
                              <td className="px-3 py-3 text-center">
                                <span className={cn("inline-flex px-2 py-1 rounded-lg text-xs font-black",
                                  scaledCount === 0 ? "bg-slate-50 text-slate-300" : "bg-violet-100 text-violet-700")}>
                                  {scaledCount}
                                </span>
                              </td>
                            )}
                            <td className="px-3 py-3">
                              {(dayData as any)?.slots?.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {(dayData as any).slots.map((slot: string, i: number) => (
                                    <span key={i} className="inline-flex px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-lg text-[9px] font-black">
                                      {slot}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-300 italic font-semibold">No classes</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div className="h-full bg-violet-500 rounded-full"
                                  style={{ width: count > 0 ? `${Math.min(100, (count / 8) * 100)}%` : "0%" }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== CELL EDITOR MODAL ===== */}
      {editorCell && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-3xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
            <button onClick={() => setEditorCell(null)}
              className="absolute top-4 right-4 h-8 w-8 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
              <X size={16} />
            </button>
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
              <div className="p-2.5 bg-pink-50 text-pink-600 rounded-xl"><Calendar size={20} /></div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">{editorCell.className} Timetable</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{editorCell.periodName} ({editorCell.startTime} - {editorCell.endTime})</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><BookOpen size={12} /> Select Subject</label>
                <select value={editSubjectId} onChange={e => setEditSubjectId(e.target.value)}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:border-pink-500 transition-colors">
                  <option value="">-- Choose Subject --</option>
                  {(() => {
                    const matchedClass = classesList.find(c => c.name.toLowerCase() === editorCell.className.toLowerCase());
                    return subjectsList.filter(s => s.classId === matchedClass?.id).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ));
                  })()}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><GraduationCap size={12} /> Select Teacher</label>
                <select value={editTeacherId} onChange={e => setEditTeacherId(e.target.value)}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:border-pink-500 transition-colors">
                  <option value="">-- Choose Teacher --</option>
                  {teachersList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 border-t border-slate-100 pt-5 mt-6">
              <button onClick={handleClearCell}
                className="flex-1 py-3 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-black uppercase tracking-wider rounded-2xl transition-all">
                Clear Slot
              </button>
              <button onClick={handleSaveCell}
                className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-pink-500/10">
                Apply Schedule
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
