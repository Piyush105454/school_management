"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Clock, Save, RefreshCw, AlertCircle, Calendar, GraduationCap,
  User, X, BookOpen, BarChart3, Eye, Pencil, CheckCircle2, LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";

const CLASSES_COLS = ["Nursery", "KG I", "KG II", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7"];

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
const DAY_INDEX_MAP: Record<number, string> = {
  1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday",
};

const isEarlyDismissalClass = (c: string) => ["Nursery", "KG I", "KG II"].includes(c);

type TabType = "timetable" | "analysis";
type AnalysisFilter = "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "THIS_YEAR";

const ANALYSIS_FILTERS: { value: AnalysisFilter; label: string; desc: string; icon: string }[] = [
  { value: "TODAY",      label: "Today",      desc: "Periods for today only",  icon: "📅" },
  { value: "THIS_WEEK",  label: "This Week",  desc: "Mon–Sat current week",    icon: "🗓️" },
  { value: "THIS_MONTH", label: "This Month", desc: "Approx. 4 weeks",         icon: "📆" },
  { value: "THIS_YEAR",  label: "This Year",  desc: "Approx. 52 weeks",        icon: "🏫" },
];

function getFilterMultiplier(filter: AnalysisFilter, todayName: string) {
  switch (filter) {
    case "TODAY":      return { multiplier: 1, dayFilter: todayName };
    case "THIS_WEEK":  return { multiplier: 1,  dayFilter: null };
    case "THIS_MONTH": return { multiplier: 4,  dayFilter: null };
    case "THIS_YEAR":  return { multiplier: 52, dayFilter: null };
    default:           return { multiplier: 1,  dayFilter: null };
  }
}

export default function TimetableClient() {
  const todayName = DAY_INDEX_MAP[new Date().getDay()] || "Monday";

  // Tabs
  const [activeTab, setActiveTab] = useState<TabType>("timetable");

  // Timetable state
  const [activeDay, setActiveDay] = useState<string>(todayName);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isMasterMode, setIsMasterMode] = useState(false); // Master timetable overlay
  const [masterActiveDay, setMasterActiveDay] = useState<string>("Monday");

  const [dbTimetable, setDbTimetable] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [teachersList, setTeachersList] = useState<any[]>([]);

  // grid data per day (for editing)
  const [gridData, setGridData] = useState<Record<string, any>>({});
  // master grid: all days being edited simultaneously
  const [masterGrid, setMasterGrid] = useState<Record<string, Record<string, any>>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDay, setSavingDay] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Holidays state
  const [holidaysList, setHolidaysList] = useState<any[]>([]);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayTitle, setHolidayTitle] = useState("");
  const [holidayActionMsg, setHolidayActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [holidayType, setHolidayType] = useState<"FULL_DAY" | "HALF_DAY">("FULL_DAY");
  const [holidayStartTime, setHolidayStartTime] = useState("");
  const [holidayEndTime, setHolidayEndTime] = useState("");
  const [todayText, setTodayText] = useState("");

  // Cell editor
  const [editorCell, setEditorCell] = useState<{
    className: string; periodName: string; startTime: string; endTime: string;
    forDay?: string; // used in master mode
  } | null>(null);
  const [editSubjectId, setEditSubjectId] = useState("");
  const [editTeacherId, setEditTeacherId] = useState("");

  // Analysis
  const [analysisTeacherId, setAnalysisTeacherId] = useState("");
  const [analysisFilter, setAnalysisFilter] = useState<AnalysisFilter>("TODAY");

  useEffect(() => {
    fetchTimetableData();
    const today = new Date();
    const formatted = today.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    setTodayText(formatted);
  }, []);

  const fetchTimetableData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/timetable");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDbTimetable(data.timetable || []);
      setClassesList(data.classes || []);
      setSubjectsList(data.subjects || []);
      setTeachersList(data.teachers || []);
      buildGridForDay(data.timetable || [], activeDay);

      // Fetch holidays
      const holRes = await fetch("/api/holidays");
      const holData = await holRes.json();
      if (holRes.ok) {
        setHolidaysList(holData || []);
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally { setLoading(false); }
  };

  const getDateForDayOfWeek = (dayName: string): string => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const targetIndex = days.indexOf(dayName);
    const today = new Date();
    const todayIndex = today.getDay();
    const diff = targetIndex - todayIndex;
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dateVal = String(targetDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${dateVal}`;
  };

  const formatDateString = (dateStr: string): string => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const handleSaveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setHolidayActionMsg(null);
    if (!holidayDate || !holidayTitle.trim()) {
      setHolidayActionMsg({ type: "error", text: "Date and Title are required." });
      return;
    }
    if (holidayType === "HALF_DAY" && (!holidayStartTime || !holidayEndTime)) {
      setHolidayActionMsg({ type: "error", text: "Start and End times are required for Half Day." });
      return;
    }
    try {
      const res = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          date: holidayDate, 
          title: holidayTitle.trim(),
          type: holidayType,
          startTime: holidayType === "HALF_DAY" ? holidayStartTime : undefined,
          endTime: holidayType === "HALF_DAY" ? holidayEndTime : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save holiday");
      setHolidayActionMsg({ type: "success", text: "✅ Holiday saved successfully!" });
      setHolidayDate("");
      setHolidayTitle("");
      setHolidayType("FULL_DAY");
      setHolidayStartTime("");
      setHolidayEndTime("");
      
      // Refresh holiday list
      const holRes = await fetch("/api/holidays");
      const holData = await holRes.json();
      if (holRes.ok) setHolidaysList(holData || []);
    } catch (err: any) {
      setHolidayActionMsg({ type: "error", text: err.message });
    }
  };

  const handleDeleteHoliday = async (date: string) => {
    if (!confirm("Are you sure you want to remove this holiday?")) return;
    try {
      const res = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, action: "delete" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete holiday");
      }
      
      // Refresh holiday list
      const holRes = await fetch("/api/holidays");
      const holData = await holRes.json();
      if (holRes.ok) setHolidaysList(holData || []);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const buildGridForDay = (entries: any[], day: string) => {
    const g: Record<string, any> = {};
    entries.filter(e => e.dayOfWeek === day).forEach(e => {
      g[`${e.className}-${e.periodName}`] = {
        classId: e.classId, subjectId: e.subjectId,
        customSubject: e.customSubject, teacherId: e.teacherId,
        customTeacher: e.customTeacher,
      };
    });
    setGridData(g);
  };

  // Build grid for all days (master mode)
  const buildMasterGrid = (entries: any[]) => {
    const mg: Record<string, Record<string, any>> = {};
    DAYS_OF_WEEK.forEach(day => {
      mg[day] = {};
      entries.filter(e => e.dayOfWeek === day).forEach(e => {
        mg[day][`${e.className}-${e.periodName}`] = {
          classId: e.classId, subjectId: e.subjectId,
          customSubject: e.customSubject, teacherId: e.teacherId,
          customTeacher: e.customTeacher,
        };
      });
    });
    setMasterGrid(mg);
  };

  useEffect(() => {
    if (!loading) { buildGridForDay(dbTimetable, activeDay); setFeedback(null); }
  }, [activeDay]);

  const handleCellClick = (className: string, periodName: string, startTime: string, endTime: string, forDay?: string) => {
    if (!isEditMode && !isMasterMode) return;
    if (isEarlyDismissalClass(className) && PERIOD_ROWS.findIndex(r => r.name === periodName) >= 4) return;
    if (periodName === "PRAYER" || periodName === "School Is Out") return;

    const day = forDay || activeDay;
    const grid = isMasterMode ? (masterGrid[day] || {}) : gridData;
    const cellKey = `${className}-${periodName}`;
    const cellValue = grid[cellKey] || {};

    setEditorCell({ className, periodName, startTime, endTime, forDay: day });
    setEditSubjectId(cellValue.subjectId ? String(cellValue.subjectId) : "");
    setEditTeacherId(cellValue.teacherId ? String(cellValue.teacherId) : "");
  };

  const handleSaveCell = () => {
    if (!editorCell) return;
    const { className, periodName, forDay } = editorCell;
    const cellKey = `${className}-${periodName}`;
    const normalizeClass = (name: string) => name.toLowerCase().replace(/^class\s+/i, "").trim();
    const matchedClass = classesList.find(c => normalizeClass(c.name) === normalizeClass(className));
    const classId = matchedClass?.id || null;
    const value = {
      classId, subjectId: editSubjectId ? parseInt(editSubjectId) : null,
      customSubject: null, teacherId: editTeacherId || null, customTeacher: null,
    };

    if (isMasterMode && forDay) {
      const newMg = { ...masterGrid };
      newMg[forDay] = { ...(newMg[forDay] || {}) };
      if (!editSubjectId && !editTeacherId) { delete newMg[forDay][cellKey]; }
      else { newMg[forDay][cellKey] = value; }
      setMasterGrid(newMg);
    } else {
      const newGrid = { ...gridData };
      if (!editSubjectId && !editTeacherId) { delete newGrid[cellKey]; }
      else { newGrid[cellKey] = value; }
      setGridData(newGrid);
    }
    setEditorCell(null);
  };

  const handleClearCell = () => {
    if (!editorCell) return;
    const { className, periodName, forDay } = editorCell;
    const cellKey = `${className}-${periodName}`;
    if (isMasterMode && forDay) {
      const newMg = { ...masterGrid };
      newMg[forDay] = { ...(newMg[forDay] || {}) };
      delete newMg[forDay][cellKey];
      setMasterGrid(newMg);
    } else {
      const newGrid = { ...gridData };
      delete newGrid[cellKey];
      setGridData(newGrid);
    }
    setEditorCell(null);
  };

  // Save single day
  const saveDay = async (day: string, grid: Record<string, any>) => {
    const entries: any[] = [];
    Object.keys(grid).forEach(key => {
      const [className, periodName] = key.split("-");
      const periodInfo = PERIOD_ROWS.find(r => r.name === periodName);
      if (!periodInfo) return;
      const cell = grid[key];
      entries.push({ className, periodName, startTime: periodInfo.start, endTime: periodInfo.end, classId: cell.classId, subjectId: cell.subjectId, customSubject: cell.customSubject, teacherId: cell.teacherId, customTeacher: cell.customTeacher });
    });
    CLASSES_COLS.forEach(cls => {
      if (isEarlyDismissalClass(cls)) {
        entries.push({ className: cls, periodName: "LUNCH", startTime: "11:40", endTime: "12:00", customSubject: "School Is Out", customTeacher: null });
      } else if (!grid[`${cls}-LUNCH`]) {
        entries.push({ className: cls, periodName: "LUNCH", startTime: "11:40", endTime: "12:00", customSubject: "LUNCH", customTeacher: null });
      }
    });
    const res = await fetch("/api/timetable/save", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayOfWeek: day, entries }),
    });
    if (!res.ok) throw new Error(`Failed to save ${day}`);
  };

  const handleSaveCurrentDay = async () => {
    try {
      setSaving(true); setFeedback(null);
      await saveDay(activeDay, gridData);
      setFeedback({ type: "success", text: `✅ ${activeDay} timetable saved!` });
      setIsEditMode(false);
      fetchTimetableData();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally { setSaving(false); }
  };

  const handleSaveMasterDay = async (day: string) => {
    try {
      setSavingDay(day);
      await saveDay(day, masterGrid[day] || {});
      setFeedback({ type: "success", text: `✅ ${day} saved to Master Timetable!` });
      fetchTimetableData();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally { setSavingDay(null); }
  };

  const handleSaveAllMaster = async () => {
    try {
      setSaving(true); setFeedback(null);
      for (const day of DAYS_OF_WEEK) {
        await saveDay(day, masterGrid[day] || {});
      }
      setFeedback({ type: "success", text: "✅ Master Timetable saved for all 6 days!" });
      fetchTimetableData();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally { setSaving(false); }
  };

  const openMasterMode = () => {
    buildMasterGrid(dbTimetable);
    setIsMasterMode(true);
    setIsEditMode(false);
    setMasterActiveDay(activeDay);
  };

  const closeMasterMode = () => {
    setIsMasterMode(false);
  };

  const handleCopyCurrentDayToAll = () => {
    if (!masterActiveDay || masterActiveDay === "All Days") return;
    const currentDayGrid = masterGrid[masterActiveDay] || {};
    const newMg = { ...masterGrid };
    DAYS_OF_WEEK.forEach(day => {
      if (day !== masterActiveDay) {
        newMg[day] = JSON.parse(JSON.stringify(currentDayGrid));
      }
    });
    setMasterGrid(newMg);
    setFeedback({
      type: "success",
      text: `📋 Copied ${masterActiveDay}'s timetable to all other days! Click "Save All Days" to save to the database.`
    });
  };

  const enterEditMode = () => {
    buildGridForDay(dbTimetable, activeDay);
    setIsEditMode(true);
  };

  const cancelEditMode = () => {
    buildGridForDay(dbTimetable, activeDay);
    setIsEditMode(false);
    setFeedback(null);
  };

  // ===== ANALYSIS LOGIC =====
  const teacherAnalysisBase = useMemo(() => {
    const analysis: Record<string, { name: string; weeklyPeriods: number; byDay: Record<string, { periods: number; slots: string[] }> }> = {};
    teachersList.forEach(t => {
      analysis[t.id] = { name: t.name, weeklyPeriods: 0, byDay: {} };
      DAYS_OF_WEEK.forEach(day => { analysis[t.id].byDay[day] = { periods: 0, slots: [] }; });
    });
    DAYS_OF_WEEK.forEach(day => {
      dbTimetable.filter(e => e.dayOfWeek === day && e.teacherId).forEach(e => {
        if (!analysis[e.teacherId]) return;
        const period = PERIOD_ROWS.find(r => r.name === e.periodName);
        if (!period || period.isBreak) return;
        analysis[e.teacherId].byDay[day].periods += 1;
        analysis[e.teacherId].byDay[day].slots.push(`${e.className} – ${e.periodName} (${period.start})`);
        analysis[e.teacherId].weeklyPeriods += 1;
      });
    });
    return analysis;
  }, [dbTimetable, teachersList]);

  const { multiplier, dayFilter } = getFilterMultiplier(analysisFilter, todayName);

  const teacherAnalysis = useMemo(() => {
    return Object.entries(teacherAnalysisBase).map(([id, data]) => {
      const displayByDay: Record<string, { periods: number; scaledPeriods: number; slots: string[] }> = {};
      let displayTotal = 0;
      DAYS_OF_WEEK.forEach(day => {
        const base = data.byDay[day];
        const included = dayFilter ? day === dayFilter : true;
        const scaled = included ? base.periods * multiplier : 0;
        displayByDay[day] = { periods: base.periods, scaledPeriods: scaled, slots: base.slots };
        if (included) displayTotal += base.periods * multiplier;
      });
      return { id, name: data.name, weeklyPeriods: data.weeklyPeriods, totalPeriods: displayTotal, byDay: displayByDay };
    }).sort((a, b) => b.totalPeriods - a.totalPeriods);
  }, [teacherAnalysisBase, analysisFilter, multiplier, dayFilter]);

  const selectedTeacherData = useMemo(() =>
    analysisTeacherId ? teacherAnalysis.find(t => t.id === analysisTeacherId) || null : null,
    [analysisTeacherId, teacherAnalysis]);

  const maxHours = teacherAnalysis.length > 0 ? (teacherAnalysis[0].totalPeriods || 1) : 1;
  const filterLabel = ANALYSIS_FILTERS.find(f => f.value === analysisFilter)?.label || "";
  const unitLabel = analysisFilter === "TODAY" ? "periods today" : analysisFilter === "THIS_WEEK" ? "periods/week" : analysisFilter === "THIS_MONTH" ? "periods this month" : "periods this year";

  // ===== RENDER TIMETABLE GRID =====
  const renderGrid = (grid: Record<string, any>, dayForCellClick: string, editable: boolean) => (
    <div className="bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-sm max-w-full overflow-x-auto select-none">
      <table className="w-full text-left border-collapse min-w-[1000px]">
        <thead>
          <tr className="bg-slate-50/70 border-b border-slate-100">
            <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider w-[120px]">From – To</th>
            {CLASSES_COLS.map(cls => (
              <th key={cls} className="p-4 text-xs font-black text-slate-800 uppercase tracking-widest text-center border-l border-slate-100 bg-pink-50/10">{cls}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {PERIOD_ROWS.map(row => {
            const isLunch = row.name === "LUNCH";
            const isPrayer = row.name === "PRAYER";
            const isOut = row.name === "School Is Out";
            return (
              <tr key={row.name} className={cn("transition-colors", (isLunch || isPrayer || isOut) ? "bg-slate-50/50" : editable ? "hover:bg-pink-50/5" : "")}>
                <td className="p-4 border-r border-slate-100">
                  <div className="text-xs font-black text-slate-900 leading-none">{row.start} - {row.end}</div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1.5">{row.name}</div>
                </td>
                {CLASSES_COLS.map(cls => {
                  const cellKey = `${cls}-${row.name}`;
                  const cell = grid[cellKey];
                  if (isEarlyDismissalClass(cls) && (isLunch || PERIOD_ROWS.indexOf(row) > 4)) {
                    if (isLunch) return (
                      <td key={cellKey} rowSpan={PERIOD_ROWS.length - 4}
                        className="p-4 border-l border-slate-100 bg-rose-50/30 text-center text-xs text-rose-500 uppercase tracking-widest align-middle border-b border-slate-100 font-black w-[110px]">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span>School Is Out</span>
                          <span className="text-[9px] font-bold text-slate-400 capitalize">11:40 dismissal</span>
                        </div>
                      </td>
                    );
                    return null;
                  }
                  if (isLunch) return (
                    <td key={cellKey} onClick={() => editable && handleCellClick(cls, row.name, row.start, row.end, dayForCellClick)}
                      className={cn("p-4 border-l border-slate-100 text-center transition-all group", editable && "cursor-pointer hover:bg-slate-100/50")}>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">LUNCH</div>
                      <div className="text-[9px] font-bold text-slate-400 mt-1 italic leading-tight group-hover:text-pink-600">
                        {cell?.customTeacher || cell?.teacherId ? (cell.customTeacher || teachersList.find(t => t.id === cell.teacherId)?.name) : "No Duty"}
                      </div>
                    </td>
                  );
                  if (isPrayer || isOut) return (
                    <td key={cellKey} className="p-4 border-l border-slate-100 text-center font-black text-[10px] uppercase tracking-wider text-slate-400">{row.name}</td>
                  );
                  const displaySubject = cell?.customSubject || (cell?.subjectId && subjectsList.find(s => s.id === cell.subjectId)?.name) || "";
                  const displayTeacher = cell?.customTeacher || (cell?.teacherId && teachersList.find(t => t.id === cell.teacherId)?.name) || "";
                  return (
                    <td key={cellKey}
                      onClick={() => editable && handleCellClick(cls, row.name, row.start, row.end, dayForCellClick)}
                      className={cn("p-3 border-l border-slate-100 text-center transition-all",
                        editable && "cursor-pointer active:scale-[0.98]",
                        editable && (displaySubject || displayTeacher) && "hover:bg-amber-50/30",
                        editable && !displaySubject && !displayTeacher && "hover:bg-pink-50/20",
                        !editable && "cursor-default",
                        (displaySubject || displayTeacher) ? "bg-amber-50/20" : ""
                      )}>
                      {displaySubject ? (
                        <div className="space-y-1">
                          <div className="text-xs font-black text-slate-800 uppercase tracking-wide leading-tight">{displaySubject}</div>
                          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{displayTeacher || "—"}</div>
                        </div>
                      ) : (
                        <div className={cn("text-[9px] font-black uppercase tracking-widest py-2", editable ? "text-slate-300" : "text-slate-200")}>
                          {editable ? "+ Empty" : "—"}
                        </div>
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
  );

  return (
    <div className="space-y-6">

      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Clock className="text-pink-600 animate-pulse" size={28} /> Time Table Management
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Today is <span className="font-bold text-pink-600">{todayText || "loading..."}</span>. View today's schedule or edit the master timetable.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Tab switchers */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button onClick={() => { setActiveTab("timetable"); setIsEditMode(false); setIsMasterMode(false); }}
              className={cn("flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-lg transition-all",
                activeTab === "timetable" ? "bg-pink-600 text-white shadow-md" : "text-slate-500 hover:text-slate-700")}>
              <Calendar size={12} /> Timetable
            </button>
            <button onClick={() => setActiveTab("analysis")}
              className={cn("flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-lg transition-all",
                activeTab === "analysis" ? "bg-violet-600 text-white shadow-md" : "text-slate-500 hover:text-slate-700")}>
              <BarChart3 size={12} /> Teacher Analysis
            </button>
          </div>

          {activeTab === "timetable" && !isMasterMode && (
            <>
              {/* Set Holiday button */}
              <button onClick={() => { setShowHolidayModal(true); setHolidayActionMsg(null); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-all shadow-md active:scale-95">
                <Calendar size={12} /> Set Holiday
              </button>

              {/* Master Timetable button */}
              <button onClick={openMasterMode}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-xl transition-all shadow-md active:scale-95">
                <LayoutGrid size={12} /> Master Timetable
              </button>

              {/* Edit / Save / Cancel */}
              {!isEditMode ? (
                <button onClick={enterEditMode}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95">
                  <Pencil size={12} /> Edit Day
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={cancelEditMode}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black rounded-xl transition-all active:scale-95">
                    <X size={12} /> Cancel
                  </button>
                  <button onClick={handleSaveCurrentDay} disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-pink-500/20 active:scale-95 disabled:opacity-50">
                    {saving ? <RefreshCw className="animate-spin" size={12} /> : <Save size={12} />}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Master mode action buttons */}
          {isMasterMode && (
            <div className="flex items-center gap-2">
              <button onClick={closeMasterMode}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black rounded-xl transition-all active:scale-95">
                <X size={12} /> Close
              </button>
              <button onClick={handleSaveAllMaster} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50">
                {saving ? <RefreshCw className="animate-spin" size={12} /> : <CheckCircle2 size={12} />}
                {saving ? "Saving All..." : "Save All Days"}
              </button>
            </div>
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
      {activeTab === "timetable" && !isMasterMode && (
        <>
          {/* Day selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50 shadow-inner">
              {DAYS_OF_WEEK.map(day => (
                <button key={day} onClick={() => { setActiveDay(day); if (isEditMode) setIsEditMode(false); }}
                  className={cn(
                    "flex-1 px-3 py-2 text-[10px] md:text-xs font-black uppercase tracking-wider rounded-xl transition-all relative whitespace-nowrap",
                    activeDay === day ? "bg-pink-600 text-white shadow-lg shadow-pink-500/20" : "text-slate-500 hover:text-slate-700"
                  )}>
                  {day.slice(0, 3)}
                  {day === todayName && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-emerald-400 rounded-full border border-white" />
                  )}
                </button>
              ))}
            </div>

            {/* Today badge */}
            {activeDay === todayName && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[10px] font-black text-emerald-700">
                <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Today's Schedule
              </div>
            )}

            {/* Edit mode indicator */}
            {isEditMode && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-xl text-[10px] font-black text-amber-700 animate-pulse">
                <Pencil size={10} /> Editing Mode — Click any cell to edit
              </div>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4 text-slate-400 font-bold text-xs uppercase tracking-widest">
              <RefreshCw className="animate-spin text-pink-600" size={24} />
              Loading Timetable...
            </div>
          ) : (
            <>
              {(() => {
                const activeDate = getDateForDayOfWeek(activeDay);
                const activeHoliday = holidaysList.find(h => h.date === activeDate);
                if (!activeHoliday) return null;
                const isHalfDay = activeHoliday.type === "HALF_DAY";
                return (
                  <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center text-rose-800 space-y-2 mb-6 shadow-sm">
                    <Calendar className="h-8 w-8 text-rose-500 mx-auto animate-bounce" />
                    <h3 className="text-base font-black uppercase tracking-wide">
                      Holiday: {activeHoliday.title}
                      <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 uppercase">
                        {isHalfDay ? "Half Day" : "Full Day"}
                      </span>
                    </h3>
                    <p className="text-xs font-semibold text-rose-600">
                      {isHalfDay 
                        ? `This day (${formatDateString(activeHoliday.date)}) is set as a half day holiday. Timetable school hours run from ${activeHoliday.startTime || "--:--"} to ${activeHoliday.endTime || "--:--"}.`
                        : `This day (${formatDateString(activeHoliday.date)}) is set as a full day school holiday.`}
                    </p>
                  </div>
                );
              })()}
              {renderGrid(gridData, activeDay, isEditMode)}
            </>
          )}
        </>
      )}

      {/* ===== MASTER TIMETABLE OVERLAY ===== */}
      {activeTab === "timetable" && isMasterMode && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-slate-800 text-white rounded-2xl">
            <LayoutGrid className="h-5 w-5 text-slate-300 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-black text-sm">Master Timetable Editor</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Set the fixed weekly schedule for all days. Click a day tab below to see/edit, copy schedules between days, or click "Save All Days" to apply everything at once.</div>
            </div>
          </div>

          {/* Master Day Selector / Header Actions */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50 shadow-inner">
                {DAYS_OF_WEEK.map(day => (
                  <button key={day} onClick={() => setMasterActiveDay(day)}
                    className={cn(
                      "px-3.5 py-2 text-[10px] md:text-xs font-black uppercase tracking-wider rounded-xl transition-all relative whitespace-nowrap",
                      masterActiveDay === day ? "bg-pink-600 text-white shadow-lg shadow-pink-500/20" : "text-slate-500 hover:text-slate-700"
                    )}>
                    {day.slice(0, 3)}
                    {day === todayName && (
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-emerald-400 rounded-full border border-white" />
                    )}
                  </button>
                ))}
                
                {/* All Days button */}
                <button onClick={() => setMasterActiveDay("All Days")}
                  className={cn(
                    "px-3.5 py-2 text-[10px] md:text-xs font-black uppercase tracking-wider rounded-xl transition-all relative whitespace-nowrap border-l border-slate-200/50 ml-1 pl-2.5",
                    masterActiveDay === "All Days" ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-700"
                  )}>
                  All Days
                </button>
              </div>

              {/* Duplicate/Copy same timetable button */}
              {masterActiveDay !== "All Days" && (
                <button
                  onClick={handleCopyCurrentDayToAll}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black rounded-xl transition-all active:scale-95 shadow-sm"
                  title={`Copy ${masterActiveDay}'s timetable to all other days`}
                >
                  <RefreshCw className="h-3 w-3 text-amber-600 animate-spin" style={{ animationDuration: '4s' }} />
                  Copy {masterActiveDay} to All Days
                </button>
              )}
            </div>

            {/* Save Current Day button */}
            {masterActiveDay !== "All Days" && (
              <button
                onClick={() => handleSaveMasterDay(masterActiveDay)}
                disabled={savingDay === masterActiveDay}
                className="flex items-center gap-1.5 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-pink-500/20 active:scale-95 disabled:opacity-50"
              >
                {savingDay === masterActiveDay ? <RefreshCw className="animate-spin" size={12} /> : <Save size={12} />}
                {savingDay === masterActiveDay ? "Saving..." : `Save ${masterActiveDay}`}
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center gap-4 text-slate-400 font-bold text-xs uppercase tracking-widest">
              <RefreshCw className="animate-spin text-pink-600" size={24} />
              Loading Master Timetable...
            </div>
          ) : masterActiveDay === "All Days" ? (
            <div className="space-y-6">
              {DAYS_OF_WEEK.map(day => (
                <div key={day} className="space-y-3">
                  {/* Day header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h2 className={cn("text-sm font-black uppercase tracking-widest",
                        day === todayName ? "text-emerald-700" : "text-slate-800")}>
                        {day}
                      </h2>
                      {day === todayName && (
                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full animate-pulse">TODAY</span>
                      )}
                      <span className="text-[9px] text-slate-400 font-semibold">
                        {Object.values(masterGrid[day] || {}).filter((c: any) => c?.subjectId || c?.teacherId).length} periods filled
                      </span>
                    </div>
                    <button onClick={() => handleSaveMasterDay(day)} disabled={savingDay === day}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-[10px] font-black rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50">
                      {savingDay === day ? <RefreshCw className="animate-spin" size={10} /> : <Save size={10} />}
                      {savingDay === day ? "Saving..." : `Save ${day}`}
                    </button>
                  </div>

                  {/* Day grid */}
                  {renderGrid(masterGrid[day] || {}, day, true)}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className={cn("text-sm font-black uppercase tracking-widest",
                  masterActiveDay === todayName ? "text-emerald-700" : "text-slate-800")}>
                  {masterActiveDay}
                </h2>
                {masterActiveDay === todayName && (
                  <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full animate-pulse">TODAY</span>
                )}
                <span className="text-[9px] text-slate-400 font-semibold">
                  {Object.values(masterGrid[masterActiveDay] || {}).filter((c: any) => c?.subjectId || c?.teacherId).length} periods filled
                </span>
              </div>
              {(() => {
                const masterActiveDate = getDateForDayOfWeek(masterActiveDay);
                const masterActiveHoliday = holidaysList.find(h => h.date === masterActiveDate);
                if (!masterActiveHoliday) return null;
                const isHalfDay = masterActiveHoliday.type === "HALF_DAY";
                return (
                  <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center text-rose-800 space-y-2 mb-6 shadow-sm">
                    <Calendar className="h-8 w-8 text-rose-500 mx-auto" />
                    <h3 className="text-base font-black uppercase tracking-wide">
                      Holiday: {masterActiveHoliday.title}
                      <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 uppercase">
                        {isHalfDay ? "Half Day" : "Full Day"}
                      </span>
                    </h3>
                    <p className="text-xs font-semibold text-rose-600">
                      {isHalfDay 
                        ? `This day (${formatDateString(masterActiveHoliday.date)}) is set as a half day holiday. Timetable school hours run from ${masterActiveHoliday.startTime || "--:--"} to ${masterActiveHoliday.endTime || "--:--"}.`
                        : `This day (${formatDateString(masterActiveHoliday.date)}) is set as a full day school holiday.`}
                    </p>
                  </div>
                );
              })()}
              {renderGrid(masterGrid[masterActiveDay] || {}, masterActiveDay, true)}
            </div>
          )}
        </div>
      )}

      {/* ===== ANALYSIS TAB ===== */}
      {activeTab === "analysis" && (
        <div className="space-y-6">
          {/* Filter pills */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">View By:</span>
            {ANALYSIS_FILTERS.map(f => (
              <button key={f.value} onClick={() => setAnalysisFilter(f.value)} title={f.desc}
                className={cn("flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border",
                  analysisFilter === f.value
                    ? "bg-violet-600 text-white border-violet-600 shadow-md"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700")}>
                {f.icon} {f.label}
              </button>
            ))}
            <span className="ml-auto text-[10px] text-violet-500 font-bold italic bg-violet-50 px-3 py-1.5 rounded-lg border border-violet-100">
              {ANALYSIS_FILTERS.find(f => f.value === analysisFilter)?.desc}
            </span>
          </div>

          {/* Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-violet-600" /> Teacher Workload Overview
              </h2>
              <p className="text-xs text-slate-400 font-semibold">Sorted by total — <span className="text-violet-600">{filterLabel}</span></p>
            </div>
            <div className="p-5 space-y-3">
              {teacherAnalysis.filter(t => t.totalPeriods > 0).length === 0 ? (
                <p className="text-center text-slate-400 italic text-xs py-8">No teacher assignments found. Fill in the Master Timetable first.</p>
              ) : (
                teacherAnalysis.filter(t => t.totalPeriods > 0).map((teacher, idx) => (
                  <div key={teacher.id} onClick={() => setAnalysisTeacherId(teacher.id)}
                    className={cn("flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all hover:bg-violet-50 border",
                      analysisTeacherId === teacher.id ? "border-violet-400 bg-violet-50" : "border-transparent hover:border-violet-200")}>
                    <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0",
                      idx === 0 ? "bg-amber-100 text-amber-700" : idx === 1 ? "bg-slate-200 text-slate-600" : idx === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500")}>
                      #{idx + 1}
                    </div>
                    <div className="w-36 flex-shrink-0">
                      <div className="text-xs font-black text-slate-900 truncate">{teacher.name}</div>
                      <div className="text-[9px] text-violet-600 font-semibold">{teacher.totalPeriods} {unitLabel}</div>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full transition-all duration-700"
                          style={{ width: `${Math.round((teacher.totalPeriods / maxHours) * 100)}%` }} />
                      </div>
                      <span className="text-xs font-black text-violet-700 w-12 text-right">{teacher.totalPeriods}</span>
                    </div>
                    {analysisFilter !== "TODAY" && (
                      <div className="hidden md:flex gap-1 flex-shrink-0">
                        {DAYS_OF_WEEK.map(day => {
                          const count = (teacher.byDay[day] as any)?.periods || 0;
                          return (
                            <div key={day} title={`${day}: ${count}/week`}
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
                        <div className={cn("px-3 h-7 rounded-lg flex items-center text-[9px] font-black gap-1",
                          ((teacher.byDay[todayName] as any)?.periods || 0) === 0 ? "bg-slate-100 text-slate-400" : "bg-emerald-100 text-emerald-700")}>
                          {todayName.slice(0, 3)}: {(teacher.byDay[todayName] as any)?.periods || 0}
                        </div>
                      </div>
                    )}
                    <button className="p-1.5 text-violet-400 hover:text-violet-600 flex-shrink-0"><Eye size={14} /></button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Detail View */}
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
              <span className="ml-auto text-[9px] font-black bg-violet-100 text-violet-700 px-2 py-1 rounded-lg uppercase tracking-wider">{filterLabel}</span>
            </div>
            {!selectedTeacherData ? (
              <div className="py-16 text-center text-slate-400">
                <User className="h-10 w-10 mx-auto mb-3 text-slate-200" />
                <p className="font-bold text-sm">Select a teacher above or click a row</p>
                <p className="text-xs mt-1">to see their full schedule breakdown</p>
              </div>
            ) : (
              <div className="p-5 space-y-4">
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
                      { label: "Busiest Day", value: Object.entries(selectedTeacherData.byDay).sort(([, a]: any, [, b]: any) => b.periods - a.periods)[0]?.[0]?.slice(0, 3) || "—", color: "pink" },
                      { label: "Days Active", value: Object.values(selectedTeacherData.byDay).filter((d: any) => d.periods > 0).length, color: "emerald" },
                    ].map(s => (
                      <div key={s.label} className={`bg-${s.color}-100 rounded-xl p-2.5 text-center`}>
                        <div className={`text-base font-black text-${s.color}-700`}>{s.value}</div>
                        <div className={`text-[9px] font-bold text-${s.color}-500 uppercase tracking-wide leading-tight`}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-[10px] font-black uppercase text-slate-400 px-4 py-3">Day</th>
                        <th className="text-[10px] font-black uppercase text-slate-400 px-3 py-3 text-center">Per Week</th>
                        {analysisFilter !== "THIS_WEEK" && analysisFilter !== "TODAY" && (
                          <th className="text-[10px] font-black uppercase text-violet-500 px-3 py-3 text-center">{filterLabel} Total</th>
                        )}
                        <th className="text-[10px] font-black uppercase text-slate-400 px-3 py-3">Schedule Slots</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {DAYS_OF_WEEK.map(day => {
                        const dayData = selectedTeacherData.byDay[day] as any;
                        const count = dayData?.periods || 0;
                        const scaledCount = dayData?.scaledPeriods || 0;
                        const isToday = day === todayName;
                        const isFiltered = dayFilter && day !== dayFilter;
                        return (
                          <tr key={day} className={cn("hover:bg-slate-50/60 transition-colors", isToday && "bg-emerald-50/30", isFiltered && "opacity-30")}>
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
                              {dayData?.slots?.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {dayData.slots.map((slot: string, i: number) => (
                                    <span key={i} className="inline-flex px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-lg text-[9px] font-black">{slot}</span>
                                  ))}
                                </div>
                              ) : <span className="text-[10px] text-slate-300 italic font-semibold">No classes</span>}
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
          <div className="bg-white border border-slate-100 rounded-3xl max-w-md w-full shadow-2xl p-6 relative animate-in slide-in-from-bottom-8 duration-300">
            <button onClick={() => setEditorCell(null)}
              className="absolute top-4 right-4 h-8 w-8 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
              <X size={16} />
            </button>
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
              <div className="p-2.5 bg-pink-50 text-pink-600 rounded-xl"><Calendar size={20} /></div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  {editorCell.className} — {editorCell.forDay || activeDay}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                  {editorCell.periodName} ({editorCell.startTime} – {editorCell.endTime})
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><GraduationCap size={12} /> Select Teacher</label>
                <select value={editTeacherId} onChange={e => {
                  const teacherId = e.target.value;
                  setEditTeacherId(teacherId);
                  if (teacherId && editorCell) {
                    const normalizeClass = (name: string) => name.toLowerCase().replace(/^class\s+/i, "").trim();
                    const mc = classesList.find(c => normalizeClass(c.name) === normalizeClass(editorCell.className));
                    const classSubjects = subjectsList.filter(s => s.classId === mc?.id);
                    const matchedSubject = classSubjects.find(s => s.assignedTeacherId === teacherId);
                    if (matchedSubject) {
                      const isSubjectLocked = !isMasterMode && !!gridData[`${editorCell.className}-${editorCell.periodName}`]?.subjectId;
                      if (!isSubjectLocked) {
                        setEditSubjectId(String(matchedSubject.id));
                      }
                    }
                  }
                }}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:border-pink-500">
                  <option value="">-- Choose Teacher --</option>
                  {teachersList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><BookOpen size={12} /> Select Subject</label>
                <select value={editSubjectId} onChange={e => {
                  const subjectId = e.target.value;
                  setEditSubjectId(subjectId);
                  if (subjectId) {
                    const subject = subjectsList.find(s => String(s.id) === subjectId);
                    if (subject && subject.assignedTeacherId) {
                      setEditTeacherId(String(subject.assignedTeacherId));
                    }
                  }
                }}
                  disabled={!isMasterMode && !!editorCell && !!gridData[`${editorCell.className}-${editorCell.periodName}`]?.subjectId}
                  className={cn("w-full text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:border-pink-500", 
                    (!isMasterMode && !!editorCell && !!gridData[`${editorCell.className}-${editorCell.periodName}`]?.subjectId) && "opacity-60 cursor-not-allowed"
                  )}>
                  <option value="">-- Choose Subject --</option>
                  {(() => {
                    const normalizeClass = (name: string) => name.toLowerCase().replace(/^class\s+/i, "").trim();
                    const mc = classesList.find(c => normalizeClass(c.name) === normalizeClass(editorCell?.className || ""));
                    return subjectsList.filter(s => s.classId === mc?.id).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ));
                  })()}
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
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Holiday Modal */}
      {showHolidayModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between mb-5 border-b pb-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-rose-600" /> Set School Holiday
              </h2>
              <button onClick={() => setShowHolidayModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveHoliday} className="space-y-4">
              {holidayActionMsg && (
                <div className={cn("p-3 rounded-xl text-xs font-bold",
                  holidayActionMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200")}>
                  {holidayActionMsg.text}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Select Date *</label>
                  <input type="date" value={holidayDate} onChange={e => setHolidayDate(e.target.value)} required
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-rose-500" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Holiday Title *</label>
                  <input type="text" value={holidayTitle} onChange={e => setHolidayTitle(e.target.value)} required
                    placeholder="e.g. Good Friday, Diwali"
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-rose-500" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Holiday Type</label>
                  <select value={holidayType} onChange={e => setHolidayType(e.target.value as "FULL_DAY" | "HALF_DAY")}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-rose-500">
                    <option value="FULL_DAY">Full Day</option>
                    <option value="HALF_DAY">Half Day</option>
                  </select>
                </div>
                {holidayType === "HALF_DAY" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Start Period *</label>
                      <select value={holidayStartTime} onChange={e => setHolidayStartTime(e.target.value)} required
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-rose-500">
                        <option value="">Select Start Period</option>
                        {PERIOD_ROWS.map((p, i) => (
                          <option key={`start-${i}`} value={p.start}>
                            {p.name} ({p.start})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-slate-500 tracking-wider">End Period *</label>
                      <select value={holidayEndTime} onChange={e => setHolidayEndTime(e.target.value)} required
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-rose-500">
                        <option value="">Select End Period</option>
                        {PERIOD_ROWS.map((p, i) => (
                          <option key={`end-${i}`} value={p.end}>
                            {p.name} ({p.end})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
              <button type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95">
                Save Holiday
              </button>
            </form>
            
            <div className="mt-6 border-t pt-4">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-3">Scheduled Holidays</h3>
              {holidaysList.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No scheduled holidays.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {holidaysList.map(h => (
                    <div key={h.id} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                      <div>
                        <div className="text-xs font-black text-slate-800">{h.title}</div>
                        <div className="text-[10px] text-slate-400 font-bold">
                          {formatDateString(h.date)} &bull; {h.type === "HALF_DAY" ? `Half Day (${h.startTime} - ${h.endTime})` : "Full Day"}
                        </div>
                      </div>
                      <button onClick={() => handleDeleteHoliday(h.date)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
