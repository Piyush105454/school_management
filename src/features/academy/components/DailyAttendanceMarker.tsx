"use client";

import React, { useState, useEffect } from "react";
import { Check, X, Save, Calendar, Loader2, Users, Info } from "lucide-react";
import { saveDailyAttendanceAction } from "../actions/dailyAttendanceActions";
import { cn } from "@/lib/utils";

interface Student {
  id: number;
  name: string;
  rollNumber: string | null;
}

interface DailyAttendanceMarkerProps {
  classId: number;
  className: string;
  students: Student[];
  initialDate?: string;
  isAdmin?: boolean;
}

export default function DailyAttendanceMarker({ 
  classId, 
  className, 
  students,
  initialDate = new Date().toISOString().split('T')[0],
  isAdmin = false
}: DailyAttendanceMarkerProps) {
  const [date, setDate] = useState(initialDate);
  const [attendance, setAttendance] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    return students.reduce((acc, s) => ({ ...acc, [s.id]: "P" }), initial);
  });
  const [isHoliday, setIsHoliday] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  const setStatus = (studentId: number, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const markAllHoliday = () => {
    const newStatus = !isHoliday;
    setIsHoliday(newStatus);
    const initial: Record<number, string> = {};
    if (newStatus) {
      setAttendance(students.reduce((acc, s) => ({ ...acc, [s.id]: "H" }), initial));
    } else {
      setAttendance(students.reduce((acc, s) => ({ ...acc, [s.id]: "P" }), initial));
    }
  };

  // Fetch existing attendance when date changes
  useEffect(() => {
    const fetchExisting = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/attendance/daily?class_id=${classId}&date=${date}`);
        if (res.ok) {
          const data = await res.json();
          const initial: Record<number, string> = {};
          if (data.length > 0) {
            const newAttendance: Record<number, string> = { ...students.reduce((acc, s) => ({ ...acc, [s.id]: "P" }), initial) };
            data.forEach((r: any) => {
              if (r.studentId) newAttendance[Number(r.studentId)] = r.status;
            });
            setAttendance(newAttendance);
          } else {
            // Default to all present if no record found
            setAttendance(students.reduce((acc, s) => ({ ...acc, [s.id]: "P" }), initial));
          }
        }
      } catch (err) {
        console.error("Error fetching attendance:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExisting();
  }, [date, classId, students]);

  // Date Restrictions
  const today = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  const minDate = isAdmin ? undefined : yesterday;
  const maxDate = today;


  const handleSubmit = async () => {
    setIsSubmitting(true);
    setMessage(null);

    const records = Object.entries(attendance).map(([id, status]) => ({
      studentId: parseInt(id),
      status
    }));

    const result = await saveDailyAttendanceAction({
      classId,
      date,
      attendance: records
    });

    setIsSubmitting(false);
    if (result.success) {
      setMessage({ type: "success", text: "Attendance saved successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: "error", text: result.error || "Failed to save attendance" });
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-lg md:text-xl font-black text-slate-900 font-outfit uppercase tracking-tight flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            {className}
          </h2>
          <p className="text-[10px] md:text-xs text-slate-500 font-medium">Daily Attendance Register</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input 
            type="date" 
            value={date}
            min={minDate}
            max={maxDate}
            onChange={(e) => setDate(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={markAllHoliday}
              className={cn(
                "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border",
                isHoliday 
                  ? "bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-500/20" 
                  : "bg-white text-amber-600 border-amber-200 hover:bg-amber-50"
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              {isHoliday ? "Holiday" : "Class Holiday"}
            </button>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isLoading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSubmitting ? "..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={cn(
          "px-6 py-3 text-xs font-bold text-center animate-in fade-in zoom-in-95 duration-300",
          message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
        )}>
          {message.text}
        </div>
      )}

      <div className="relative min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-20 flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
            <span className="text-xs font-bold text-slate-500 italic">Syncing...</span>
          </div>
        )}

        <div className="overflow-x-auto pb-4">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-4 py-4 w-16">Roll</th>
                <th className="px-4 py-4">Student Name</th>
                <th className="px-4 py-4 text-center">Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-4 py-4">
                    <span className="text-xs font-black text-slate-400 group-hover:text-indigo-600">
                      {student.rollNumber || "--"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-500">
                        {student.name.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-slate-700 whitespace-nowrap">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1">
                      {[
                        { code: "P", label: "P", active: "bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-100", inactive: "text-emerald-600 bg-emerald-50 border-emerald-100" },
                        { code: "A", label: "A", active: "bg-rose-600 text-white border-rose-700 ring-2 ring-rose-100", inactive: "text-rose-600 bg-rose-50 border-rose-100" },
                        { code: "L", label: "L", active: "bg-blue-600 text-white border-blue-700", inactive: "text-blue-600 bg-blue-50 border-blue-100" },
                        { code: "ML", label: "ML", active: "bg-violet-600 text-white border-violet-700", inactive: "text-violet-600 bg-violet-50 border-violet-100" },
                        { code: "HD", label: "HD", active: "bg-amber-600 text-white border-amber-700", inactive: "text-amber-600 bg-amber-50 border-amber-100" },
                        { code: "H", label: "H", active: "bg-slate-800 text-white border-slate-900", inactive: "text-slate-500 bg-slate-50 border-slate-200" }
                      ].map((status) => (
                        <button
                          key={status.code}
                          onClick={() => setStatus(student.id, status.code)}
                          className={cn(
                            "w-8 h-8 md:w-10 md:h-10 rounded-lg text-[10px] md:text-xs font-black transition-all border flex items-center justify-center shadow-sm",
                            attendance[student.id] === status.code
                              ? status.active
                              : `${status.inactive} opacity-30 hover:opacity-100`
                          )}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            Total: {students.length}
          </span>
          <span className="text-emerald-600">
            Present: {Object.values(attendance).filter(v => v === "P").length}
          </span>
          <span className="text-rose-600">
            Absent: {Object.values(attendance).filter(v => v === "A").length}
          </span>
        </div>
      </div>
    </div>
  );
}
