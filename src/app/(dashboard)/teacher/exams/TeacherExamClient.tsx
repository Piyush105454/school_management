"use client";

import React, { useState } from "react";
import { ScrollText, Calendar, Clock, BookOpen, ChevronDown, CheckCircle2, Play, Ban } from "lucide-react";

const EXAM_TYPE_LABELS: Record<string, string> = {
  WEEKLY_TEST: "📝 Weekly Test",
  MONTHLY_TEST: "📅 Monthly Test",
  UNIT_TEST: "📖 Unit Test",
  QUARTERLY: "🗓️ Quarterly",
  HALF_YEARLY: "📋 Half Yearly",
  ANNUAL: "🏆 Annual",
  PRACTICE_TEST: "✏️ Practice",
};

const TYPE_COLORS: Record<string, string> = {
  WEEKLY_TEST: "bg-blue-100 text-blue-700",
  MONTHLY_TEST: "bg-cyan-100 text-cyan-700",
  UNIT_TEST: "bg-violet-100 text-violet-700",
  QUARTERLY: "bg-amber-100 text-amber-700",
  HALF_YEARLY: "bg-orange-100 text-orange-700",
  ANNUAL: "bg-red-100 text-red-700",
  PRACTICE_TEST: "bg-slate-100 text-slate-600",
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700 border-blue-200",
  ONGOING: "bg-amber-50 text-amber-700 border-amber-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

interface TeacherExamClientProps {
  exams: any[];
  teacher: any;
}

export default function TeacherExamClient({ exams, teacher }: TeacherExamClientProps) {
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const assignedClass = teacher?.classAssigned || "";

  // Filter by teacher's class if available
  const relevant = exams.filter(e => {
    if (assignedClass && !e.className?.toLowerCase().includes(assignedClass.toLowerCase())) return false;
    if (filterType !== "ALL" && e.examType !== filterType) return false;
    if (filterStatus !== "ALL" && e.status !== filterStatus) return false;
    return true;
  });

  const today = new Date().toISOString().split("T")[0];
  const upcoming = relevant.filter(e => e.examDate >= today && e.status === "SCHEDULED");
  const past = relevant.filter(e => e.examDate < today || e.status !== "SCHEDULED");

  const renderExamCard = (exam: any) => {
    const dateObj = new Date(exam.examDate + "T00:00:00");
    const isToday = exam.examDate === today;

    return (
      <div key={exam.id} className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all ${isToday ? "border-amber-400 ring-2 ring-amber-100" : "border-slate-200"}`}>
        {isToday && (
          <div className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full inline-block mb-2 animate-pulse">TODAY</div>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="font-black text-slate-900 text-sm">{exam.title}</div>
            <div className="flex flex-wrap gap-2 mt-1.5">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black ${TYPE_COLORS[exam.examType] || "bg-slate-100 text-slate-600"}`}>
                {EXAM_TYPE_LABELS[exam.examType] || exam.examType}
              </span>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black border ${STATUS_COLORS[exam.status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                {exam.status}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <BookOpen className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <div>
              <div className="font-bold text-slate-800">{exam.className}</div>
              <div className="text-slate-400 text-[10px]">{exam.subjectName || "All Subjects"}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Calendar className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <div>
              <div className="font-bold text-slate-800">
                {dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </div>
              <div className="text-slate-400 text-[10px]">{dateObj.toLocaleDateString("en-IN", { weekday: "long" })}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <div>
              <div className="font-bold text-slate-800">{exam.startTime} – {exam.endTime}</div>
              {exam.timetablePeriod && <div className="text-slate-400 text-[10px]">{exam.timetablePeriod}</div>}
            </div>
          </div>
          <div className="text-xs">
            <div className="font-bold text-slate-800">Max: {exam.maxMarks} marks</div>
            <div className="text-slate-400 text-[10px]">Pass: {exam.passingMarks}</div>
          </div>
        </div>

        {exam.instructions && (
          <div className="mt-3 p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-700 font-semibold">
            📋 {exam.instructions}
          </div>
        )}
        {exam.venue && exam.venue !== "Classroom" && (
          <div className="mt-2 text-[10px] text-slate-500 font-semibold">📍 Venue: {exam.venue}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-1">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <ScrollText className="h-7 w-7 text-amber-600" /> Exam & Test Schedule
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {assignedClass ? `Showing exams for ${assignedClass}` : "All upcoming and recent scheduled exams"}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <div className="text-2xl font-black text-blue-700">{upcoming.length}</div>
          <div className="text-[10px] font-bold text-blue-500 mt-1 uppercase">Upcoming</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
          <div className="text-2xl font-black text-emerald-700">{relevant.filter(e => e.status === "COMPLETED").length}</div>
          <div className="text-[10px] font-bold text-emerald-500 mt-1 uppercase">Completed</div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <div className="text-2xl font-black text-amber-700">{relevant.filter(e => e.examDate === today).length}</div>
          <div className="text-[10px] font-bold text-amber-500 mt-1 uppercase">Today</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["ALL", "WEEKLY_TEST", "MONTHLY_TEST", "UNIT_TEST", "QUARTERLY", "HALF_YEARLY", "ANNUAL"].map(type => (
          <button key={type} onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
              filterType === type ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}>
            {type === "ALL" ? "All" : EXAM_TYPE_LABELS[type] || type}
          </button>
        ))}
      </div>

      {/* Upcoming Exams */}
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-500" /> Upcoming Exams
            <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded-full">{upcoming.length}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map(renderExamCard)}
          </div>
        </div>
      )}

      {/* Past / Completed */}
      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-slate-400" /> Past / Completed
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70">
            {past.slice(0, 10).map(renderExamCard)}
          </div>
        </div>
      )}

      {relevant.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-20 text-center">
          <ScrollText className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="font-bold text-slate-400">No exams scheduled</p>
          <p className="text-xs text-slate-300 mt-1">Check back later or contact the office</p>
        </div>
      )}
    </div>
  );
}
