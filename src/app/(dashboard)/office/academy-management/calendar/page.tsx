"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  Trash2, 
  CalendarDays,
  Video,
  User2,
  Flag,
  Info
} from "lucide-react";
import { useInstitute } from "@/providers/InstituteProvider";
import { cn } from "@/lib/utils";

interface Holiday {
  id: number;
  date: string; // YYYY-MM-DD
  title: string;
  type: string;
  startTime?: string | null;
  endTime?: string | null;
  institute?: string | null;
}

interface Milestone {
  id: string;
  eventId: string;
  title: string;
  date: string;
}

interface Teacher {
  id: string;
  name: string;
}

interface SchoolEvent {
  id: string;
  title: string;
  detail: string | null;
  meetLink: string | null;
  date: string;
  createdAt: string;
  owners: Teacher[];
  milestones: Milestone[];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const { selectedInstitute } = useInstitute();
  
  // Date states for the currently displayed month
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Helper values for current calendar month
  const currentYear = currentDate.getFullYear();
  const currentMonthIdx = currentDate.getMonth();
  const currentMonthName = MONTH_NAMES[currentMonthIdx];
  
  // Fetch states
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Holiday Modal and form states
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState<boolean>(false);
  const [holidayDate, setHolidayDate] = useState<string>("");
  const [holidayTitle, setHolidayTitle] = useState<string>("");
  const [holidayType, setHolidayType] = useState<"FULL_DAY" | "HALF_DAY">("FULL_DAY");
  const [holidayInstitute, setHolidayInstitute] = useState<string>("ALL");

  // Event Modal and form states
  const [isEventModalOpen, setIsEventModalOpen] = useState<boolean>(false);
  const [eventTitle, setEventTitle] = useState<string>("");
  const [eventDate, setEventDate] = useState<string>("");
  const [eventDetail, setEventDetail] = useState<string>("");
  const [eventMeetLink, setEventMeetLink] = useState<string>("");
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [eventMilestones, setEventMilestones] = useState<Array<{ title: string; date: string }>>([]);

  // View Details Modal states
  const [selectedEventForView, setSelectedEventForView] = useState<SchoolEvent | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Fetch holidays list
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

