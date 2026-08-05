"use client";

import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  AlertCircle, 
  Building2, 
  CalendarDays,
  Info,
  X
} from "lucide-react";
import { useInstitute } from "@/providers/InstituteProvider";
import { cn } from "@/lib/utils";

interface Holiday {
  id: number;
  date: string; // YYYY-MM-DD
  title: string;
  type: string;
  institute?: string | null;
}

interface SchoolEvent {
  id: string;
  title: string;
  date: string;
  detail?: string | null;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StudentCalendarPage() {
  const { selectedInstitute } = useInstitute();
  
  // Date states for the currently displayed month
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Helper values for current calendar month
  const currentYear = currentDate.getFullYear();
  const currentMonthIdx = currentDate.getMonth();
  const currentMonthName = MONTH_NAMES[currentMonthIdx];
  
  // Data states
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // View Details Modal states
  const [selectedEventForView, setSelectedEventForView] = useState<SchoolEvent | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);

  // Fetch holidays and events list
  const fetchCalendarData = async (year: number) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch holidays
      const holidaysRes = await fetch(`/api/holidays?year=${year}`);
      if (!holidaysRes.ok) throw new Error("Failed to load school holidays list.");
      const holidaysData = await holidaysRes.json();
      setHolidays(holidaysData || []);

