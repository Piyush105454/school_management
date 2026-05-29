"use client";

import React, { useState, useEffect } from "react";
import { 
  Clock, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  Calendar, 
  GraduationCap, 
  User, 
  X, 
  Undo,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

// Define structured Columns (Classes)
const CLASSES_COLS = [
  "Nursery", 
  "KG I", 
  "KG II", 
  "Class 1", 
  "Class 2", 
  "Class 3", 
  "Class 4", 
  "Class 5"
];

// Define structured Rows (Periods / Slots)
const PERIOD_ROWS = [
  { name: "Period 1st", start: "09:00", end: "09:40", isBreak: false },
  { name: "Period 2nd", start: "09:40", end: "10:20", isBreak: false },
  { name: "Period 3rd", start: "10:20", end: "11:00", isBreak: false },
  { name: "Period 4th", start: "11:00", end: "11:40", isBreak: false },
  { name: "LUNCH", start: "11:40", end: "12:00", isBreak: true },
  { name: "Period 5th", start: "12:00", end: "12:40", isBreak: false },
  { name: "Period 6th", start: "12:40", end: "13:20", isBreak: false },
  { name: "Period 7th", start: "13:20", end: "14:00", isBreak: false },
  { name: "Period 8th", start: "14:00", end: "14:30", isBreak: false },
  { name: "PRAYER", start: "14:30", end: "14:35", isBreak: true },
  { name: "School Is Out", start: "14:35", end: "14:45", isBreak: true }
];

// Predefined weekly days
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Helper to identify early dismissal classes
const isEarlyDismissalClass = (className: string) => {
  return ["Nursery", "KG I", "KG II"].includes(className);
};

export default function TimetableClient() {
  const [activeDay, setActiveDay] = useState<string>("Monday");
  const [dbTimetable, setDbTimetable] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [teachersList, setTeachersList] = useState<any[]>([]);
  
  // Local modifications state
  const [gridData, setGridData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Cell Editor Modal state
  const [editorCell, setEditorCell] = useState<{
    className: string;
    periodName: string;
    startTime: string;
    endTime: string;
  } | null>(null);

  const [editSubjectId, setEditSubjectId] = useState<string>("");
  const [editCustomSubject, setEditCustomSubject] = useState<string>("");
  const [editTeacherId, setEditTeacherId] = useState<string>("");
  const [editCustomTeacher, setEditCustomTeacher] = useState<string>("");

  useEffect(() => {
    fetchTimetableData();
  }, []);

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

      // Build grid data for activeDay
      buildGridForDay(data.timetable || [], activeDay);
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: "error", text: err.message || "Failed to fetch timetable data" });
    } finally {
      setLoading(false);
    }
  };

  const buildGridForDay = (timetableEntries: any[], day: string) => {
    const dayEntries = timetableEntries.filter(entry => entry.dayOfWeek === day);
    const newGrid: Record<string, any> = {};
    dayEntries.forEach(entry => {
      const key = `${entry.className}-${entry.periodName}`;
      newGrid[key] = {
        classId: entry.classId,
        subjectId: entry.subjectId,
        customSubject: entry.customSubject,
        teacherId: entry.teacherId,
        customTeacher: entry.customTeacher,
      };
    });
    setGridData(newGrid);
  };

  // Re-build grid when changing day
  useEffect(() => {
    if (!loading) {
      buildGridForDay(dbTimetable, activeDay);
      setFeedback(null);
    }
  }, [activeDay]);

  const handleCellClick = (className: string, periodName: string, startTime: string, endTime: string) => {
    // Break or disabled cells are not editable
    if (isEarlyDismissalClass(className) && PERIOD_ROWS.findIndex(r => r.name === periodName) >= 4) {
      return; // Early dismissal Nursery/KG classes end schedule at LUNCH
    }
    
    // Prayer and School Is Out are general breaks, not editable at individual cell level
    if (periodName === "PRAYER" || periodName === "School Is Out") return;

    const cellKey = `${className}-${periodName}`;
    const cellValue = gridData[cellKey] || {};

    setEditorCell({ className, periodName, startTime, endTime });
    setEditSubjectId(cellValue.subjectId ? String(cellValue.subjectId) : "");
    setEditCustomSubject(cellValue.customSubject || "");
    setEditTeacherId(cellValue.teacherId ? String(cellValue.teacherId) : "");
    setEditCustomTeacher(cellValue.customTeacher || "");
  };

  const handleSaveCell = () => {
    if (!editorCell) return;
    const { className, periodName } = editorCell;
    const cellKey = `${className}-${periodName}`;

    // Find linked database objects
    const matchedClass = classesList.find(c => c.name.toLowerCase() === className.toLowerCase());
    const classId = matchedClass ? matchedClass.id : null;

    const newGrid = { ...gridData };
    
    // If clearing fields
    if (!editSubjectId && !editCustomSubject && !editTeacherId && !editCustomTeacher) {
      delete newGrid[cellKey];
    } else {
      newGrid[cellKey] = {
        classId,
        subjectId: editSubjectId && editSubjectId !== "CUSTOM" ? parseInt(editSubjectId) : null,
        customSubject: editSubjectId === "CUSTOM" ? (editCustomSubject || null) : (editCustomSubject || null),
        teacherId: editTeacherId && editTeacherId !== "CUSTOM" ? editTeacherId : null,
        customTeacher: editTeacherId === "CUSTOM" ? (editCustomTeacher || null) : (editCustomTeacher || null),
      };
    }

    setGridData(newGrid);
    setEditorCell(null);
  };

  const handleClearCell = () => {
    if (!editorCell) return;
    const { className, periodName } = editorCell;
    const cellKey = `${className}-${periodName}`;
    const newGrid = { ...gridData };
    delete newGrid[cellKey];
    setGridData(newGrid);
    setEditorCell(null);
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setFeedback(null);

      // Serialize grid data back to entries format
      const entries: any[] = [];
      Object.keys(gridData).forEach(key => {
        const [className, periodName] = key.split("-");
        const periodInfo = PERIOD_ROWS.find(r => r.name === periodName);
        if (!periodInfo) return;

        const cell = gridData[key];
        entries.push({
          className,
          periodName,
          startTime: periodInfo.start,
          endTime: periodInfo.end,
          classId: cell.classId,
          subjectId: cell.subjectId,
          customSubject: cell.customSubject,
          teacherId: cell.teacherId,
          customTeacher: cell.customTeacher,
        });
      });

      // Also append Nursery/KG School Out slots and lunch slots automatically to preserve layout in DB
      CLASSES_COLS.forEach(cls => {
        if (isEarlyDismissalClass(cls)) {
          // Add School Out at LUNCH slot
          entries.push({
            className: cls,
            periodName: "LUNCH",
            startTime: "11:40",
            endTime: "12:00",
            customSubject: "School Is Out",
            customTeacher: null
          });
        } else {
          // If Class 1-5 has custom lunch details written, let it save, otherwise default custom lunch
          const lunchKey = `${cls}-LUNCH`;
          if (!gridData[lunchKey]) {
            entries.push({
              className: cls,
              periodName: "LUNCH",
              startTime: "11:40",
              endTime: "12:00",
              customSubject: "LUNCH",
              customTeacher: null
            });
          }
        }
      });

      const res = await fetch("/api/timetable/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayOfWeek: activeDay, entries }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save timetable changes");

      setFeedback({ type: "success", text: `Timetable for ${activeDay} successfully saved and updated!` });
      // Update local db state
      fetchTimetableData();
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: "error", text: err.message || "Failed to save changes" });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDay = () => {
    buildGridForDay(dbTimetable, activeDay);
    setFeedback(null);
  };

  const handleClearDay = () => {
    if (confirm(`Wipe out all schedule cells for ${activeDay}? You will need to save to apply changes.`)) {
      setGridData({});
      setFeedback({ type: "success", text: "Timetable cleared for this day. Click 'Save Timetable Changes' to update." });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight flex items-center gap-2">
            <Clock className="text-pink-600 animate-pulse" size={28} />
            Time Table Management
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Define lectures, subject distributions, and class sessions.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDay}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all active:scale-95"
            disabled={loading || saving}
          >
            <Undo size={14} />
            Reset Day
          </button>
          <button
            onClick={handleClearDay}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl transition-all active:scale-95"
            disabled={loading || saving}
          >
            Clear Day
          </button>
          <button
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-6 py-2.5 bg-pink-600 hover:bg-pink-700 disabled:bg-slate-300 disabled:shadow-none text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-pink-500/10 active:scale-95"
            disabled={loading || saving}
          >
            {saving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
            Save Timetable Changes
          </button>
        </div>
      </div>

      {/* Weekday Selector Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50 shadow-inner max-w-2xl">
        {DAYS_OF_WEEK.map(day => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={cn(
              "flex-1 py-2 text-[10px] md:text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-98",
              activeDay === day 
                ? "bg-pink-600 text-white shadow-lg shadow-pink-500/20"
                : "text-slate-500 hover:text-slate-700"
            )}
            disabled={loading || saving}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={cn(
          "p-4 rounded-2xl border flex items-center gap-3 animate-in zoom-in-95 duration-200",
          feedback.type === "success" 
            ? "bg-emerald-50 border-emerald-200/60 text-emerald-800" 
            : "bg-rose-50 border-rose-200/60 text-rose-800"
        )}>
          <AlertCircle size={18} />
          <span className="text-xs font-bold uppercase tracking-wide">{feedback.text}</span>
        </div>
      )}

      {/* Timetable visual layout */}
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
                {CLASSES_COLS.map(className => (
                  <th key={className} className="p-4 text-xs font-black text-slate-800 uppercase tracking-widest text-center border-l border-slate-100 bg-pink-50/10">
                    {className}
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 font-outfit">
              {PERIOD_ROWS.map((row) => {
                const isLunch = row.name === "LUNCH";
                const isPrayer = row.name === "PRAYER";
                const isOut = row.name === "School Is Out";

                return (
                  <tr key={row.name} className={cn(
                    "hover:bg-slate-50/20 transition-colors",
                    (isLunch || isPrayer || isOut) && "bg-slate-50/50"
                  )}>
                    
                    {/* Timing Row Label */}
                    <td className="p-4 border-r border-slate-100">
                      <div className="text-xs font-black text-slate-900 leading-none">{row.start} - {row.end}</div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1.5">{row.name}</div>
                    </td>

                    {/* Dynamic grid cells */}
                    {CLASSES_COLS.map(className => {
                      const cellKey = `${className}-${row.name}`;
                      const cell = gridData[cellKey];

                      // 1. NURSERY / KG DISMISSAL AT LUNCH
                      if (isEarlyDismissalClass(className) && (isLunch || PERIOD_ROWS.indexOf(row) > 4)) {
                        if (isLunch) {
                          // Spanning dismissal box
                          return (
                            <td 
                              key={cellKey} 
                              rowSpan={PERIOD_ROWS.length - 4} 
                              className="p-4 border-l border-slate-100 bg-rose-50/30 text-center font-bold text-xs text-rose-500 font-black uppercase tracking-widest align-middle border-b border-slate-100 w-[110px]"
                            >
                              <div className="flex flex-col items-center justify-center gap-1">
                                <span>School Is Out</span>
                                <span className="text-[9px] font-bold text-slate-400 capitalize">11:40 dismissal</span>
                              </div>
                            </td>
                          );
                        }
                        // Return null since cells are spanned by rowSpan
                        return null;
                      }

                      // 2. LUNCH FOR CLASS 1-5
                      if (isLunch) {
                        return (
                          <td 
                            key={cellKey}
                            onClick={() => handleCellClick(className, row.name, row.start, row.end)}
                            className="p-4 border-l border-slate-100 text-center cursor-pointer hover:bg-slate-100/50 transition-all group"
                          >
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">LUNCH</div>
                            <div className="text-[9px] font-bold text-slate-400 mt-1 italic leading-tight group-hover:text-pink-600">
                              {cell?.customTeacher || cell?.teacherId ? (cell.customTeacher || teachersList.find(t => t.id === cell.teacherId)?.name) : "No Duty"}
                            </div>
                          </td>
                        );
                      }

                      // 3. GENERAL BREAK: PRAYER / SCHOOL OUT FOR ALL
                      if (isPrayer || isOut) {
                        return (
                          <td key={cellKey} className="p-4 border-l border-slate-100 text-center font-bold text-[10px] uppercase tracking-wider text-slate-500">
                            {row.name}
                          </td>
                        );
                      }

                      // 4. REGULAR EDITABLE CLASS PERIOD
                      const displaySubject = cell?.customSubject || (cell?.subjectId && subjectsList.find(s => s.id === cell.subjectId)?.name) || "";
                      const displayTeacher = cell?.customTeacher || (cell?.teacherId && teachersList.find(t => t.id === cell.teacherId)?.name) || "";

                      return (
                        <td
                          key={cellKey}
                          onClick={() => handleCellClick(className, row.name, row.start, row.end)}
                          className={cn(
                            "p-3 border-l border-slate-100 text-center cursor-pointer transition-all hover:bg-pink-50/10 active:scale-[0.98]",
                            (displaySubject || displayTeacher) 
                              ? "bg-amber-50/20 hover:bg-amber-50/30" 
                              : "hover:bg-slate-50"
                          )}
                        >
                          {displaySubject ? (
                            <div className="space-y-1">
                              <div className="text-xs font-black text-slate-800 uppercase tracking-wide leading-tight">{displaySubject}</div>
                              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{displayTeacher || "--"}</div>
                            </div>
                          ) : (
                            <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest group-hover:text-slate-400 py-2">
                              + Empty
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
      )}

      {/* Premium Cell Editor Overlay Modal */}
      {editorCell && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-3xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
            
            <button 
              onClick={() => setEditorCell(null)}
              className="absolute top-4 right-4 h-8 w-8 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
              <div className="p-2.5 bg-pink-50 text-pink-600 rounded-xl">
                <Calendar size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">{editorCell.className} Timetable</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                  {editorCell.periodName} ({editorCell.startTime} - {editorCell.endTime})
                </p>
              </div>
            </div>

            <div className="space-y-4">
              
              {/* Subject Select */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <BookOpen size={12} />
                  Select Subject
                </label>
                <select
                  value={editSubjectId}
                  onChange={(e) => {
                    setEditSubjectId(e.target.value);
                    if (e.target.value !== "CUSTOM") setEditCustomSubject("");
                  }}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:border-pink-500 transition-colors"
                >
                  <option value="">-- Choose Subject --</option>
                  <option value="CUSTOM">✏️ Custom Subject (Write below)</option>
                  
                  {subjectsList
                    // Filter subjects by selected class name if name matches class number
                    .filter(sub => {
                      const classNum = editorCell.className.match(/\d+/);
                      const subClassNum = sub.medium?.match(/\d+/);
                      return !classNum || !subClassNum || classNum[0] === subClassNum[0];
                    })
                    .map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))
                  }
                </select>
              </div>

              {/* Custom Subject Input */}
              {(editSubjectId === "CUSTOM" || !editSubjectId) && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">
                    Custom Subject Text
                  </label>
                  <input
                    type="text"
                    value={editCustomSubject}
                    onChange={(e) => setEditCustomSubject(e.target.value)}
                    placeholder="e.g. Spoken English, Read Write, Mother Teacher"
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:border-pink-500 transition-colors"
                  />
                </div>
              )}

              {/* Teacher Select */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <GraduationCap size={12} />
                  Select Teacher
                </label>
                <select
                  value={editTeacherId}
                  onChange={(e) => {
                    setEditTeacherId(e.target.value);
                    if (e.target.value !== "CUSTOM") setEditCustomTeacher("");
                  }}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:border-pink-500 transition-colors"
                >
                  <option value="">-- Choose Teacher --</option>
                  <option value="CUSTOM">✏️ Custom Teacher Name (Write below)</option>
                  {teachersList.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))}
                </select>
              </div>

              {/* Custom Teacher Input */}
              {(editTeacherId === "CUSTOM" || !editTeacherId) && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User size={10} />
                    Custom Teacher Name
                  </label>
                  <input
                    type="text"
                    value={editCustomTeacher}
                    onChange={(e) => setEditCustomTeacher(e.target.value)}
                    placeholder="e.g. Aiman Khan, Yasmeen Mam, Riya Soni"
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:border-pink-500 transition-colors"
                  />
                </div>
              )}

            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 border-t border-slate-100 pt-5 mt-6">
              <button
                onClick={handleClearCell}
                className="flex-1 py-3 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-black uppercase tracking-wider rounded-2xl transition-all"
              >
                Clear Slot
              </button>
              <button
                onClick={handleSaveCell}
                className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-pink-500/10"
              >
                Apply Schedule
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