      // 3. Fetch teachers list for dropdown selection
      const teachersRes = await fetch("/api/teachers");
      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        setTeachers(teachersData || []);
      }
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

  // Open Holiday Modal
  const handleOpenHolidayModal = (dateStr: string) => {
    setHolidayDate(dateStr);
    setHolidayTitle("");
    setHolidayType("FULL_DAY");
    setHolidayInstitute(selectedInstitute && selectedInstitute !== "ALL" ? selectedInstitute : "ALL");
    setActionError(null);
    setActionSuccess(null);
    setIsHolidayModalOpen(true);
  };

  // Open Event Modal
  const handleOpenEventModal = (dateStr: string) => {
    setEventDate(dateStr || "");
    setEventTitle("");
    setEventDetail("");
    setEventMeetLink("");
    setSelectedOwners([]);
    setEventMilestones([]);
    setActionError(null);
    setActionSuccess(null);
    setIsEventModalOpen(true);
  };

  const handleSaveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayDate || !holidayTitle.trim()) {
      setActionError("Please enter date and holiday title.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: holidayDate,
          title: holidayTitle.trim(),
          type: holidayType,
          institute: holidayInstitute
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save holiday");
      }

      setActionSuccess("Holiday saved successfully!");
      setHolidayTitle("");
      fetchCalendarData(currentYear);
    } catch (err: any) {
      setActionError(err.message || "Failed to save holiday");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDate || !eventTitle.trim()) {
      setActionError("Please enter date and event title.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventTitle.trim(),
          detail: eventDetail.trim(),
          date: eventDate,
          meetLink: eventMeetLink.trim(),
          owners: selectedOwners,
          milestones: eventMilestones.filter(m => m.title.trim() && m.date)
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save event");
      }

      setActionSuccess("School event with review milestones saved successfully!");
      setIsEventModalOpen(false);
      fetchCalendarData(currentYear);
    } catch (err: any) {
      setActionError(err.message || "Failed to save event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    if (!confirm("Are you sure you want to remove this holiday? This will also update student attendance in the background.")) return;
    
    try {
      setActionError(null);
      setActionSuccess(null);
      const res = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "delete" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove holiday");
      
      setActionSuccess("Holiday deleted successfully.");
      fetchCalendarData(currentYear);
    } catch (err: any) {
      setActionError(err.message || "Failed to delete holiday");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event? This will also remove all its review milestones.")) return;

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, action: "DELETE" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete event");

      setIsViewModalOpen(false);
      fetchCalendarData(currentYear);
    } catch (err: any) {
      alert(err.message || "Failed to delete event");
    }
  };

  // Filter holidays by calendar days (YYYY-MM-DD check)
  const getHolidaysForDate = (year: number, monthIdx: number, dayNum: number) => {
    const formattedDate = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return holidays.filter(h => h.date === formattedDate);
  };

  // Filter events and milestones for cell date
  const getEventsForDate = (year: number, monthIdx: number, dayNum: number) => {
    const formattedDate = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return events.filter(e => e.date === formattedDate);
  };

  const getMilestonesForDate = (year: number, monthIdx: number, dayNum: number) => {
    const formattedDate = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const allMilestones: Array<{ milestone: Milestone; event: SchoolEvent }> = [];
    events.forEach(event => {
      if (event.milestones) {
        event.milestones.forEach(m => {
          if (m.date === formattedDate) {
            allMilestones.push({ milestone: m, event });
          }
        });
      }
    });
    return allMilestones;
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
            School Event & Holiday Calendar
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Manage holidays, schedule school events, and track review milestones dynamically.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleToday}
            className="px-4 py-2 text-sm font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
          >
            Today
          </button>
          <button 
            onClick={() => handleOpenHolidayModal("")}
            className="px-4 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition flex items-center gap-1.5 shadow-sm border-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Set Holiday
          </button>
          <button 
            onClick={() => handleOpenEventModal("")}
            className="px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center gap-1.5 shadow-sm border-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Event
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
            Active School Filter: <span className="text-indigo-600 font-bold">{selectedInstitute === "ALL" ? "All Schools" : selectedInstitute}</span>
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
            <span className="text-sm font-semibold text-slate-500">Loading school calendar...</span>
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
              const dayMilestones = getMilestonesForDate(cell.year, cell.monthIdx, cell.dayNum);
              const isCellToday = isToday(cell.year, cell.monthIdx, cell.dayNum);
              const isCurrentMonth = cell.monthOffset === 0;

              // Format date string for this grid cell
              const cellDateStr = `${cell.year}-${String(cell.monthIdx + 1).padStart(2, '0')}-${String(cell.dayNum).padStart(2, '0')}`;

              return (
                <div 
                  key={`${cell.year}-${cell.monthIdx}-${cell.dayNum}-${idx}`} 
                  onClick={() => handleOpenEventModal(cellDateStr)}
                  className={cn(
                    "min-h-[110px] p-2 hover:bg-slate-50/40 cursor-pointer flex flex-col justify-between transition duration-150 relative group",
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

                  {/* Render Holidays, Events, and Milestones inside the Day Cell */}
                  <div className="mt-2 space-y-1.5 z-10">
                    {/* 1. Holidays */}
                    {dayHolidays.map(hol => {
                      const isFullDay = hol.type === "FULL_DAY";
                      const instLabel = hol.institute ? (hol.institute.includes("WES") ? "WES" : "DPS") : "BOTH";
                      
                      return (
                        <div 
                          key={hol.id} 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenHolidayModal(hol.date);
                          }}
                          title={`${hol.title} (${hol.type}) - ${hol.institute || "All Schools"}`}
                          className={cn(
                            "text-[10px] font-bold p-1 rounded border leading-tight shadow-2xs flex justify-between items-start gap-1 break-words whitespace-normal cursor-pointer",
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

                    {/* 2. Events */}
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

                    {/* 3. Milestones */}
                    {dayMilestones.map(dm => (
                      <div 
                        key={dm.milestone.id} 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventForView(dm.event);
                          setIsViewModalOpen(true);
                        }}
                        title={`Milestone: ${dm.milestone.title} (Event: ${dm.event.title})`}
                        className="text-[10px] font-bold p-1 rounded border leading-tight shadow-2xs flex justify-between items-start gap-1 bg-purple-50 text-purple-700 border-purple-100 break-words whitespace-normal cursor-pointer"
                      >
                        <span className="flex-1 min-w-0 break-words whitespace-normal">🏁 {dm.milestone.title}</span>
                      </div>
                    ))}
                  </div>

                  {/* Hover Cell Overlay Action */}
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition duration-150">
                    <Plus className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Set Holiday Modal */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-rose-500" />
                Set School Holiday
              </h2>
              <button 
                onClick={() => setIsHolidayModalOpen(false)}
                className="p-1.5 hover:bg-slate-150 text-slate-400 hover:text-slate-600 rounded-lg transition border-0 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {actionError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-start gap-2 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{actionError}</span>
                </div>
              )}

              {actionSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl flex items-start gap-2 text-xs font-semibold">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveHoliday} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Select Date *
                    </label>
                    <input 
                      type="date" 
                      value={holidayDate}
                      onChange={(e) => setHolidayDate(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Holiday Type
                    </label>
                    <select
                      value={holidayType}
                      onChange={(e) => setHolidayType(e.target.value as "FULL_DAY" | "HALF_DAY")}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="FULL_DAY">Full Day</option>
                      <option value="HALF_DAY">Half Day</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Holiday Title *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Good Friday, Diwali"
                    value={holidayTitle}
                    onChange={(e) => setHolidayTitle(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Applies To School
                  </label>
                  <select
                    value={holidayInstitute}
                    onChange={(e) => setHolidayInstitute(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="ALL">Apply to Both Schools</option>
                    <option value="Dhanpuri Public School">Dhanpuri Public School Only</option>
                    <option value="WES Academy">WES Academy Only</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm text-sm border-0 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving Holiday...
                    </>
                  ) : (
                    "Save Holiday"
                  )}
                </button>
              </form>

              {/* List of Scheduled Holidays */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Scheduled Holidays ({currentMonthName} {currentYear})
                </h3>
                
                {(() => {
                  const monthHolidays = holidays.filter(h => {
                    if (!h.date) return false;
                    const parts = h.date.split("-");
                    return parseInt(parts[0]) === currentYear && parseInt(parts[1]) === (currentMonthIdx + 1);
                  });

                  if (monthHolidays.length === 0) {
                    return (
                      <p className="text-xs text-slate-400 italic font-medium py-2">
                        No holidays scheduled for this month.
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {monthHolidays.map(hol => {
                        const isFull = hol.type === "FULL_DAY";
                        const formattedDateStr = (() => {
                          const dateObj = new Date(hol.date);
                          const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
                          return dateObj.toLocaleDateString('en-GB', options);
                        })();

                        return (
                          <div 
                            key={hol.id}
                            className="bg-slate-50 border border-slate-150 p-3 rounded-xl flex justify-between items-center"
                          >
                            <div className="space-y-0.5">
                              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                {hol.title.toUpperCase()}
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded text-[8px] font-black uppercase",
                                  isFull ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                                )}>
                                  {isFull ? "Full Day" : "Half Day"}
                                </span>
                              </h4>
                              <p className="text-xs text-slate-500 font-medium">
                                {formattedDateStr} • {hol.institute || "All Schools"}
                              </p>
                            </div>
                            <button 
                              onClick={() => handleDeleteHoliday(hol.id)}
                              className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-rose-600 rounded-lg transition border-0 cursor-pointer bg-transparent"
                              title="Delete Holiday"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Set School Event Modal */}
      {isEventModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-indigo-500" />
                Schedule School Event
              </h2>
              <button 
                onClick={() => setIsEventModalOpen(false)}
                className="p-1.5 hover:bg-slate-150 text-slate-400 hover:text-slate-600 rounded-lg transition border-0 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {actionError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-start gap-2 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{actionError}</span>
                </div>
              )}

              <form onSubmit={handleSaveEvent} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Event Date *
                    </label>
                    <input 
                      type="date" 
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Meet Link (Google Meet)
                    </label>
                    <input 
                      type="url"
                      placeholder="https://meet.google.com/..."
                      value={eventMeetLink}
                      onChange={(e) => setEventMeetLink(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Event Title *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Sports Day, Science Exhibition"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Event Details / Description
                  </label>
                  <textarea 
                    rows={3}
                    placeholder="Provide details about the event plan..."
                    value={eventDetail}
                    onChange={(e) => setEventDetail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Event Owners (Teachers)
                  </label>
                  <div className="border border-slate-200 rounded-xl p-3 max-h-[150px] overflow-y-auto bg-slate-50 space-y-1">
                    {teachers.map(t => (
                      <label key={t.id} className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-100 p-1.5 rounded-lg transition">
                        <input 
                          type="checkbox" 
                          checked={selectedOwners.includes(t.id)} 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOwners([...selectedOwners, t.id]);
                            } else {
                              setSelectedOwners(selectedOwners.filter(id => id !== t.id));
                            }
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                        />
                        {t.name}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Milestones Add Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Review Milestones (Dates mapped to calendar)
                    </label>
                    <button
                      type="button"
                      onClick={() => setEventMilestones([...eventMilestones, { title: "", date: "" }])}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-transparent border-0 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Milestone
                    </button>
                  </div>
                  
                  {eventMilestones.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No review milestones added yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {eventMilestones.map((ms, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <input 
                            type="date"
                            value={ms.date}
                            required
                            onChange={(e) => {
                              const updated = [...eventMilestones];
                              updated[idx].date = e.target.value;
                              setEventMilestones(updated);
                            }}
                            className="bg-white border border-slate-200 px-2 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 w-[130px]"
                          />
                          <input 
                            type="text"
                            placeholder="Milestone Title"
                            value={ms.title}
                            required
                            onChange={(e) => {
                              const updated = [...eventMilestones];
                              updated[idx].title = e.target.value;
                              setEventMilestones(updated);
                            }}
                            className="flex-1 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => setEventMilestones(eventMilestones.filter((_, i) => i !== idx))}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition border-0 bg-transparent cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm text-sm border-0 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving Event...
                    </>
                  ) : (
                    "Save Event & Milestones"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Event & Milestones Details Modal */}
      {isViewModalOpen && selectedEventForView && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
                <Info className="h-5 w-5 text-indigo-600" />
                Event Details
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
                    Event Description
                  </h4>
                  <p className="text-sm font-semibold text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selectedEventForView.detail}
                  </p>
                </div>
              )}

              {selectedEventForView.meetLink && (
                <div className="flex items-center gap-3 bg-emerald-50/70 border border-emerald-100 p-4 rounded-2xl">
                  <Video className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider">
                      Google Meet Link
                    </h4>
                    <a 
                      href={selectedEventForView.meetLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-emerald-600 underline break-all hover:text-emerald-700"
                    >
                      {selectedEventForView.meetLink}
                    </a>
                  </div>
                </div>
              )}

              {selectedEventForView.owners && selectedEventForView.owners.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Event Owners / Coordinators
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEventForView.owners.map(owner => (
                      <span key={owner.id} className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <User2 className="h-3.5 w-3.5 text-slate-500" />
                        {owner.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedEventForView.milestones && selectedEventForView.milestones.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Review Milestones Timeline
                  </h4>
                  <div className="space-y-3 border-l-2 border-indigo-100 pl-4 ml-2">
                    {selectedEventForView.milestones.map((ms, idx) => (
                      <div key={ms.id} className="relative space-y-1">
                        <div className="absolute -left-[25px] top-0.5 h-3.5 w-3.5 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center">
                          <Flag className="h-1.5 w-1.5 text-white" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-indigo-600">
                          {ms.date}
                        </span>
                        <p className="text-sm font-black text-slate-800">
                          {ms.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleDeleteEvent(selectedEventForView.id)}
                  className="px-4 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-bold hover:bg-rose-100 hover:text-rose-700 transition flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