      // 2. Fetch events
      const eventsRes = await fetch("/api/events");
      if (!eventsRes.ok) throw new Error("Failed to load events.");
      const eventsData = await eventsRes.json();
      setEvents(eventsData.success ? eventsData.data : []);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData(currentYear);
  }, [currentYear]);

  // Calendar calculations
  const firstDayOfMonth = new Date(currentYear, currentMonthIdx, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonthIdx, 0).getDate();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonthIdx - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonthIdx + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filter holidays by calendar days (YYYY-MM-DD check)
  const getHolidaysForDate = (year: number, monthIdx: number, dayNum: number) => {
    const formattedDate = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return holidays.filter(h => h.date === formattedDate);
  };

  // Filter events for cell date
  const getEventsForDate = (year: number, monthIdx: number, dayNum: number) => {
    const formattedDate = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return events.filter(e => e.date === formattedDate);
  };

  // Check if a date string is today
  const isToday = (year: number, monthIdx: number, dayNum: number) => {
    const today = new Date();
    return today.getDate() === dayNum && today.getMonth() === monthIdx && today.getFullYear() === year;
  };

  // Generate calendar grid array
  const calendarCells = [];
  
  // Previous month padding cells
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarCells.push({
      dayNum: daysInPrevMonth - i,
      monthOffset: -1,
      monthIdx: currentMonthIdx === 0 ? 11 : currentMonthIdx - 1,
      year: currentMonthIdx === 0 ? currentYear - 1 : currentYear
    });
  }

  // Current month cells
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({
      dayNum: i,
      monthOffset: 0,
      monthIdx: currentMonthIdx,
      year: currentYear
    });
  }

  // Next month padding cells
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({
      dayNum: i,
      monthOffset: 1,
      monthIdx: currentMonthIdx === 11 ? 0 : currentMonthIdx + 1,
      year: currentMonthIdx === 11 ? currentYear + 1 : currentYear
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <CalendarDays className="h-7 w-7 text-indigo-600" />
            School Calendar & Events
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Stay updated with school events, holidays, and academic schedules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleToday}
            className="px-4 py-2 text-sm font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
          >
            Today
          </button>
        </div>
      </div>

      {/* Main Calendar Section */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        {/* Month selector toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-1">
            <button 
              onClick={handlePrevMonth}
              className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition"
              aria-label="Previous Month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button 
              onClick={handleNextMonth}
              className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition"
              aria-label="Next Month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="text-lg font-black text-slate-900 ml-2">
              {currentMonthName} {currentYear}
            </span>
          </div>

          <div className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-indigo-500" />
            School: <span className="text-indigo-600 font-bold">{selectedInstitute === "ALL" ? "Both Schools" : selectedInstitute}</span>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-200 text-center bg-slate-50/70 text-slate-700 font-bold text-xs py-3">
          {WEEK_DAYS.map((day, idx) => (
            <div key={day} className={cn("uppercase tracking-wider", (idx === 0 || idx === 6) && "text-slate-400")}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days grid */}
        {loading ? (
          <div className="py-32 flex flex-col justify-center items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="text-sm font-semibold text-slate-500">Loading calendar events...</span>
          </div>
        ) : error ? (
          <div className="py-24 text-center max-w-md mx-auto space-y-3">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
            <p className="text-sm font-bold text-slate-800">{error}</p>
            <button onClick={() => fetchCalendarData(currentYear)} className="text-xs font-bold text-indigo-600 underline">Try again</button>
          </div>
        ) : (
          <div className="grid grid-cols-7 grid-rows-6 auto-rows-fr divide-x divide-y divide-slate-100">
            {calendarCells.map((cell, idx) => {
              const dayHolidays = getHolidaysForDate(cell.year, cell.monthIdx, cell.dayNum);
              const dayEvents = getEventsForDate(cell.year, cell.monthIdx, cell.dayNum);
              const isCellToday = isToday(cell.year, cell.monthIdx, cell.dayNum);
              const isCurrentMonth = cell.monthOffset === 0;

              return (
                <div 
                  key={`${cell.year}-${cell.monthIdx}-${cell.dayNum}-${idx}`} 
                  className={cn(
                    "min-h-[110px] p-2 flex flex-col justify-between relative group",
                    !isCurrentMonth && "bg-slate-50/30 text-slate-300"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <span className={cn(
                      "text-sm font-black rounded-lg px-2 py-1 flex items-center justify-center",
                      isCellToday && "bg-indigo-600 text-white shadow-sm scale-105",
                      isCurrentMonth && !isCellToday && "text-slate-800",
                      !isCurrentMonth && "text-slate-300"
                    )}>
                      {cell.dayNum}
                    </span>
                  </div>

                  {/* Render Holidays and Events inside the Day Cell */}
                  <div className="mt-2 space-y-1.5 z-10">
                    {/* 1. Holidays */}
                    {dayHolidays.map(hol => {
                      const isFullDay = hol.type === "FULL_DAY";
                      const instLabel = hol.institute ? (hol.institute.includes("WES") ? "WES" : "DPS") : "BOTH";
                      
                      return (
                        <div 
                          key={hol.id} 
                          title={`${hol.title} (${hol.type}) - ${hol.institute || "All Schools"}`}
                          className={cn(
                            "text-[10px] font-bold p-1 rounded border leading-tight shadow-2xs flex justify-between items-start gap-1 break-words whitespace-normal",
                            isFullDay 
                              ? "bg-rose-50 text-rose-700 border-rose-100" 
                              : "bg-amber-50 text-amber-700 border-amber-100"
                          )}
                        >
                          <span className="flex-1 min-w-0 break-words whitespace-normal">{hol.title}</span>
                          <span className={cn(
                            "px-1 py-0.25 text-[8px] font-black rounded uppercase flex-shrink-0 scale-90 mt-0.5",
                            isFullDay 
                              ? "bg-rose-100 text-rose-800" 
                              : "bg-amber-100 text-amber-800"
                          )}>
                            {instLabel}
                          </span>
                        </div>
                      );
                    })}

                    {/* 2. Events (Visible to Students) */}
                    {dayEvents.map(evt => (
                      <div 
                        key={evt.id} 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventForView(evt);
                          setIsViewModalOpen(true);
                        }}
                        title={`${evt.title} - Click to view details`}
                        className="text-[10px] font-bold p-1 rounded border leading-tight shadow-2xs flex justify-between items-start gap-1 bg-indigo-50 text-indigo-700 border-indigo-100 break-words whitespace-normal cursor-pointer"
                      >
                        <span className="flex-1 min-w-0 break-words whitespace-normal">📅 {evt.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* View Event Details Modal (Student / Parent View) */}
      {isViewModalOpen && selectedEventForView && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
                <Info className="h-5 w-5 text-indigo-600" />
                School Event
              </h2>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="p-1.5 hover:bg-slate-150 text-slate-400 hover:text-slate-600 rounded-lg transition border-0 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {selectedEventForView.date}
                </span>
                <h3 className="text-xl font-black text-slate-950 pt-1">
                  {selectedEventForView.title}
                </h3>
              </div>

              {selectedEventForView.detail && (
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">
                    Event Details
                  </h4>
                  <p className="text-sm font-semibold text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selectedEventForView.detail}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
